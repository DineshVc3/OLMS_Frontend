import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LearnerService, EnrolledCourse } from '../../../services/learner.service';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { ProfileComponent } from '../../../shared/profile/profile.component';
import { SidebarService } from '../../../services/sidebar.service';
import { CourseStateService, CourseProgressUpdate } from '../../../services/course-state.service';
import { LearnerCourseComponent } from '../learner-course/learner-course.component';
import { LearnerProgressComponent } from '../learner-progress/learner-progress.component';
import { LearnerReportsComponent } from '../../../shared/reports-analytics/learner-reports.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-learner-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    SidebarComponent, 
    NavbarComponent, 
    ProfileComponent,
    LearnerCourseComponent,
    LearnerProgressComponent,
    LearnerReportsComponent
  ],
  templateUrl: './learner-dashboard.component.html',
  styleUrls: ['./learner-dashboard.component.css']
})
export class LearnerDashboardComponent implements OnInit, OnDestroy {
  
  // Dashboard layout properties
  isCollapsed = false;
  selectedSidebarItem = 'Home';
  role = 'learner';
  
  // Section visibility properties
  showProfile = false;
  showCourse = false;
  showProgress = false;
  showReports = false;
  
  // Course data properties
  enrolledCourses: EnrolledCourse[] = [];
  loading = false;
  error = '';

  // Dashboard stats
  totalCourses = 0;
  completedCourses = 0;
  inProgressCourses = 0;
  overallProgress = 0;

  // Subscription management
  private progressUpdateSubscription: Subscription = new Subscription();

  constructor(
    private learnerService: LearnerService,
    private router: Router,
    private sidebarService: SidebarService,
    private courseStateService: CourseStateService
  ) { }

  ngOnInit(): void {
    console.log('🏠 Dashboard component initializing...');
    
    // Subscribe to sidebar state changes
    this.sidebarService.isCollapsed$.subscribe((collapsed: boolean) => {
      this.isCollapsed = collapsed;
    });

    // Add a small delay to ensure token is properly loaded
    setTimeout(() => {
      // Check authentication and role
      if (!this.learnerService.isAuthenticated()) {
        this.error = 'Please log in to access your dashboard.';
        return;
      }

      const userRole = this.learnerService.getUserRole();
      if (userRole !== 'Learner') {
        this.error = 'Access denied. This dashboard is only available for learners.';
        return;
      }

      this.loadEnrolledCourses();
    }, 100);

    // ✅ ENHANCED: Subscribe to course progress updates with better debugging
    console.log('🔔 Dashboard subscribing to course progress updates...');
    this.progressUpdateSubscription.add(
      this.courseStateService.courseProgressUpdates$.pipe(
        filter(update => update !== null)
      ).subscribe((update: CourseProgressUpdate | null) => {
        if (update) {
          console.log('📈 Dashboard received progress update:', update);
          this.updateCourseInList(update);
          this.calculateDashboardStats();
        }
      })
    );
  }

  onMenuSelect(item: string): void {
    this.selectedSidebarItem = item;
    this.showProfile = false;
    this.showCourse = false;
    this.showProgress = false;
    this.showReports = false;
    
    // Set the current section based on menu selection
    switch (item.toLowerCase()) {
      case 'home':
        // Show main dashboard content (default state) - refresh data when returning to dashboard
        console.log('🏠 Returning to main dashboard - checking for progress updates');
        this.checkForProgressUpdates();
        break;
      case 'course':
        this.showCourse = true;
        break;
      case 'progress':
        this.showProgress = true;
        break;
      case 'reports':
        this.showReports = true;
        break;
      default:
        // Default to home
        console.log('🏠 Navigating to dashboard home');
        this.checkForProgressUpdates();
        break;
    }
  }

  onProfileToggle(show: boolean): void {
    this.showProfile = show;
    if (show) {
      this.showCourse = false;
      this.showProgress = false;
    }
  }

