import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Report DTOs interfaces
export interface SuperAdminReportsDto {
  totalStudents: number;
  totalCourses: number;
  totalInstructors: number;
  totalAdmins: number;
  courseEnrollmentStats: CourseEnrollmentStatsDto[];
}

export interface AdminReportsDto {
  totalStudents: number;
  totalCourses: number;
  totalInstructors: number;
  courseCompletionStats: CourseCompletionStatsDto[];
  courseEnrollmentStats: CourseEnrollmentStatsDto[];
}

export interface InstructorReportsDto {
  instructorId: number;
  assignedCourses: InstructorCourseStatsDto[];
}

export interface LearnerReportsDto {
  learnerId: number;
  learnerName: string;
  courseProgress: LearnerCourseProgressDto[];
  overallStats: LearnerOverallStatsDto;
}

export interface CourseEnrollmentStatsDto {
  courseId: number;
  courseTitle: string;
  totalEnrollments: number;
  instructorName: string;
}

export interface CourseCompletionStatsDto {
  courseId: number;
  courseTitle: string;
  totalEnrollments: number;
  completedStudents: number;
  completionRate: number;
  instructorName: string;
}

export interface InstructorCourseStatsDto {
  courseId: number;
  courseTitle: string;
  totalStudents: number;
  quizStats: QuizStatsDto[];
  studentProgress: StudentProgressSummaryDto[];
}

export interface QuizStatsDto {
  quizId: number;
  quizTitle: string;
  totalMarks: number;
  studentsAttempted: number;
  studentsCompleted: number;
  averageScore: number;
  studentResults: StudentQuizResultDto[];
}

export interface StudentProgressSummaryDto {
  studentId: number;
  studentName: string;
  quizzesCompleted: number;
  totalQuizzes: number;
  overallScore: number;
  overallPercentage: number;
}

export interface StudentQuizResultDto {
  studentId: number;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  attemptedAt?: Date;
}

export interface LearnerCourseProgressDto {
  courseId: number;
  courseTitle: string;
  quizzesCompleted: number;
  totalQuizzes: number;
  overallScore: number;
  overallPercentage: number;
  progressStatus: string;
  quizProgress: LearnerQuizProgressDto[];
}

export interface LearnerQuizProgressDto {
  quizId: number;
  quizTitle: string;
  score?: number;
  totalMarks: number;
  percentage?: number;
  status: string;
  attemptedAt?: Date;
}

export interface LearnerOverallStatsDto {
  totalCoursesEnrolled: number;
  totalQuizzesCompleted: number;
  totalQuizzesPending: number;
  overallAverageScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = 'http://localhost:5000/api/reports';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // SuperAdmin Reports
  getSuperAdminReports(): Observable<SuperAdminReportsDto> {
    return this.http.get<SuperAdminReportsDto>(`${this.apiUrl}/superadmin`, {
      headers: this.getAuthHeaders()
    });
  }

  // Admin Reports
  getAdminReports(): Observable<AdminReportsDto> {
    return this.http.get<AdminReportsDto>(`${this.apiUrl}/admin`, {
      headers: this.getAuthHeaders()
    });
  }

  // Instructor Reports
  getInstructorReports(): Observable<InstructorReportsDto> {
    return this.http.get<InstructorReportsDto>(`${this.apiUrl}/instructor`, {
      headers: this.getAuthHeaders()
    });
  }

  getInstructorQuizStats(courseId: number): Observable<QuizStatsDto[]> {
    return this.http.get<QuizStatsDto[]>(`${this.apiUrl}/instructor/quiz-stats/${courseId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Learner Reports
  getLearnerReports(): Observable<LearnerReportsDto> {
    return this.http.get<LearnerReportsDto>(`${this.apiUrl}/learner`, {
      headers: this.getAuthHeaders()
    });
  }

  // Shared Reports
  getCourseEnrollmentStats(): Observable<CourseEnrollmentStatsDto[]> {
    return this.http.get<CourseEnrollmentStatsDto[]>(`${this.apiUrl}/course-enrollment-stats`, {
      headers: this.getAuthHeaders()
    });
  }

  getCourseCompletionStats(): Observable<CourseCompletionStatsDto[]> {
    return this.http.get<CourseCompletionStatsDto[]>(`${this.apiUrl}/course-completion-stats`, {
      headers: this.getAuthHeaders()
    });
  }
} 