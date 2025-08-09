import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

export interface Course {
  courseId: number;
  title: string;
  description: string;
  syllabus: string;
  prerequisites: string;
  createdAt: string;
  createdBy: number;
  modifiedAt?: string;
}

export interface CourseDto {
  title: string;
  description: string;
  syllabus: string;
  prerequisites: string;
}

export interface CourseData {
  dataId: number;
  courseId: number;
  title: string;
  type: string;
  filePath: string;
  createdAt: string;
  modifiedAt?: string;
  instructorId?: number;
  createdBy?: number;
}

export interface CourseDataDto {
  courseId: number;
  title: string;
  type: string; // Should be "Video" or "Document" to match backend CourseContentType enum
  file?: File;
  description?: string;
}

export interface Quiz {
  quizId: number;
  courseId: number;
  dataId?: number;
  title: string;
  totalMarks: number;
  createdAt: string;
  createdBy: number;
  questions?: Question[];
  // ✅ ADDED: New properties for quiz status tracking
  IsAttempted?: boolean;
  IsPassed?: boolean;
  IsFailed?: boolean;
  Status?: string;
  Score?: number;
  QuestionCount?: number;
}

export interface Question {
  questionId: number;
  quizId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  marks: number;
}

export interface CreateQuizDto {
  courseId: number;
  dataId?: number;
  title: string;
  totalMarks: number;
}

export interface AddQuizQuestionsDto {
  quizId: number;
  questions: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    marks: number;
  }[];
}

export interface UpdateQuizDto {
  title?: string;
  totalMarks?: number;
}

export interface UpdateQuestionDto {
  questionId?: number; // Null for new questions
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  marks: number;
  isDeleted?: boolean;
}

export interface UpdateQuizWithQuestionsDto {
  title: string;
  totalMarks: number;
  questions: UpdateQuestionDto[];
}

export interface QuestionEditDto {
  questionId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  marks: number;
}

export interface QuizEditResponseDto {
  quizId: number;
  title: string;
  totalMarks: number;
  courseId: number;
  courseName: string;
  createdAt: string;
  questions: QuestionEditDto[];
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

export interface LearnerCourseContent {
  courseId: number;
  courseTitle: string;
  materials: {
    dataId: number;
    title: string;
    filePath: string;
    type: string;
  }[];
  quizzes: {
    quizId: number;
    title: string;
    totalMarks: number;
  }[];
}

export interface EnrolledStudent {
  id: number;
  userEmail: string;
  courseTitle: string;
  role: string;
  assignedDate: string;
  isActive: boolean;
}

export interface InstructorStats {
  assignedCourses: number;
  totalStudents: number;
  pendingAssignments: number;
}

export interface DashboardActivity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  courseTitle?: string;
}

export interface SubmitQuizDto {
  quizId: number;
  courseId: number;
  answers: {
    questionId: number;
    response: string;
  }[];
}

export interface QuizStatusDto {
  quizId: number;
  title: string;
  score: number;
  totalMarks: number;
  status: string;
}

