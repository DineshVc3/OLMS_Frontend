import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';

// ================== LEARNER INTERFACES ==================

export interface EnrolledCourse {
  courseId: number;
  title: string;
  description: string;
  instructorName: string;
  instructorEmail: string;
  enrolledAt: string;
  status?: 'Not Started' | 'In Progress' | 'Completed';
  progressPercentage?: number;
  totalQuizzes?: number;
  completedQuizzes?: number;
  passedQuizzes?: number;
}

export interface LearnerCourseContent {
  courseId: number;
  courseTitle: string;
  materials: CourseMaterial[];
  quizzes: QuizSummary[];
}

export interface CourseMaterial {
  dataId: number;
  title: string;
  filePath: string;
  type: string;
}

export interface QuizSummary {
  quizId: number;
  title: string;
  totalMarks: number;
  attempted?: boolean;
  score?: number;
  status?: 'Not Attempted' | 'Passed' | 'Failed';
  percentage?: number;
}

export interface QuizAttempt {
  quizId: number;
  courseId: number;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  questionId: number;
  response: string; // A, B, C, or D
}

export interface QuizResult {
  quizId: number;
  score: number;
  totalMarks: number;
  percentage: number;
  status: 'Passed' | 'Failed';
  message: string;
}

export interface LearnerProgress {
  learnerId: number;
  learnerName: string;
  quizId: number;
  quizTitle: string;
  score: number;
  totalMarks: number;
  status: string;
}

// ================== QUIZ TAKING INTERFACES ==================

export interface QuizForAttempt {
  quizId: number;
  title: string;
  totalMarks: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  questionId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
}

