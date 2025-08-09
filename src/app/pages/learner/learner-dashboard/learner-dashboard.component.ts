import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LearnerService, EnrolledCourse } from '../../../services/learner.service';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { ProfileComponent } from '../../../shared/profile/profile.component';
import { SidebarService } from '../../../services/sidebar.service';
import { CourseStateService, CourseProgressUpdate } from '../../../services/course-state.service';
import { LearnerCourseComponent } from '../learner-course/learner-course.component';
import { LearnerProgressComponent } from '../learner-progress/learner-progress.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-learner-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    SidebarComponent, 
    HeaderComponent, 
    ProfileComponent,
    LearnerCourseComponent,
    LearnerProgressComponent
  ],
  templateUrl: './learner-dashboard.component.html',
  styleUrls: ['./learner-dashboard.component.css']
})
export class LearnerDashboardComponent implements OnInit, OnDestroy {
  role: string = '';
  selectedSidebarItem: string = '';
  isCollapsed: boolean = false;
  showProfile: boolean = false;
  showCourse: boolean = false;
  showProgress: boolean = false;
  selectedSubmenu: string = '';

  // Course data
  enrolledCourses: EnrolledCourse[] = [];
  loading: boolean = false;
  error: string = '';
  totalCourses: number = 0;
  completedCourses: number = 0;
  inProgressCourses: number = 0;

  private progressSubscription?: Subscription;

  constructor(
    private learnerService: LearnerService,
    private router: Router,
    private sidebarService: SidebarService,
    private courseStateService: CourseStateService
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      this.role = sessionStorage.getItem('role') || '';
    }

    // Subscribe to sidebar collapse state
    this.sidebarService.isCollapsed$.subscribe(collapsed => {
      this.isCollapsed = collapsed;
    });

    // Subscribe to course progress updates
    this.progressSubscription = this.courseStateService.courseProgressUpdates$
      .pipe(filter(update => update !== null))
      .subscribe((update: CourseProgressUpdate) => {
        this.updateCourseProgress(update);
      });

    this.loadCourses();
  }

  ngOnDestroy(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
  }

  onMenuSelect(item: string): void {
    this.selectedSidebarItem = item;
    this.resetViews();
    
    switch (item.toLowerCase()) {
      case 'home':
        // Show default home view
        break;
      case 'course':
        this.showCourse = true;
        break;
     
      default:
        break;
    }
  }

  onProfileToggle(show: boolean): void {
    this.showProfile = show;
    if (show) {
      this.selectedSidebarItem = '';
      this.resetViews();
    }
  }

  onSubmenuSelect(submenuItem: string): void {
    this.selectedSubmenu = submenuItem;
    this.resetViews();
    
    if (this.selectedSidebarItem.toLowerCase() === 'course') {
      switch (submenuItem.toLowerCase()) {
        case 'quizzes':
        case 'course data':
          this.showCourse = true;
          break;
      }
    } 
  }

  private resetViews(): void {
    this.showProfile = false;
    this.showCourse = false;
    this.showProgress = false;
  }

  private async loadCourses(): Promise<void> {
    this.loading = true;
    this.error = '';
    
    try {
      console.log('Loading courses...');
      this.enrolledCourses = await this.learnerService.getEnrolledCourses().toPromise() || [];
      console.log('Loaded courses:', this.enrolledCourses);
      
      this.updateCourseStats();
    } catch (error: any) {
      console.error('Error loading courses:', error);
      this.error = error.message || 'Failed to load courses. Please try again.';
      this.enrolledCourses = [];
    } finally {
      this.loading = false;
    }
  }

  retryLoadCourses(): void {
    this.loadCourses();
  }

  private updateCourseStats(): void {
    this.totalCourses = this.enrolledCourses.length;
    this.completedCourses = this.enrolledCourses.filter(course => 
      course.status?.toLowerCase() === 'completed'
    ).length;
    this.inProgressCourses = this.enrolledCourses.filter(course => 
      course.status?.toLowerCase() === 'in progress'
    ).length;
  }

  openCourse(courseId: number): void {
    console.log('Opening course:', courseId);
    
    // Set course state for navigation
    this.courseStateService.setSelectedCourseId(courseId);
    
    // Navigate to course detail
    this.router.navigate(['/course-detail', courseId]);
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success';
      case 'in progress':
        return 'bg-warning';
      case 'not started':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  }

  getProgressWidth(progress: number): string {
    return `${Math.min(Math.max(progress || 0, 0), 100)}%`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  private updateCourseProgress(update: CourseProgressUpdate): void {
    const courseIndex = this.enrolledCourses.findIndex(course => course.courseId === update.courseId);
    if (courseIndex !== -1) {
      this.enrolledCourses[courseIndex] = {
        ...this.enrolledCourses[courseIndex],
        progressPercentage: update.progressPercentage,
        completedQuizzes: update.completedQuizzes,
        totalQuizzes: update.totalQuizzes,
        passedQuizzes: update.passedQuizzes,
        status: update.status || this.enrolledCourses[courseIndex].status
      };
      
      // Update stats
      this.updateCourseStats();
    }
  }
}