  onSubmenuSelect(submenu: string): void {
    console.log('Submenu selected:', submenu);
    // Handle submenu selections here
    // For example, if Course submenu "Quizzes" is selected
    if (submenu === 'Quizzes') {
      // Navigate to quizzes section
    } else if (submenu === 'Course Data') {
      // Navigate to course data section  
    } else if (submenu === 'View Progress') {
      // Navigate to progress view
    }
  }

  loadEnrolledCourses(): void {
    this.loading = true;
    this.error = '';

    // Use the basic method first, enhanced method can be enabled later after testing
    this.learnerService.getEnrolledCourses().subscribe({
              next: (courses) => {
        // Ensure all courses have default values and check for persisted completion status
        this.enrolledCourses = courses.map(course => {
          const persistedCompletion = this.getPersistedCompletionStatus(course.courseId);
          return {
            courseId: course.courseId,
            title: course.title,
            description: course.description,
            instructorName: course.instructorName,
            instructorEmail: course.instructorEmail,
            enrolledAt: course.enrolledAt,
            status: persistedCompletion ? 'Completed' : (course.status || 'Not Started'),
            progressPercentage: persistedCompletion ? 100 : (course.progressPercentage ?? 0),
            totalQuizzes: course.totalQuizzes ?? 0,
            completedQuizzes: course.completedQuizzes ?? 0,
            passedQuizzes: course.passedQuizzes ?? 0
          };
        });
        
        // ✅ Calculate dashboard stats from enrolled courses data
        this.calculateDashboardStats();
        console.log('📊 Dashboard stats calculated:', {
          total: this.totalCourses,
          completed: this.completedCourses,
          inProgress: this.inProgressCourses,
          overall: this.overallProgress
        });
        
        this.loading = false;
      },
              error: (error) => {
        console.error('Error loading enrolled courses:', error);
        
        // Check if it's an authentication error
        if (error.status === 401) {
          this.error = 'You are not authorized to view this content. Please log in again.';
        } else if (error.status === 403) {
          this.error = 'Access denied. Please ensure you have learner permissions.';
        } else if (error.status === 404) {
          this.error = 'No courses found. You may not be enrolled in any courses yet.';
          this.enrolledCourses = [];
        } else {
          this.error = 'Failed to load your courses. Please try again.';
        }
        
        this.loading = false;
      }
    });
  }





