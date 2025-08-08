import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { ProfileService } from '../../services/profile.service';
import { CourseService } from '../../services/course.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { UserRole } from '../../models/user.model';

interface AdminReports {
  totalStudents: number;
  totalCourses: number;
  totalInstructors: number;
  courseCompletionStats: CourseCompletionStats[];
  courseEnrollmentStats: CourseEnrollmentStats[];
}

interface CourseCompletionStats {
  courseId: number;
  courseTitle: string;
  totalEnrollments: number;
  completedStudents: number;
  completionRate: number;
  instructorName: string;
}

interface CourseEnrollmentStats {
  courseId: number;
  courseTitle: string;
  totalEnrollments: number;
  instructorName: string;
}

interface InstructorStats {
  instructorId: number;
  instructorName: string;
  instructorEmail: string;
  assignedCourses: number;
}

interface CourseDetail {
  courseId: number;
  title: string;
  description: string;
  instructorName: string;
  totalQuizzes: number;
  totalEnrollments: number;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.css']
})
export class AdminReportsComponent implements OnInit {
  reports: AdminReports | null = null;
  isLoading = false;
  errorMessage = '';
  selectedCourseId = '';
  completionFilter = 'all';
  courseEnrollmentCounts: { [courseId: number]: number } = {};
  instructorStats: InstructorStats[] = [];
  courseDetails: CourseDetail[] = [];
  
  filteredCompletionStats: CourseCompletionStats[] = [];
  
  showCourseModal = false;
  selectedCourseForModal: any = null;
  courseModalData: any = null;
  filteredEnrollmentStats: CourseEnrollmentStats[] = [];

  showQuizViewModal = false;
  selectedQuizForView: any = null;
  selectedQuizQuestions: any[] = [];
  quizLoading = false;

