import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface QuizCompletionLog {
  logId?: number;
  learnerId: number;
  learnerName: string;
  courseId: number;
  courseTitle: string;
  quizId: number;
  quizTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: 'Passed' | 'Failed' | 'Completed';
  completedAt: Date;
  timeSpent?: number; // in minutes
  attemptNumber: number;
}

export interface CourseCompletionStatus {
  learnerId: number;
  learnerName: string;
  courseId: number;
  courseTitle: string;
  completedQuizzes: number;
  totalQuizzes: number;
  overallPercentage: number;
  completionStatus: 'Not Started' | 'In Progress' | 'Completed';
  completedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class QuizCompletionService {
  private apiUrl = 'http://localhost:5255/api';
  
  // Subject to track real-time completion updates
  private completionUpdates$ = new BehaviorSubject<QuizCompletionLog | null>(null);
  public completionUpdates = this.completionUpdates$.asObservable();

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Log quiz completion when a student completes a quiz (sessionStorage only)
  logQuizCompletion(completionData: QuizCompletionLog): Observable<any> {
    console.log('📝 Logging quiz completion:', completionData);
    
    // Emit the completion update for real-time tracking
    this.completionUpdates$.next(completionData);
    
    // Store quiz completion locally instead of calling backend
    this.storeQuizCompletionLocally(completionData);
    
    // Return successful observable since we're not using backend
    return new Observable(observer => {
      observer.next({ success: true, message: 'Quiz completion logged locally' });
      observer.complete();
    });
  }

  // Get quiz completion logs for an instructor's courses
  getInstructorQuizCompletions(instructorId: number): Observable<QuizCompletionLog[]> {
    return this.http.get<QuizCompletionLog[]>(`${this.apiUrl}/QuizCompletion/instructor/${instructorId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get quiz completion logs for a specific course
  getCourseQuizCompletions(courseId: number): Observable<QuizCompletionLog[]> {
    return this.http.get<QuizCompletionLog[]>(`${this.apiUrl}/QuizCompletion/course/${courseId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get completion status for all students in a course
  getCourseCompletionStatus(courseId: number): Observable<CourseCompletionStatus[]> {
    return this.http.get<CourseCompletionStatus[]>(`${this.apiUrl}/QuizCompletion/course/${courseId}/status`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get overall completion statistics for admin/superadmin
  getOverallCompletionStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/QuizCompletion/stats/overall`, {
      headers: this.getAuthHeaders()
    });
  }

  // Mark course as completed for a student (sessionStorage only)
  markCourseCompleted(learnerId: number, courseId: number): Observable<any> {
    const completionData = {
      learnerId,
      courseId,
      completedAt: new Date()
    };
    
    console.log('✅ Marking course as completed:', completionData);
    
    // Store course completion locally instead of calling backend
    this.storeCourseCompletionLocally(completionData);
    
    // Return successful observable since we're not using backend
    return new Observable(observer => {
      observer.next({ success: true, message: 'Course completion logged locally' });
      observer.complete();
    });
  }

  // Store quiz completion in sessionStorage
  private storeQuizCompletionLocally(completionData: QuizCompletionLog): void {
    try {
      // Store individual quiz completions for detailed tracking
      const quizCompletions = JSON.parse(sessionStorage.getItem('quizCompletions') || '[]');
      quizCompletions.push({
        ...completionData,
        timestamp: new Date().toISOString()
      });
      sessionStorage.setItem('quizCompletions', JSON.stringify(quizCompletions));
      console.log('📝 Quiz completion stored locally:', completionData);
    } catch (error) {
      console.error('❌ Failed to store quiz completion locally:', error);
    }
  }

  // Store course completion in sessionStorage  
  private storeCourseCompletionLocally(completionData: any): void {
    try {
      // This is the main completion data that admin reports will read
      const completedCourses = JSON.parse(sessionStorage.getItem('completedCourses') || '[]');
      
      // Check if this course completion already exists for this learner
      const existingIndex = completedCourses.findIndex((c: any) => 
        c.learnerId === completionData.learnerId && c.courseId === completionData.courseId
      );
      
      if (existingIndex === -1) {
        // Add new completion
        completedCourses.push({
          learnerId: completionData.learnerId,
          courseId: completionData.courseId,
          completedAt: completionData.completedAt.toISOString()
        });
        sessionStorage.setItem('completedCourses', JSON.stringify(completedCourses));
        console.log('✅ Course completion stored locally:', completionData);
      } else {
        console.log('ℹ️ Course completion already exists for this learner and course');
      }
    } catch (error) {
      console.error('❌ Failed to store course completion locally:', error);
    }
  }

  // Get user ID from token
  private getCurrentUserId(): number {
    const token = sessionStorage.getItem('token');
    if (!token) return 0;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 
                     payload['nameid'] || 
                     payload['sub'] || '0');
    } catch (error) {
      console.error('Error parsing user ID from token:', error);
      return 0;
    }
  }

  // Get user name from token
  private getCurrentUserName(): string {
    const token = sessionStorage.getItem('token');
    if (!token) return 'Unknown User';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
             payload['name'] || 
             payload['email'] || 'Unknown User';
    } catch (error) {
      console.error('Error parsing user name from token:', error);
      return 'Unknown User';
    }
  }

  // Helper method to create quiz completion log from quiz data
  createQuizCompletionLog(
    courseId: number, 
    courseTitle: string, 
    quizId: number, 
    quizTitle: string, 
    score: number, 
    totalMarks: number,
    attemptNumber: number = 1
  ): QuizCompletionLog {
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const status: 'Passed' | 'Failed' | 'Completed' = percentage >= 70 ? 'Passed' : percentage > 0 ? 'Failed' : 'Completed';
    
    return {
      learnerId: this.getCurrentUserId(),
      learnerName: this.getCurrentUserName(),
      courseId,
      courseTitle,
      quizId,
      quizTitle,
      score,
      totalMarks,
      percentage,
      status,
      completedAt: new Date(),
      attemptNumber
    };
  }

  // Get locally stored quiz completions (for instructor reports)
  getLocalQuizCompletions(): QuizCompletionLog[] {
    try {
      return JSON.parse(sessionStorage.getItem('quizCompletions') || '[]');
    } catch (error) {
      console.error('❌ Failed to read local quiz completions:', error);
      return [];
    }
  }

  // Get locally stored course completions (for admin reports)
  getLocalCourseCompletions(): any[] {
    try {
      return JSON.parse(sessionStorage.getItem('completedCourses') || '[]');
    } catch (error) {
      console.error('❌ Failed to read local course completions:', error);
      return [];
    }
  }
} 