  // ✅ ENHANCED: Calculate dashboard statistics from enrolled courses
  calculateDashboardStats(): void {
    this.totalCourses = this.enrolledCourses.length;
    
    // Count completed courses (only if status is 'Completed' AND has reasonable progress data)
    this.completedCourses = this.enrolledCourses.filter(course => {
      const progress = course.progressPercentage ?? 0;
      const status = course.status?.toLowerCase() || '';
      const totalQuizzes = course.totalQuizzes ?? 0;
      const completedQuizzes = course.completedQuizzes ?? 0;
      
      // Course is completed ONLY if:
      // 1. Status explicitly says 'Completed' AND has reasonable data
      // 2. All quizzes are completed (and there are quizzes to complete)
      const isStatusCompleted = status === 'completed';
      const allQuizzesCompleted = totalQuizzes > 0 && completedQuizzes === totalQuizzes;
      
      // Be more conservative: require explicit completion status or all quizzes done
      return isStatusCompleted || allQuizzesCompleted;
    }).length;
    
    // Count in-progress courses (some progress but not completed)
    this.inProgressCourses = this.enrolledCourses.filter(course => {
      const progress = course.progressPercentage ?? 0;
      const status = course.status?.toLowerCase() || '';
      const totalQuizzes = course.totalQuizzes ?? 0;
      const completedQuizzes = course.completedQuizzes ?? 0;
      
      // Check if completed first (using same logic as above)
      const isStatusCompleted = status === 'completed';
      const allQuizzesCompleted = totalQuizzes > 0 && completedQuizzes === totalQuizzes;
      const isCompleted = isStatusCompleted || allQuizzesCompleted;
      
      // Check if has progress
      const hasProgress = progress > 0 || completedQuizzes > 0 || 
                         status.includes('progress') || status.includes('started');
      
      return !isCompleted && hasProgress;
    }).length;
    
    // Calculate overall progress percentage
    if (this.totalCourses > 0) {
      const totalProgress = this.enrolledCourses.reduce((sum, course) => {
        return sum + (course.progressPercentage || 0);
      }, 0);
      
      this.overallProgress = Math.round(totalProgress / this.totalCourses);
    } else {
      this.overallProgress = 0;
    }
    
    // ✅ DEBUG: Log details for troubleshooting
    console.log('📊 Course Statistics Breakdown:');
    console.log(`Total Courses: ${this.totalCourses}`);
    console.log(`Completed: ${this.completedCourses}`);
    console.log(`In Progress: ${this.inProgressCourses}`);
    console.log(`Overall Progress: ${this.overallProgress}%`);
    
    this.enrolledCourses.forEach(course => {
      const progress = course.progressPercentage ?? 0;
      const status = course.status || 'No Status';
      const quizStatus = `${course.completedQuizzes}/${course.totalQuizzes} quizzes`;
      const totalQuizzes = course.totalQuizzes ?? 0;
      const completedQuizzes = course.completedQuizzes ?? 0;
      const isCompleted = course.status?.toLowerCase() === 'completed' || 
                         (totalQuizzes > 0 && completedQuizzes === totalQuizzes);
      console.log(`- ${course.title}: ${progress}% (${status}) [${quizStatus}] Completed: ${isCompleted}`);
    });
    
    // If we have no real progress data, let's create some test data to verify the display
    if (this.totalCourses === 0) {
      console.log('🧪 No courses found - checking if user is enrolled in any courses');
    }
  }