  constructor(
    private profileService: ProfileService,
    private courseService: CourseService,
    private enrollmentService: EnrollmentService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const students$ = this.profileService.getUsersByRole(UserRole.Learner);
    const instructors$ = this.profileService.getUsersByRole(UserRole.Instructor);
    const courses$ = this.courseService.getAllCourses();
    const enrollments$ = this.enrollmentService.getAllCourseAssignments('Learner');

    forkJoin({
      students: students$,
      instructors: instructors$,
      courses: courses$,
      enrollments: enrollments$
    }).subscribe({
      next: (data) => {
        this.calculateRealEnrollmentCounts(data.students, data.courses, data.enrollments);
        this.calculateAdminReports(data.students, data.instructors, data.courses);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load reports. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private calculateAdminReports(students: any[], instructors: any[], courses: any[]): void {
    const completedCourses = this.getPersistedCompletions();
    
    const courseCompletionStats: CourseCompletionStats[] = courses.map(course => {
      const totalEnrollments = this.getEnrollmentsForCourse(course.courseId);
      const completedStudents = this.getCompletedStudentsForCourse(course.courseId);
      const completionRate = this.getCompletionRateForCourse(course.courseId);
      
      return {
        courseId: course.courseId,
        courseTitle: course.title,
        totalEnrollments: totalEnrollments,
        completedStudents: completedStudents,
        completionRate: completionRate,
        instructorName: 'Instructor'
      };
    });

    const courseEnrollmentStats: CourseEnrollmentStats[] = courses.map(course => ({
      courseId: course.courseId,
      courseTitle: course.title,
      totalEnrollments: this.getEnrollmentsForCourse(course.courseId),
      instructorName: 'Instructor'
    }));

    this.reports = {
      totalStudents: students.length,
      totalCourses: courses.length,
      totalInstructors: instructors.length,
      courseCompletionStats: courseCompletionStats,
      courseEnrollmentStats: courseEnrollmentStats
    };
    
    this.calculateInstructorStats(instructors, courses);
    this.calculateCourseDetails(courses);
  }

  private calculateInstructorStats(instructors: any[], courses: any[]): void {
    this.enrollmentService.getAllCourseAssignments('Instructor').subscribe({
      next: (instructorAssignments) => {
        this.instructorStats = instructors
          .filter(user => user.role === 2 || user.role === 'Instructor')
          .map(instructor => {
            const assignedCourses = instructorAssignments.filter(assignment => 
              assignment.userEmail === instructor.email
            ).length;
            
            return {
              instructorId: instructor.id || instructor.userId,
              instructorName: instructor.name,
              instructorEmail: instructor.email,
              assignedCourses: assignedCourses
            };
          });
      },
      error: () => {
        this.instructorStats = instructors
          .filter(user => user.role === 2 || user.role === 'Instructor')
          .map((instructor, index) => {
            const totalInstructors = instructors.filter(u => u.role === 2).length;
            const coursesPerInstructor = Math.ceil(courses.length / totalInstructors);
            const assignedCourses = Math.min(coursesPerInstructor, courses.length);
            
            return {
              instructorId: instructor.id || instructor.userId,
              instructorName: instructor.name,
              instructorEmail: instructor.email,
              assignedCourses: assignedCourses
            };
          });
      }
    });
  }

  private calculateCourseDetails(courses: any[]): void {
    this.enrollmentService.getAllCourseAssignments('Instructor').subscribe({
      next: (instructorAssignments) => {
        this.courseDetails = courses.map(course => {
          const assignment = instructorAssignments.find(assign => 
            assign.courseTitle === course.title
          );
          
          let instructorName = 'No Instructor Assigned';
          if (assignment) {
            const instructor = this.instructorStats.find(inst => 
              inst.instructorEmail === assignment.userEmail
            );
            instructorName = instructor ? instructor.instructorName : assignment.userEmail;
          }
          
          return {
            courseId: course.courseId,
            title: course.title,
            description: course.description || 'No description available',
            instructorName: instructorName,
            totalQuizzes: course.quizzes?.length || 0,
            totalEnrollments: this.getEnrollmentsForCourse(course.courseId)
          };
        });
      },
      error: () => {
        this.courseDetails = courses.map(course => ({
          courseId: course.courseId,
          title: course.title,
          description: course.description || 'No description available',
          instructorName: course.instructorName || 'Instructor',
          totalQuizzes: course.quizzes?.length || 0,
          totalEnrollments: this.getEnrollmentsForCourse(course.courseId)
        }));
      }
    });
  }

  private getPersistedCompletions(): any[] {
    try {
      const completionsData = localStorage.getItem('completedCourses');
      if (!completionsData) return [];
      
      const completions = JSON.parse(completionsData);
      return completions.filter((completion: any) => {
        return completion && 
               typeof completion.learnerId === 'number' && 
               typeof completion.courseId === 'number' && 
               completion.completedAt;
      });
    } catch {
      return [];
    }
  }

  onCourseFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    if (!this.reports) return;

    this.filteredCompletionStats = this.reports.courseCompletionStats.filter(course => {
      const courseMatch = !this.selectedCourseId || course.courseId.toString() === this.selectedCourseId;
      const completionMatch = this.getCompletionMatch(course.completionRate);
      return courseMatch && completionMatch;
    });

    this.filteredEnrollmentStats = this.reports.courseEnrollmentStats.filter(course => {
      return !this.selectedCourseId || course.courseId.toString() === this.selectedCourseId;
    });
  }

  private getCompletionMatch(completionRate: number): boolean {
    switch (this.completionFilter) {
      case 'high': return completionRate > 80;
      case 'medium': return completionRate >= 50 && completionRate <= 80;
      case 'low': return completionRate < 50;
      default: return true;
    }
  }

  viewCourseDetails(courseId: number): void {
    this.loadCourseDetailsForModal(courseId);
  }

  private loadCourseDetailsForModal(courseId: number): void {
    this.isLoading = true;
    
    this.courseService.getCourseById(courseId).subscribe({
      next: (courseDetails) => {
        this.selectedCourseForModal = courseDetails;
        this.loadCourseModalData(courseId);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load course details';
      }
    });
  }

  private loadCourseModalData(courseId: number): void {
    forkJoin({
      materials: this.courseService.getCourseDataByCourseId(courseId),
      quizzes: this.courseService.getQuizzesByCourse(courseId)
    }).subscribe({
      next: (data) => {
        this.courseModalData = {
          materials: data.materials || [],
          quizzes: data.quizzes || []
        };
        this.showCourseModal = true;
        this.isLoading = false;
      },
      error: () => {
        this.courseModalData = {
          materials: [],
          quizzes: []
        };
        this.showCourseModal = true;
        this.isLoading = false;
      }
    });
  }

  closeCourseModal(): void {
    this.showCourseModal = false;
    this.selectedCourseForModal = null;
    this.courseModalData = null;
  }

  private calculateRealEnrollmentCounts(students: any[], courses: any[], enrollments: any[]): void {
    courses.forEach(course => {
      this.courseEnrollmentCounts[course.courseId] = 0;
    });
    
    enrollments.forEach(enrollment => {
      const course = courses.find(c => c.title === enrollment.courseTitle);
      if (course) {
        const learner = students.find(s => s.email === enrollment.userEmail && s.role === 1);
        if (learner) {
          this.courseEnrollmentCounts[course.courseId]++;
        }
      }
    });
  }

  getEnrollmentsForCourse(courseId: number): number {
    return this.courseEnrollmentCounts[courseId] || 0;
  }

  getCompletedStudentsForCourse(courseId: number): number {
    const completions = this.getPersistedCompletions();
    return completions.filter(c => c.courseId === courseId).length;
  }

  getCompletionRateForCourse(courseId: number): number {
    const totalEnrollments = this.getEnrollmentsForCourse(courseId);
    const completedStudents = this.getCompletedStudentsForCourse(courseId);
    
    if (totalEnrollments === 0) return 0;
    return Math.round((completedStudents / totalEnrollments) * 100 * 100) / 100;
  }

  getCompletedStudentsCount(): number {
    if (!this.reports?.courseCompletionStats) return 0;
    
    const completedCourses = this.getPersistedCompletions();
    const uniqueStudents = new Set(
      completedCourses
        .filter(completion => completion.learnerId && completion.courseId)
        .map(completion => completion.learnerId)
    );
    
    return uniqueStudents.size;
  }

  viewMaterial(material: any): void {
    if (!material.filePath) {
      alert('File path not available for this material.');
      return;
    }

    try {
      const url = this.getFullDownloadUrl(material.filePath);
      window.open(url, '_blank');
    } catch {
      alert('Failed to open file. Please try again or contact support.');
    }
  }

  downloadMaterial(material: any): void {
    if (!material.filePath) {
      alert('File path not available for this material.');
      return;
    }

    try {
      const url = this.getFullDownloadUrl(material.filePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.title || 'course-material';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('Failed to download file. Please try again or contact support.');
    }
  }

  viewQuiz(quiz: any): void {
    if (!quiz.quizId) {
      alert('Quiz ID not available.');
      return;
    }

    this.selectedQuizForView = quiz;
    this.selectedQuizQuestions = [];
    this.showQuizViewModal = true;
    this.quizLoading = true;

    this.courseService.getQuizForEditing(quiz.quizId).subscribe({
      next: (quizData: any) => {
        this.selectedQuizQuestions = quizData.questions || [];
        this.quizLoading = false;
      },
      error: () => {
        this.quizLoading = false;
        alert('Failed to load quiz details. Please try again.');
        this.showQuizViewModal = false;
      }
    });
  }

  closeQuizViewModal(): void {
    this.showQuizViewModal = false;
    this.selectedQuizForView = null;
    this.selectedQuizQuestions = [];
    this.quizLoading = false;
  }

  private getFullDownloadUrl(filePath: string): string {
    if (!filePath) return '#';
    
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    if (filePath.startsWith('/')) {
      return `http://localhost:5255${filePath}`;
    }
    
    return `http://localhost:5255/${filePath}`;
  }
} 