export interface QuizSummaryDto {
  quizId: number;
  title: string;
  totalMarks: number;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:5255/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    const email = sessionStorage.getItem('email');
    const userId = sessionStorage.getItem('userId');
    
    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }
    
    const headers: any = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    if (email) {
      headers['X-User-Email'] = email;
    }
    
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    
    return new HttpHeaders(headers);
  }

  // ==================== COURSE MANAGEMENT ====================
  
  // Get all courses (for admin/superadmin)
  getAllCourses(): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Course[]>(`${this.apiUrl}/Course/all Course`, { headers });
  }

  // Get courses assigned to instructor
  getInstructorCourses(): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Course[]>(`${this.apiUrl}/CourseData/courses`, { headers });
  }

  // Get course by ID
  getCourseById(courseId: number): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http.get<Course>(`${this.apiUrl}/Course/${courseId}`, { headers });
  }

  // Get course by title
  getCourseByTitle(title: string): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http.get<Course>(`${this.apiUrl}/Course/title/${encodeURIComponent(title)}`, { headers });
  }

  // Add new course
  addCourse(courseDto: CourseDto): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http.post<Course>(`${this.apiUrl}/Course/add Course`, courseDto, { headers });
  }

  // Update course
  updateCourse(courseId: number, courseDto: CourseDto): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.put<string>(`${this.apiUrl}/Course/update course?id=${courseId}`, courseDto, { headers });
  }

  // Delete course
  deleteCourse(courseId: number): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.delete<string>(`${this.apiUrl}/Course/delete course?id=${courseId}`, { headers });
  }

  // ==================== COURSE DATA MANAGEMENT ====================
  
  // Get course data by course ID
  getCourseDataByCourseId(courseId: number): Observable<CourseData[]> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/CourseData/course/${courseId}/data`, { 
      headers,
      responseType: 'text' // Handle text response from backend
    }).pipe(
      map((response: any) => {
        // If response is plain text "No data uploaded yet.", return empty array
        if (typeof response === 'string' && response.includes('No data')) {
          return [];
        }
        // If response is JSON string, parse it
        if (typeof response === 'string') {
          try {
            const parsed = JSON.parse(response);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            console.warn('Failed to parse course data response as JSON:', response);
            return [];
          }
        }
        // If response is already an array, return it
        return Array.isArray(response) ? response : [];
      }),
      catchError(error => {
        console.error('Error fetching course data:', error);
        // Return empty array on error instead of throwing
        return of([]);
      })
    );
  }

  // Upload course data (file upload)
  uploadCourseData(formData: FormData): Observable<CourseData> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });
    return this.http.post<CourseData>(`${this.apiUrl}/CourseData/upload`, formData, { headers });
  }

  // Update course data
  updateCourseData(dataId: number, formData: FormData): Observable<any> {
    console.log('CourseService.updateCourseData called with:');
    console.log('- dataId:', dataId);
    console.log('- FormData entries:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });
    
    const url = `${this.apiUrl}/CourseData/course/data/${dataId}`;
    console.log('Making PUT request to:', url);
    console.log('Headers:', headers);
    
    // Expect text response instead of JSON since backend returns plain text
    return this.http.put(url, formData, { 
      headers, 
      responseType: 'text' 
    }).pipe(
      tap(response => {
        console.log('CourseService.updateCourseData SUCCESS:', response);
      }),
      catchError(error => {
        console.error('CourseService.updateCourseData ERROR:', error);
        throw error;
      })
    );
  }

  // ==================== QUIZ MANAGEMENT ====================
  
  // Create quiz
  createQuiz(createQuizDto: CreateQuizDto): Observable<any> {
    const headers = this.getAuthHeaders();
    // Updated endpoint to match fixed backend URL (removed space)
    return this.http.post<any>(`${this.apiUrl}/Quiz/create-quiz`, createQuizDto, { headers }).pipe(
      tap(response => {
        console.log('Quiz created successfully:', response);
      }),
      catchError(error => {
        console.error('Error creating quiz:', error);
        throw error;
      })
    );
  }

  // Update quiz (basic - existing)
  updateQuiz(quizId: number, updateQuizDto: UpdateQuizDto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/Quiz/update-basic/${quizId}`, updateQuizDto, { 
      headers,
      responseType: 'text' // Backend likely returns plain text confirmation
    }).pipe(
      tap(response => {
        console.log('Quiz updated successfully:', response);
      }),
      catchError(error => {
        console.error('Error updating quiz:', error);
        throw error;
      })
    );
  }

  // Get quiz for editing (with all questions)
  getQuizForEditing(quizId: number): Observable<QuizEditResponseDto> {
    const headers = this.getAuthHeaders();
    return this.http.get<QuizEditResponseDto>(`${this.apiUrl}/Quiz/get-for-editing/${quizId}`, { headers }).pipe(
      tap(response => {
        console.log('Quiz loaded for editing:', response);
      }),
      catchError(error => {
        console.error('Error loading quiz for editing:', error);
        throw error;
      })
    );
  }

  // Update quiz with questions (comprehensive editing)
  updateQuizWithQuestions(quizId: number, updateQuizDto: UpdateQuizWithQuestionsDto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/Quiz/update-with-questions/${quizId}`, updateQuizDto, { 
      headers,
      responseType: 'text'
    }).pipe(
      tap(response => {
        console.log('Quiz with questions updated successfully:', response);
      }),
      catchError(error => {
        console.error('Error updating quiz with questions:', error);
        throw error;
      })
    );
  }

  // Delete individual question
  deleteQuestion(questionId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/Quiz/delete-question/${questionId}`, { 
      headers,
      responseType: 'text'
    }).pipe(
      tap(response => {
        console.log('Question deleted successfully:', response);
      }),
      catchError(error => {
        console.error('Error deleting question:', error);
        throw error;
      })
    );
  }

  // Add questions to quiz
  addQuestionsToQuiz(addQuestionsDto: AddQuizQuestionsDto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/Quiz/add-questions`, addQuestionsDto, { 
      headers,
      responseType: 'text' // Backend returns plain text
    }).pipe(
      tap(response => {
        console.log('Questions added successfully:', response);
      }),
      catchError(error => {
        console.error('Error adding questions:', error);
        throw error;
      })
    );
  }

  // Get quizzes by course (for instructors and learners)
  getQuizzesByCourse(courseId: number): Observable<Quiz[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Quiz[]>(`${this.apiUrl}/Quiz/by-course/${courseId}`, { headers }).pipe(
      tap(response => {
        console.log(`Loaded ${response.length} quizzes for course ${courseId}`);
      }),
      catchError(error => {
        console.error('Error loading quizzes by course:', error);
        throw error;
      })
    );
  }

  // Get quiz by title
  getQuizByTitle(title: string): Observable<Quiz> {
    const headers = this.getAuthHeaders();
    return this.http.get<Quiz>(`${this.apiUrl}/Quiz/by-title/${encodeURIComponent(title)}`, { headers }).pipe(
      tap(response => {
        console.log('Quiz loaded by title:', response);
      }),
      catchError(error => {
        console.error('Error loading quiz by title:', error);
        throw error;
      })
    );
  }

  // Submit quiz (for learners)
  submitQuiz(submitData: SubmitQuizDto): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/Quiz/submit`, submitData, { 
      headers
      // ✅ REMOVED: responseType: 'text' - backend now returns JSON
    }).pipe(
      tap(response => {
        console.log('Quiz submitted successfully:', response);
      }),
      catchError(error => {
        console.error('Error submitting quiz:', error);
        throw error;
      })
    );
  }

  // NEW: Get quizzes for learners
  getQuizzesForLearner(courseId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/Quiz/learner/course/${courseId}`, { headers }).pipe(
      tap(response => {
        console.log(`Loaded ${response.length} quizzes for learner in course ${courseId}`);
      }),
      catchError(error => {
        console.error('Error loading quizzes for learner:', error);
        throw error;
      })
    );
  }

  // NEW: Get quiz for attempt (learners)
  getQuizForAttempt(quizId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/Quiz/attempt/${quizId}`, { headers }).pipe(
      tap(response => {
        console.log('Quiz loaded for attempt:', response);
      }),
      catchError(error => {
        console.error('Error loading quiz for attempt:', error);
        throw error;
      })
    );
  }

  // NEW: Get learner quiz results
  getLearnerQuizResult(quizId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/Quiz/learner/result/${quizId}`, { headers }).pipe(
      tap(response => {
        console.log('✅ Quiz result loaded:', response);
      }),
      catchError(error => {
        if (error.status === 404) {
          console.log('ℹ️ No quiz results found (quiz not passed yet)');
        } else {
          console.error('❌ Error loading quiz result:', error);
        }
        throw error;
      })
    );
  }

  // NEW: Get learner quiz stats
  getLearnerQuizStats(courseId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/Quiz/learner/stats/${courseId}`, { headers }).pipe(
      tap(response => {
        console.log('Quiz stats loaded:', response);
      }),
      catchError(error => {
        console.error('Error loading quiz stats:', error);
        throw error;
      })
    );
  }

  // ==================== ENROLLMENT MANAGEMENT ====================
  
  // Get enrolled students for instructor's courses
  getEnrolledStudents(): Observable<EnrolledStudent[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<EnrolledStudent[]>(`${this.apiUrl}/Enrollment/view-enrollments?role=Learner`, { headers });
  }

  // ==================== PROGRESS TRACKING ====================
  
  // Get course content for learner
  getCourseContentForLearner(courseId: number): Observable<LearnerCourseContent> {
    const headers = this.getAuthHeaders();
    return this.http.get<LearnerCourseContent>(`${this.apiUrl}/Progress/learner/course/${courseId}`, { headers });
  }

  // Get aggregated progress by course
  getAggregatedProgressByCourse(courseId: number): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/Progress/aggregated/course/${courseId}`, { headers });
  }

  // Get progress by quiz (for instructors)
  getProgressByQuiz(quizId: number): Observable<LearnerProgress[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<LearnerProgress[]>(`${this.apiUrl}/Progress/instructor/progress/quiz/${quizId}`, { headers });
  }

  // Get learner quiz progress
  getLearnerQuizProgress(quizId: number): Observable<LearnerProgress> {
    const headers = this.getAuthHeaders();
    return this.http.get<LearnerProgress>(`${this.apiUrl}/Progress/learner/quiz-progress/${quizId}`, { headers });
  }

  // ==================== UTILITY METHODS ====================
  
  // Get current user role
  getCurrentUserRole(): string {
    return sessionStorage.getItem('role') || '';
  }

  // Check if user can manage courses
  canManageCourses(): boolean {
    const role = this.getCurrentUserRole();
    return role === 'Admin' || role === 'SuperAdmin';
  }

  // Check if user is instructor
  isInstructor(): boolean {
    return this.getCurrentUserRole() === 'Instructor';
  }

  // Check if user is learner
  isLearner(): boolean {
    return this.getCurrentUserRole() === 'Learner';
  }

  // Get user-specific courses (for instructors - assigned courses, for learners - enrolled courses)
  getUserCourses(): Observable<Course[]> {
    const role = this.getCurrentUserRole();
    if (role === 'Admin' || role === 'SuperAdmin') {
      return this.getAllCourses();
    } else if (role === 'Instructor') {
      return this.getInstructorCourses();
    }
    // For learners, we'll implement this later
    return this.getAllCourses();
  }
} 