@Injectable({
  providedIn: 'root'
})
export class LearnerService {
  private apiUrl = 'http://localhost:5255/api';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiry;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  // Get user role from token (simplified)
  getUserRole(): string {
    const token = sessionStorage.getItem('token');
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
             payload['role'] || 
             payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'] || '';
    } catch (error) {
      console.error('Error parsing token:', error);
      return '';
    }
  }

  // Get user email from token
  getUserEmail(): string {
    const token = sessionStorage.getItem('token');
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
             payload['name'] || 
             payload['email'] || '';
    } catch (error) {
      console.error('Error parsing token:', error);
      return '';
    }
  }

  // ================== ENROLLED COURSES ==================

  // Get all enrolled courses for the learner
  getEnrolledCourses(): Observable<EnrolledCourse[]> {
    const headers = this.getAuthHeaders();
    
    // Use the working CourseAssignment endpoint directly
    return this.http.get<EnrolledCourse[]>(`${this.apiUrl}/CourseAssignment/my-courses`, { headers }).pipe(
      tap(courses => console.log('✅ Enrolled courses loaded:', courses)),
      catchError(error => {
        console.log('⚠️ CourseAssignment failed, trying Course endpoint...', error);
        
        // Fallback to Course endpoint
        return this.http.get<EnrolledCourse[]>(`${this.apiUrl}/Course/learner-courses`, { headers }).pipe(
          tap(courses => console.log('✅ Course endpoint success:', courses)),
          catchError(error2 => {
            console.error('❌ All endpoints failed:', error2);
            throw error2;
          })
        );
      })
    );
  }

  // Get dashboard statistics (course completion stats)
  getDashboardStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/Learner/dashboard-stats`, { headers }).pipe(
      tap(stats => console.log('✅ Dashboard stats loaded:', stats)),
      catchError(error => {
        console.error('❌ Error loading dashboard stats:', error);
        throw error;
      })
    );
  }

  // Get specific course details by ID
  getCourseDetails(courseId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/Course/${courseId}`, { headers }).pipe(
      tap(course => console.log('Course details loaded:', course)),
      catchError(error => {
        console.error('Error loading course details:', error);
        throw error;
      })
    );
  }

  // Get aggregated progress for a specific course using Progress API
  getCourseProgress(courseId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/Progress/aggregated/course/${courseId}`, { headers }).pipe(
      tap(progress => console.log('✅ Course progress loaded:', progress)),
      catchError(error => {
        console.error('❌ Error loading course progress:', error);
        return of([]);
      })
    );
  }

  // Get enhanced enrolled courses with proper progress calculation
  getEnrolledCoursesWithProgress(): Observable<EnrolledCourse[]> {
    return this.getEnrolledCourses().pipe(
      switchMap(courses => {
        if (!courses || courses.length === 0) {
          return of([]);
        }

        // Get progress for each course and combine with course data
        const progressObservables = courses.map(course => 
          this.getCourseProgress(course.courseId).pipe(
            map(progressData => {
              // Find this learner's progress in the aggregated data
              const learnerProgress = progressData.find((p: any) => 
                p.learnerId === this.getCurrentLearnerId()
              );

              if (learnerProgress) {
                const totalQuizzes = learnerProgress.quizStatuses?.length || 0;
                
                // Count quizzes that have been attempted (have a status other than 'Pending')
                const attemptedQuizzes = learnerProgress.quizStatuses?.filter((q: any) => 
                  q.status && q.status.toLowerCase() !== 'pending'
                ).length || 0;

                // Count quizzes that are completed/passed (any successful completion)
                const completedQuizzes = learnerProgress.quizStatuses?.filter((q: any) => 
                  q.status && (
                    q.status.toLowerCase() === 'completed' || 
                    q.status.toLowerCase() === 'passed'
                  )
                ).length || 0;

                // Calculate progress percentage based on attempted quizzes vs total quizzes
                const progressPercentage = totalQuizzes > 0 
                  ? Math.round((completedQuizzes / totalQuizzes) * 100)
                  : 0;

                // Determine status based on quiz completion
                let status: 'Not Started' | 'In Progress' | 'Completed' = 'Not Started';
                if (totalQuizzes === 0) {
                  status = 'Not Started';
                } else if (completedQuizzes === totalQuizzes) {
                  status = 'Completed';
                } else if (attemptedQuizzes > 0) {
                  status = 'In Progress';
                }

                return {
                  ...course,
                  progressPercentage: progressPercentage,
                  totalQuizzes: totalQuizzes,
                  completedQuizzes: completedQuizzes,
                  passedQuizzes: completedQuizzes, // Completed quizzes are considered passed
                  status: status
                };
              }

              return {
                ...course,
                progressPercentage: 0,
                totalQuizzes: 0,
                completedQuizzes: 0,
                passedQuizzes: 0,
                status: 'Not Started' as const
              };
            }),
            catchError(() => of({
              ...course,
              progressPercentage: 0,
              totalQuizzes: 0,
              completedQuizzes: 0,
              passedQuizzes: 0,
              status: 'Not Started' as const
            }))
          )
        );

        return forkJoin(progressObservables);
      })
    );
  }

  // Helper method to get current learner ID from token
  private getCurrentLearnerId(): number {
    const token = sessionStorage.getItem('token');
    if (!token) return 0;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 
                     payload['nameid'] || 
                     payload['sub'] || '0');
    } catch (error) {
      console.error('Error parsing learner ID from token:', error);
      return 0;
    }
  }

  // Get course data/materials for a specific course
  getCourseData(courseId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    
    // Debug: Log JWT token details
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 DEBUG - Course Data Request:');
        console.log('- JWT Token Payload:', payload);
        console.log('- User Role:', this.getUserRole());
        console.log('- User Email:', this.getUserEmail());
        console.log('- User ID from JWT:', payload.nameid || payload.sub || 'NOT_FOUND');
        console.log('- Course ID being requested:', courseId);
        console.log('- Backend URL:', `${this.apiUrl}/CourseData/course/${courseId}/data`);
        console.log('- Current timestamp:', new Date().toISOString());
      } catch (error) {
        console.error('Error parsing JWT token:', error);
      }
    }
    
    return this.http.get<any>(`${this.apiUrl}/CourseData/course/${courseId}/data`, { headers }).pipe(
      tap(content => console.log('Course data loaded:', content)),
      catchError(error => {
        console.error('Error loading course data:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        throw error;
      })
    );
  }

  // ================== COURSE CONTENT ==================

  // Get course content and quizzes for a specific course
  getCourseContent(courseId: number): Observable<LearnerCourseContent> {
    const headers = this.getAuthHeaders();
    return this.http.get<LearnerCourseContent>(`${this.apiUrl}/Progress/learner/course/${courseId}`, { headers }).pipe(
      tap(content => console.log('Course content loaded:', content)),
      catchError(error => {
        console.error('Error loading course content:', error);
        throw error;
      })
    );
  }

  // ================== QUIZ FUNCTIONALITY ==================

  // Get quiz for attempt (questions without correct answers)
  getQuizForAttempt(quizId: number): Observable<QuizForAttempt> {
    const headers = this.getAuthHeaders();
    return this.http.get<QuizForAttempt>(`${this.apiUrl}/Quiz/attempt/${quizId}`, { headers }).pipe(
      tap(quiz => console.log('Quiz loaded for attempt:', quiz)),
      catchError(error => {
        console.error('Error loading quiz for attempt:', error);
        throw error;
      })
    );
  }

  // Submit quiz attempt
  submitQuiz(quizAttempt: QuizAttempt): Observable<QuizResult> {
    const headers = this.getAuthHeaders();
    return this.http.post<QuizResult>(`${this.apiUrl}/Quiz/submit`, quizAttempt, { headers }).pipe(
      tap(result => console.log('Quiz submitted successfully:', result)),
      catchError(error => {
        console.error('Error submitting quiz:', error);
        throw error;
      })
    );
  }

  // ================== PROGRESS TRACKING ==================

  // Get learner's progress for a specific quiz
  getQuizProgress(quizId: number): Observable<LearnerProgress> {
    const headers = this.getAuthHeaders();
    return this.http.get<LearnerProgress>(`${this.apiUrl}/Quiz/learner/result/${quizId}`, { headers }).pipe(
      tap(progress => console.log('✅ Quiz progress loaded:', progress)),
      catchError(error => {
        console.log('❌ No quiz progress found (may not be attempted yet):', error);
        return of(null as any);
      })
    );
  }

  // Calculate course status based on quiz performance
  calculateCourseStatus(quizzes: QuizSummary[]): 'Not Started' | 'In Progress' | 'Completed' {
    if (!quizzes || quizzes.length === 0) return 'Not Started';
    
    const attemptedQuizzes = quizzes.filter(q => q.attempted);
    const passedQuizzes = quizzes.filter(q => q.status === 'Passed');
    
    if (attemptedQuizzes.length === 0) return 'Not Started';
    if (passedQuizzes.length === quizzes.length) return 'Completed';
    return 'In Progress';
  }

  // Calculate progress percentage
  calculateProgressPercentage(quizzes: QuizSummary[]): number {
    if (!quizzes || quizzes.length === 0) return 0;
    
    const passedQuizzes = quizzes.filter(q => q.status === 'Passed').length;
    return Math.round((passedQuizzes / quizzes.length) * 100);
  }

  // Check if quiz score is passing (70% or above)
  isPassingScore(score: number, totalMarks: number): boolean {
    const percentage = (score / totalMarks) * 100;
    return percentage >= 70;
  }

  // Get status badge class for UI
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Completed': return 'badge-success';
      case 'In Progress': return 'badge-warning';
      case 'Not Started': return 'badge-secondary';
      case 'Passed': return 'badge-success';
      case 'Failed': return 'badge-danger';
      default: return 'badge-light';
    }
  }

  // Debug methods for testing
  testJwtInfo(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/Test/jwt-info`, { headers }).pipe(
      tap(info => console.log('JWT Info:', info)),
      catchError(error => {
        console.error('Error getting JWT info:', error);
        throw error;
      })
    );
  }

  testEnrollment(courseId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/Test/check-enrollment/${courseId}`, { headers }).pipe(
      tap(result => console.log('Enrollment check:', result)),
      catchError(error => {
        console.error('Error checking enrollment:', error);
        throw error;
      })
    );
  }
} 