  openCourse(courseId: number): void {
    console.log('Opening course:', courseId);
    
    // Find the course in the enrolled courses list
    const selectedCourse = this.enrolledCourses.find(course => course.courseId === courseId);
    
    if (selectedCourse) {
      // Store the selected course in the state service
      this.courseStateService.setSelectedCourse(selectedCourse);
    } else {
      // If course not found in enrolled list, just store the ID
      this.courseStateService.setSelectedCourseId(courseId);
    }
    
    // Switch to Course section in sidebar
    this.onMenuSelect('Course');
    
    // Optionally load additional course details
    this.learnerService.getCourseDetails(courseId).subscribe({
      next: (courseDetails) => {
        console.log('Course details loaded:', courseDetails);
      },
      error: (error) => {
        console.error('Error loading course details:', error);
        // Still navigate to course section even if details fail to load
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    return this.learnerService.getStatusBadgeClass(status);
  }

  getProgressBarClass(percentage: number): string {
    if (percentage >= 80) return 'progress-bar-success';
    if (percentage >= 50) return 'progress-bar-warning';
    return 'progress-bar-info';
  }

  getProgressWidth(percentage: number): string {
    return `${Math.max(percentage, 2)}%`; // Minimum 2% for visibility
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  refresh(): void {
    console.log('🔄 Dashboard refresh triggered - fetching latest progress data');
    this.error = '';
    this.loadEnrolledCourses();
  }

  // Check for any pending progress updates when returning to dashboard
  private checkForProgressUpdates(): void {
    console.log('🔄 Checking for progress updates...');
    // Only refresh if we don't have current data or if it's been a while
    const shouldRefresh = this.enrolledCourses.length === 0 || this.error;
    
    if (shouldRefresh) {
      console.log('📥 Dashboard data missing or stale, refreshing...');
      this.refresh();
    } else {
      console.log('📊 Dashboard data current, no refresh needed');
      // Just recalculate stats with current data
      this.calculateDashboardStats();
    }
  }

  // Method to test enhanced progress calculation (can be called from console)
  testEnhancedProgress(): void {
    console.log('🧪 Testing enhanced progress calculation...');
    this.loading = true;
    this.error = '';

    this.learnerService.getEnrolledCoursesWithProgress().subscribe({
      next: (courses) => {
        console.log('✅ Enhanced progress data received:', courses);
        this.enrolledCourses = courses.map(course => ({
          courseId: course.courseId,
          title: course.title,
          description: course.description,
          instructorName: course.instructorName,
          instructorEmail: course.instructorEmail,
          enrolledAt: course.enrolledAt,
          status: course.status || 'Not Started',
          progressPercentage: course.progressPercentage ?? 0,
          totalQuizzes: course.totalQuizzes ?? 0,
          completedQuizzes: course.completedQuizzes ?? 0,
          passedQuizzes: course.passedQuizzes ?? 0
        }));
        
        this.calculateDashboardStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Enhanced progress calculation failed:', error);
        this.error = 'Enhanced progress calculation failed. Falling back to basic method.';
        this.loadEnrolledCourses(); // Fallback to basic method
      }
    });
  }

  // Debug method to check current dashboard state (can be called from console)
  getCurrentState(): any {
    return {
      totalCourses: this.totalCourses,
      completedCourses: this.completedCourses,
      inProgressCourses: this.inProgressCourses,
      overallProgress: this.overallProgress,
      enrolledCourses: this.enrolledCourses.map(course => ({
        id: course.courseId,
        title: course.title,
        progress: course.progressPercentage,
        status: course.status,
        quizzes: `${course.completedQuizzes}/${course.totalQuizzes}`
      }))
    };
  }

  // Check if course completion is persisted locally
  private getPersistedCompletionStatus(courseId: number): boolean {
    try {
      const completedCourses = JSON.parse(localStorage.getItem('completedCourses') || '[]');
      return completedCourses.some((c: any) => c.courseId === courseId);
    } catch (error) {
      console.error('Error reading persisted completion status:', error);
      return false;
    }
  }

  // Retry loading courses (called from error UI)
  retryLoadCourses(): void {
    this.refresh();
  }

  // ✅ ENHANCED: Update course in the enrolled courses list with new progress data
  private updateCourseInList(progressUpdate: CourseProgressUpdate): void {
    console.log('🔄 Updating course in list:', progressUpdate);
    const courseIndex = this.enrolledCourses.findIndex(course => course.courseId === progressUpdate.courseId);
    if (courseIndex !== -1) {
      const oldCourse = this.enrolledCourses[courseIndex];
      console.log(`📈 Before update - Course ${progressUpdate.courseId}: ${oldCourse.progressPercentage}% (${oldCourse.status})`);
      
      // Check if this is actually a change
      const hasActualChange = oldCourse.progressPercentage !== progressUpdate.progressPercentage ||
                             oldCourse.status !== progressUpdate.status ||
                             oldCourse.completedQuizzes !== progressUpdate.completedQuizzes;
      
      if (!hasActualChange) {
        console.log('📈 No actual change detected, skipping update');
        return;
      }
      
      this.enrolledCourses[courseIndex] = {
        ...this.enrolledCourses[courseIndex],
        progressPercentage: progressUpdate.progressPercentage,
        totalQuizzes: progressUpdate.totalQuizzes,
        completedQuizzes: progressUpdate.completedQuizzes,
        passedQuizzes: progressUpdate.passedQuizzes,
        status: progressUpdate.status || this.enrolledCourses[courseIndex].status
      };
      
      const updatedCourse = this.enrolledCourses[courseIndex];
      console.log(`✅ After update - Course ${progressUpdate.courseId}: ${updatedCourse.progressPercentage}% (${updatedCourse.status})`);
      console.log(`🧮 Quiz progress: ${updatedCourse.completedQuizzes}/${updatedCourse.totalQuizzes} completed`);
    } else {
      console.log(`❌ Course ${progressUpdate.courseId} not found in enrolled courses list`);
    }
  }



  ngOnDestroy(): void {
    // Cleanup subscriptions to prevent memory leaks
    this.progressUpdateSubscription.unsubscribe();
  }


}
