import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EnrolledCourse } from './learner.service';

export interface CourseProgressUpdate {
  courseId: number;
  progressPercentage: number;
  totalQuizzes: number;
  completedQuizzes: number;
  passedQuizzes: number;
  status?: 'Not Started' | 'In Progress' | 'Completed';
}

@Injectable({
  providedIn: 'root'
})
export class CourseStateService {
  private selectedCourseSubject = new BehaviorSubject<EnrolledCourse | null>(null);
  private selectedCourseIdSubject = new BehaviorSubject<number | null>(null);
  private courseProgressUpdatesSubject = new BehaviorSubject<CourseProgressUpdate | null>(null);

  constructor() {
    // Initialize with stored course ID if available
    const storedCourseId = localStorage.getItem('selectedCourseId');
    if (storedCourseId) {
      this.selectedCourseIdSubject.next(parseInt(storedCourseId, 10));
    }
  }

  // Observable for selected course
  get selectedCourse$(): Observable<EnrolledCourse | null> {
    return this.selectedCourseSubject.asObservable();
  }

  // Observable for selected course ID
  get selectedCourseId$(): Observable<number | null> {
    return this.selectedCourseIdSubject.asObservable();
  }

  // Observable for course progress updates
  get courseProgressUpdates$(): Observable<CourseProgressUpdate | null> {
    return this.courseProgressUpdatesSubject.asObservable();
  }

  // Set selected course
  setSelectedCourse(course: EnrolledCourse): void {
    this.selectedCourseSubject.next(course);
    this.selectedCourseIdSubject.next(course.courseId);
    localStorage.setItem('selectedCourseId', course.courseId.toString());
  }

  // Set selected course ID only
  setSelectedCourseId(courseId: number): void {
    this.selectedCourseIdSubject.next(courseId);
    localStorage.setItem('selectedCourseId', courseId.toString());
  }

  // Get current selected course
  getCurrentSelectedCourse(): EnrolledCourse | null {
    return this.selectedCourseSubject.value;
  }

  // Get current selected course ID
  getCurrentSelectedCourseId(): number | null {
    return this.selectedCourseIdSubject.value;
  }

  // Update course progress (called from course detail page)
  updateCourseProgress(progressUpdate: CourseProgressUpdate): void {
    console.log('🔄 Course progress updated:', progressUpdate);
    this.courseProgressUpdatesSubject.next(progressUpdate);
    
    // Also update the current selected course if it matches
    const currentCourse = this.selectedCourseSubject.value;
    if (currentCourse && currentCourse.courseId === progressUpdate.courseId) {
      const updatedCourse: EnrolledCourse = {
        ...currentCourse,
        progressPercentage: progressUpdate.progressPercentage,
        totalQuizzes: progressUpdate.totalQuizzes,
        completedQuizzes: progressUpdate.completedQuizzes,
        passedQuizzes: progressUpdate.passedQuizzes,
        status: progressUpdate.status || currentCourse.status
      };
      this.selectedCourseSubject.next(updatedCourse);
    }
  }

  // Clear selected course
  clearSelection(): void {
    this.selectedCourseSubject.next(null);
    this.selectedCourseIdSubject.next(null);
    localStorage.removeItem('selectedCourseId');
  }
} 