import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { CourseService } from '../../services/course.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { UserRole } from '../../models/user.model';
import { forkJoin } from 'rxjs';

interface SuperAdminReports {
  totalStudents: number;
  totalCourses: number;
  totalInstructors: number;
  totalAdmins: number;
  courseEnrollmentStats: CourseEnrollmentStats[];
  courseCompletionStats: CourseCompletionStats[];
}

interface CourseEnrollmentStats {
  courseId: number;
  courseTitle: string;
  totalEnrollments: number;
  instructorName: string;
}

interface CourseCompletionStats {
  courseId: number;
  courseTitle: string;
  totalEnrollments: number;
  completedStudents: number;
  completionRate: number;
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
  description?: string;
  prerequisites?: string;
  syllabus?: string;
  createdAt: string;
  instructorName: string;
}

@Component({
  selector: 'app-superadmin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './superadmin-reports.component.html',
  styleUrls: ['./superadmin-reports.component.css']
})
export class SuperAdminReportsComponent implements OnInit {
  reports: SuperAdminReports | null = null;
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
    const admins$ = this.profileService.getUsersByRole(UserRole.Admin);
    const courses$ = this.courseService.getAllCourses();
    const enrollments$ = this.enrollmentService.getAllCourseAssignments('Learner');

    forkJoin({
      students: students$,
      instructors: instructors$,
      admins: admins$,
      courses: courses$,
      enrollments: enrollments$
    }).subscribe({
      next: (data) => {
        this.calculateSuperAdminReports(data);
      },
      error: () => {
        this.errorMessage = 'Failed to load reports. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private calculateSuperAdminReports(data: any): void {
    this.calculateRealEnrollmentCounts(data.students, data.courses, data.enrollments);
    this.calculateInstructorStatistics(data.instructors);
    this.calculateCourseDetails(data.courses);

    const courseCompletionStats = data.courses.map((course: any) => {
      const enrollmentCount = this.getEnrollmentsForCourse(course.courseId);
      const completedCount = this.getCompletedStudentsForCourse(course.courseId);
      const completionRate = enrollmentCount > 0 ? (completedCount / enrollmentCount) * 100 : 0;
      
      const instructor = data.instructors.find((inst: any) => inst.id === course.instructorId);
      
      return {
        courseId: course.courseId,
        courseTitle: course.title,
        totalEnrollments: enrollmentCount,
        completedStudents: completedCount,
        completionRate: completionRate,
        instructorName: instructor ? instructor.name || 'Unknown' : 'Unknown'
      };
    });

    this.reports = {
      totalStudents: data.students.length,
      totalCourses: data.courses.length,
      totalInstructors: data.instructors.length,
      totalAdmins: data.admins.length,
      courseEnrollmentStats: data.courses.map((course: any) => {
        const enrollmentCount = this.getEnrollmentsForCourse(course.courseId);
        return {
          courseId: course.courseId,
          courseTitle: course.title,
          totalEnrollments: enrollmentCount
        };
      }),
      courseCompletionStats: courseCompletionStats
    };

    this.filteredCompletionStats = [...courseCompletionStats];
    this.isLoading = false;
    this.applyFilters();
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
            courseId: course.courseId || 0,
            title: course.title,
            description: course.description,
            prerequisites: course.prerequisites,
            syllabus: course.syllabus,
            createdAt: course.createdAt,
            instructorName: instructorName
          };
        });
      },
      error: () => {
        this.courseDetails = courses.map(course => ({
          courseId: course.courseId || 0,
          title: course.title,
          description: course.description,
          prerequisites: course.prerequisites,
          syllabus: course.syllabus,
          createdAt: course.createdAt,
          instructorName: course.instructorName || 'Instructor'
        }));
      }
    });
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

  private calculateInstructorStatistics(instructors: any[]): void {
    this.enrollmentService.getAllCourseAssignments('Instructor').subscribe({
      next: (instructorAssignments) => {
        this.instructorStats = instructors.map((instructor: any) => {
          const assignedCourses = instructorAssignments.filter(assign => 
            assign.userEmail === instructor.email
          ).length;
          
          return {
            instructorId: instructor.id,
            instructorName: instructor.name || 'Unknown Instructor',
            instructorEmail: instructor.email,
            assignedCourses: assignedCourses
          };
        });
      },
      error: () => {
        this.instructorStats = instructors.map((instructor: any) => ({
          instructorId: instructor.id,
          instructorName: instructor.name || 'Unknown Instructor',
          instructorEmail: instructor.email,
          assignedCourses: 0
        }));
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

  private getPersistedCompletions(): any[] {
    try {
      const completionsData = sessionStorage.getItem('completedCourses');
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

  getCompletionRateForCourse(courseId: number): number {
    const totalEnrollments = this.getEnrollmentsForCourse(courseId);
    const completedStudents = this.getCompletedStudentsForCourse(courseId);
    return totalEnrollments > 0 ? Math.round((completedStudents / totalEnrollments) * 100 * 100) / 100 : 0;
  }

  getCompletedStudentsCount(): number {
    const completedCourses = this.getPersistedCompletions();
    const uniqueLearners = new Set(completedCourses.map(c => c.learnerId));
    return uniqueLearners.size;
  }

  onCourseFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    if (!this.reports) return;

    let filtered = [...this.reports.courseCompletionStats];
    
    if (this.selectedCourseId) {
      filtered = filtered.filter(course => course.courseId.toString() === this.selectedCourseId);
    }

    if (this.completionFilter !== 'all') {
      filtered = filtered.filter(course => {
        const rate = course.completionRate;
        switch (this.completionFilter) {
          case 'high': return rate > 80;
          case 'medium': return rate >= 50 && rate <= 80;
          case 'low': return rate < 50;
          default: return true;
        }
      });
    }

    this.filteredCompletionStats = filtered;
  }

  viewCourseDetails(courseId: number): void {
    const course = this.courseDetails.find(c => c.courseId === courseId);
    if (!course) return;

    this.selectedCourseForModal = course;
    this.isLoading = true;
    this.loadCourseModalData(courseId);
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