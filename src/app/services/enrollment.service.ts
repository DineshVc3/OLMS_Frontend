import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EnrolledStudent {
  id: number;
  userEmail: string;
  courseTitle: string;
  assignedDate: string;
  isActive: boolean;
}

export interface CourseAssignment {
  userEmail: string;
  courseTitle: string;
}

// Alias for backward compatibility
export interface CourseAssignmentItem {
  userEmail: string;
  courseTitle: string;
}

export interface ExistingAssignment {
  id: number;
  userEmail: string;
  courseTitle: string;
  assignedDate: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private apiUrl = 'http://localhost:5255/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // FIXED: Updated to use CourseAssignment endpoints
  getEnrolledStudents(): Observable<EnrolledStudent[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<EnrolledStudent[]>(`${this.apiUrl}/CourseAssignment/view-enrollments`, { headers });
  }

  // FIXED: Updated to use CourseAssignment endpoints
  getCourseStudents(courseId: number): Observable<EnrolledStudent[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<EnrolledStudent[]>(`${this.apiUrl}/CourseAssignment/course/${courseId}/students`, { headers });
  }

  // FIXED: Updated to use CourseAssignment endpoints
  getInstructorAssignments(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/CourseAssignment/GetAllCourseAssignments?role=Instructor`, { headers });
  }

  // FIXED: Updated to use CourseAssignment endpoints
  getAllCourseAssignments(role: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/CourseAssignment/GetAllCourseAssignments?role=${role}`, { headers });
  }

  // FIXED: Updated to use CourseAssignment endpoints
  addCourseAssignment(assignment: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/CourseAssignment/AddCourseAssignments`, assignment, { headers });
  }

  // FIXED: Updated to use CourseAssignment endpoints
  updateCourseAssignment(role: string, email: string, newCourseTitle: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/CourseAssignment/UpdateCourseAssignment?role=${role}&email=${email}&newCourseTitle=${newCourseTitle}`, {}, { headers });
  }

  // FIXED: Updated to use CourseAssignment endpoints
  deleteCourseAssignment(role: string, userEmail: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/CourseAssignment/DeleteCourseAssignment?role=${role}&email=${userEmail}`, { headers });
  }

  // FIXED: Updated to use CourseAssignment endpoints
  bulkAddAssignments(assignments: { role: string; assignments: CourseAssignmentItem[] }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/CourseAssignment/AddCourseAssignments`, assignments, { headers });
  }

  // Backward compatibility methods
  getAvailableUsers(role?: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    const roleParam = role ? `?role=${role}` : '';
    return this.http.get<any[]>(`${this.apiUrl}/AppUser/GetAllUsersByAccess${roleParam}`, { headers });
  }

  addCourseAssignments(assignments: { role: string; assignments: CourseAssignmentItem[] }): Observable<any> {
    return this.bulkAddAssignments(assignments);
  }
} 