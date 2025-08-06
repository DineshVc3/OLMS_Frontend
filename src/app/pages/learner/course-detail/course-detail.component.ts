import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LearnerService, LearnerCourseContent, CourseMaterial, QuizSummary, LearnerProgress } from '../../../services/learner.service';
import { CourseStateService, CourseProgressUpdate } from '../../../services/course-state.service';
import { DonutChartComponent } from '../../../shared/donut-chart/donut-chart.component';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, DonutChartComponent],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent implements OnInit, OnDestroy {

  courseId!: number;
  courseContent: LearnerCourseContent | null = null;
  loading = false;
  error = '';

  // Tab management
  activeTab: 'overview' | 'materials' | 'quizzes' = 'overview';

  // Progress tracking
  quizProgress: { [quizId: number]: LearnerProgress } = {};
  courseStats = {
    totalMaterials: 0,
    totalQuizzes: 0,
    attemptedQuizzes: 0,
    passedQuizzes: 0,
    overallProgress: 0
  };

  // Subscription management
  private routerSubscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learnerService: LearnerService,
    private courseStateService: CourseStateService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.courseId = +params['id'];
      if (this.courseId) {
        this.loadCourseContent();
      }
    });

    // ✅ FIXED: Listen for navigation events to refresh when returning from quiz
    this.routerSubscription.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        console.log('🔍 Navigation detected:', event.url);
        
        // If navigating to this course detail page, refresh the content
        if (event.url.includes(`/learner/course/${this.courseId}`)) {
          console.log('🔄 Refreshing course content after navigation');
          // Small delay to ensure navigation is complete
          setTimeout(() => {
            if (this.courseId) {
              this.loadCourseContent();
            }
          }, 200);
        }
      })
    );

    // ✅ ADDED: Also listen for focus events (when user returns to tab)
    window.addEventListener('focus', () => {
      console.log('🔄 Tab focused - refreshing content');
      if (this.courseId) {
        this.loadCourseContent();
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.routerSubscription.unsubscribe();
  }

  loadCourseContent(): void {
    this.loading = true;
    this.error = '';

    this.learnerService.getCourseContent(this.courseId).subscribe({
      next: (content) => {
        this.courseContent = content;
        this.loadQuizProgress();
        this.calculateStats();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading course content:', error);
        this.error = 'Failed to load course content. Please try again.';
        this.loading = false;
      }
    });
  }

  loadQuizProgress(): void {
    if (!this.courseContent?.quizzes) return;

    console.log('🔍 Loading quiz progress for', this.courseContent.quizzes.length, 'quizzes');

    // Track how many quizzes we've processed
    let processedQuizzes = 0;
    const totalQuizzes = this.courseContent.quizzes.length;

    this.courseContent.quizzes.forEach(quiz => {
      console.log(`🔍 Fetching progress for quiz ${quiz.quizId}: ${quiz.title}`);
      this.learnerService.getQuizProgress(quiz.quizId).subscribe({
        next: (progress) => {
          console.log(`🔍 Quiz ${quiz.quizId} raw progress response:`, progress);
          if (progress) {
            this.quizProgress[quiz.quizId] = progress;
            // Update quiz summary with progress data
            quiz.attempted = true;
            quiz.score = progress.score;
            quiz.percentage = Math.round((progress.score / progress.totalMarks) * 100);
            
            // ✅ FIXED: Determine status based on backend progress status
            console.log(`🔍 Quiz ${quiz.quizId} backend status: "${progress.status}"`);
            if (progress.status === 'Completed') {
              quiz.status = 'Passed';
            } else if (progress.status === 'InProgress') {
              quiz.status = 'Failed';  // InProgress = attempted but not passed
            } else {
              quiz.status = 'Not Attempted';
            }
            
            console.log(`✅ Quiz ${quiz.quizId} final status: ${quiz.status} (${quiz.percentage}% - ${quiz.score}/${quiz.totalMarks})`);
          } else {
            quiz.attempted = false;
            quiz.status = 'Not Attempted';
            console.log(`❌ Quiz ${quiz.quizId} no progress data - status: Not Attempted`);
          }

          // ✅ IMPROVED: Only calculate final stats after all quizzes are processed
          processedQuizzes++;
          if (processedQuizzes === totalQuizzes) {
            console.log('🔄 All quiz progress loaded - calculating final stats');
            this.calculateStats();
          }
        },
        error: (error) => {
          console.log(`❌ Error fetching progress for quiz ${quiz.quizId}:`, error);
          quiz.attempted = false;
          quiz.status = 'Not Attempted';
          
          // ✅ IMPROVED: Also count errors toward completion
          processedQuizzes++;
          if (processedQuizzes === totalQuizzes) {
            console.log('🔄 All quiz progress loaded (with errors) - calculating final stats');
            this.calculateStats();
          }
        }
      });
    });
  }

  calculateStats(): void {
    if (!this.courseContent) return;

    this.courseStats.totalMaterials = this.courseContent.materials.length;
    this.courseStats.totalQuizzes = this.courseContent.quizzes.length;
    this.courseStats.attemptedQuizzes = this.courseContent.quizzes.filter(q => q.attempted).length;
    this.courseStats.passedQuizzes = this.courseContent.quizzes.filter(q => q.status === 'Passed').length;
    
    // ✅ FIXED: Calculate progress percentage based on passed quizzes vs total quizzes
    if (this.courseStats.totalQuizzes > 0) {
      this.courseStats.overallProgress = Math.round((this.courseStats.passedQuizzes / this.courseStats.totalQuizzes) * 100);
    } else {
      this.courseStats.overallProgress = 0;
    }

    // 🔍 DEBUG: Log the stats calculation
    console.log('📊 Course Stats Updated:', {
      totalQuizzes: this.courseStats.totalQuizzes,
      attemptedQuizzes: this.courseStats.attemptedQuizzes,
      passedQuizzes: this.courseStats.passedQuizzes,
      overallProgress: this.courseStats.overallProgress,
      quizStatuses: this.courseContent.quizzes.map(q => ({ id: q.quizId, status: q.status, attempted: q.attempted }))
    });

    // ✅ NEW: Notify the course state service about progress update
    this.notifyProgressUpdate();
  }

  private notifyProgressUpdate(): void {
    if (!this.courseContent) return;

    const progressUpdate: CourseProgressUpdate = {
      courseId: this.courseId,
      progressPercentage: this.courseStats.overallProgress,
      totalQuizzes: this.courseStats.totalQuizzes,
      completedQuizzes: this.courseStats.attemptedQuizzes,
      passedQuizzes: this.courseStats.passedQuizzes,
      status: this.getOverallStatus()
    };

    this.courseStateService.updateCourseProgress(progressUpdate);
  }

  private getOverallStatus(): 'Not Started' | 'In Progress' | 'Completed' {
    if (this.courseStats.overallProgress === 100) {
      return 'Completed';
    } else if (this.courseStats.overallProgress > 0) {
      return 'In Progress';
    } else {
      return 'Not Started';
    }
  }

  setActiveTab(tab: 'overview' | 'materials' | 'quizzes'): void {
    this.activeTab = tab;
  }

  viewMaterial(material: CourseMaterial): void {
    console.log('Viewing material:', material);
    // Open material in new tab/modal or download
    if (material.filePath) {
      const url = material.filePath.startsWith('http') 
        ? material.filePath 
        : `http://localhost:5255${material.filePath}`;
      window.open(url, '_blank');
    }
  }

  downloadMaterial(material: CourseMaterial): void {
    console.log('Downloading material:', material);
    if (material.filePath) {
      const url = material.filePath.startsWith('http') 
        ? material.filePath 
        : `http://localhost:5255${material.filePath}`;
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = material.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  attemptQuiz(quiz: QuizSummary): void {
    console.log('Attempting quiz:', quiz);
    this.router.navigate(['/learner/quiz', quiz.quizId], {
      queryParams: { courseId: this.courseId }
    });
  }

  viewQuizResult(quiz: QuizSummary): void {
    console.log('Viewing quiz result:', quiz);
    // Could navigate to detailed result page or show modal
    const progress = this.quizProgress[quiz.quizId];
    if (progress) {
      alert(`Quiz Result:\nScore: ${progress.score}/${progress.totalMarks}\nPercentage: ${quiz.percentage}%\nStatus: ${quiz.status}`);
    }
  }

  getQuizStatusClass(status: string): string {
    return this.learnerService.getStatusBadgeClass(status);
  }

  getFileIcon(type: string): string {
    const fileType = type.toLowerCase();
    if (fileType.includes('video') || fileType.includes('mp4')) return 'fas fa-file-video';
    if (fileType.includes('pdf')) return 'fas fa-file-pdf';
    if (fileType.includes('doc')) return 'fas fa-file-word';
    if (fileType.includes('image')) return 'fas fa-file-image';
    return 'fas fa-file';
  }

  goBack(): void {
    this.router.navigate(['/learner/dashboard']);
  }

  refresh(): void {
    console.log('🔄 Manual refresh triggered');
    // Clear existing progress data to force fresh load
    this.quizProgress = {};
    this.loadCourseContent();
  }

  canAttemptQuiz(quiz: QuizSummary): boolean {
    // ✅ FIXED: Can attempt if not attempted yet, or if failed (allow retries for failed quizzes)
    // Cannot retake if already passed
    return !quiz.attempted || quiz.status === 'Failed';
  }

  getProgressWidth(percentage: number): string {
    return `${Math.max(percentage || 0, 2)}%`;
  }

  getProgressClass(percentage: number): string {
    if (percentage >= 70) return 'progress-success';
    if (percentage >= 50) return 'progress-warning';
    return 'progress-danger';
  }
} 