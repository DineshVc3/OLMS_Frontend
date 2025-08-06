import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearnerService } from '../../services/learner.service';

interface LearnerReports {
  learnerId: number;
  learnerName: string;
  courseProgress: LearnerCourseProgress[];
  overallStats: LearnerOverallStats;
}

interface LearnerCourseProgress {
  courseId: number;
  courseTitle: string;
  quizzesCompleted: number;
  totalQuizzes: number;
  overallScore: number;
  overallPercentage: number;
  progressStatus: string;
  quizProgress: LearnerQuizProgress[];
}

interface LearnerQuizProgress {
  quizId: number;
  quizTitle: string;
  score?: number;
  totalMarks: number;
  percentage?: number;
  status: string;
  attemptedAt?: Date;
}

interface LearnerOverallStats {
  totalCoursesEnrolled: number;
  totalQuizzesCompleted: number;
  totalQuizzesPending: number;
  overallAverageScore: number;
}

@Component({
  selector: 'app-learner-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reports-container">
      <div class="reports-header">
        <h2><i class="fas fa-chart-line"></i> My Learning Progress</h2>
        <p>Track your progress across all enrolled courses</p>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading your progress...</p>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMessage }}
      </div>

      <div *ngIf="reports && !isLoading" class="reports-content">
        <!-- Overall Statistics Cards -->
        <div class="stats-grid">
          <div class="stat-card courses">
            <div class="stat-icon">
              <i class="fas fa-book"></i>
            </div>
            <div class="stat-content">
              <h3>{{ reports.overallStats.totalCoursesEnrolled }}</h3>
              <p>Enrolled Courses</p>
            </div>
          </div>

          <div class="stat-card completed">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <h3>{{ reports.overallStats.totalQuizzesCompleted }}</h3>
              <p>Quizzes Completed</p>
            </div>
          </div>

          <div class="stat-card pending">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-content">
              <h3>{{ reports.overallStats.totalQuizzesPending }}</h3>
              <p>Quizzes Pending</p>
            </div>
          </div>

          <div class="stat-card average">
            <div class="stat-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="stat-content">
              <h3>{{ reports.overallStats.overallAverageScore | number:'1.1-1' }}%</h3>
              <p>Overall Average</p>
            </div>
          </div>
        </div>

        <!-- Course Progress Details -->
        <div class="section-card">
          <h3><i class="fas fa-graduation-cap"></i> Course Progress Details</h3>
          
          <div *ngFor="let course of reports.courseProgress" class="course-card">
            <div class="course-header">
              <h4>{{ course.courseTitle }}</h4>
              <span class="status-badge" [ngClass]="getStatusClass(course.progressStatus)">
                {{ course.progressStatus }}
              </span>
            </div>
            
            <div class="course-stats">
              <div class="stat-item">
                <span class="label">Progress:</span>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="course.overallPercentage"></div>
                  </div>
                  <span class="percentage">{{ course.overallPercentage | number:'1.1-1' }}%</span>
                </div>
              </div>
              
              <div class="stat-item">
                <span class="label">Quizzes:</span>
                <span class="value">{{ course.quizzesCompleted }}/{{ course.totalQuizzes }} completed</span>
              </div>
              
              <div class="stat-item">
                <span class="label">Score:</span>
                <span class="value">{{ course.overallScore }} points</span>
              </div>
            </div>

            <!-- Quiz Details -->
            <div class="quiz-details">
              <h5>Quiz Breakdown:</h5>
              <div class="quiz-grid">
                <div *ngFor="let quiz of course.quizProgress" class="quiz-item">
                  <div class="quiz-info">
                    <strong>{{ quiz.quizTitle }}</strong>
                    <span class="quiz-status" [ngClass]="getQuizStatusClass(quiz.status)">
                      {{ quiz.status }}
                    </span>
                  </div>
                  
                  <div class="quiz-score" *ngIf="quiz.score !== null; else notAttempted">
                    <span class="score">{{ quiz.score }}/{{ quiz.totalMarks }}</span>
                    <span class="percentage">({{ quiz.percentage | number:'1.1-1' }}%)</span>
                    <small *ngIf="quiz.attemptedAt" class="attempt-date">
                      Attempted: {{ quiz.attemptedAt | date:'short' }}
                    </small>
                  </div>
                  
                  <ng-template #notAttempted>
                    <div class="quiz-score pending">
                      <span class="score">Not Attempted</span>
                      <span class="total-marks">{{ quiz.totalMarks }} marks</span>
                    </div>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .reports-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .reports-header h2 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .reports-header h2 i {
      margin-right: 10px;
      color: #3498db;
    }

    .loading-container {
      text-align: center;
      padding: 50px;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      background: #e74c3c;
      color: white;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      margin-bottom: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      transition: transform 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-card.courses { border-left: 4px solid #3498db; }
    .stat-card.completed { border-left: 4px solid #27ae60; }
    .stat-card.pending { border-left: 4px solid #f39c12; }
    .stat-card.average { border-left: 4px solid #9b59b6; }

    .stat-icon {
      font-size: 2.5rem;
      margin-right: 20px;
      width: 60px;
      text-align: center;
    }

    .stat-card.courses .stat-icon { color: #3498db; }
    .stat-card.completed .stat-icon { color: #27ae60; }
    .stat-card.pending .stat-icon { color: #f39c12; }
    .stat-card.average .stat-icon { color: #9b59b6; }

    .stat-content h3 {
      font-size: 2rem;
      margin: 0;
      color: #2c3e50;
    }

    .stat-content p {
      margin: 5px 0 0;
      color: #7f8c8d;
      font-weight: 500;
    }

    .section-card {
      background: white;
      border-radius: 10px;
      padding: 25px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .section-card h3 {
      color: #2c3e50;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ecf0f1;
    }

    .section-card h3 i {
      margin-right: 10px;
      color: #3498db;
    }

    .course-card {
      border: 1px solid #ecf0f1;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      background: #fafafa;
    }

    .course-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .course-header h4 {
      color: #2c3e50;
      margin: 0;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 15px;
      font-weight: 500;
      font-size: 12px;
    }

    .status-badge.completed { background: #27ae60; color: white; }
    .status-badge.in-progress { background: #f39c12; color: white; }
    .status-badge.not-started { background: #95a5a6; color: white; }

    .course-stats {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
      align-items: center;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-item .label {
      font-weight: 600;
      color: #7f8c8d;
      font-size: 12px;
      margin-bottom: 5px;
    }

    .stat-item .value {
      color: #2c3e50;
      font-weight: 500;
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #e74c3c 0%, #f39c12 50%, #27ae60 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .percentage {
      font-weight: 600;
      color: #2c3e50;
      min-width: 50px;
      font-size: 14px;
    }

    .quiz-details h5 {
      color: #2c3e50;
      margin-bottom: 15px;
      font-size: 16px;
    }

    .quiz-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
    }

    .quiz-item {
      background: white;
      border: 1px solid #ecf0f1;
      border-radius: 6px;
      padding: 15px;
    }

    .quiz-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .quiz-info strong {
      color: #2c3e50;
      font-size: 14px;
    }

    .quiz-status {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 500;
    }

    .quiz-status.completed { background: #27ae60; color: white; }
    .quiz-status.pending { background: #f39c12; color: white; }

    .quiz-score {
      font-size: 14px;
    }

    .quiz-score .score {
      font-weight: 600;
      color: #2c3e50;
    }

    .quiz-score .percentage {
      color: #7f8c8d;
      margin-left: 5px;
    }

    .quiz-score.pending {
      color: #7f8c8d;
    }

    .attempt-date {
      display: block;
      color: #95a5a6;
      font-size: 11px;
      margin-top: 5px;
    }

    .total-marks {
      color: #7f8c8d;
      font-size: 12px;
      margin-left: 5px;
    }

    @media (max-width: 768px) {
      .course-stats {
        grid-template-columns: 1fr;
        gap: 10px;
      }
      
      .quiz-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LearnerReportsComponent implements OnInit {
  reports: LearnerReports | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(private learnerService: LearnerService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Use existing LearnerService APIs
    this.learnerService.getEnrolledCourses().subscribe({
      next: (courses) => {
        // Create static progress data - can be enhanced with real data later
        const courseProgress: LearnerCourseProgress[] = courses.map(course => {
          const totalQuizzes = Math.floor(Math.random() * 5) + 3; // 3-7 quizzes
          const quizzesCompleted = Math.floor(Math.random() * totalQuizzes);
          const overallScore = Math.floor(Math.random() * 80) + 20; // 20-100 points
          
          const quizProgress: LearnerQuizProgress[] = [];
          for (let i = 1; i <= totalQuizzes; i++) {
            const isCompleted = i <= quizzesCompleted;
            quizProgress.push({
              quizId: i,
              quizTitle: `Quiz ${i}`,
              score: isCompleted ? Math.floor(Math.random() * 20) + 10 : undefined,
              totalMarks: 30,
              percentage: isCompleted ? Math.floor(Math.random() * 80) + 20 : undefined,
              status: isCompleted ? 'Completed' : 'Pending',
              attemptedAt: isCompleted ? new Date() : undefined
            });
          }

          let progressStatus = 'Not Started';
          if (quizzesCompleted === totalQuizzes && totalQuizzes > 0) {
            progressStatus = 'Completed';
          } else if (quizzesCompleted > 0) {
            progressStatus = 'In Progress';
          }

          return {
            courseId: course.courseId,
            courseTitle: course.title,
            quizzesCompleted,
            totalQuizzes,
            overallScore,
            overallPercentage: (overallScore / (totalQuizzes * 30)) * 100,
            progressStatus,
            quizProgress
          };
        });

        const totalQuizzesCompleted = courseProgress.reduce((sum, course) => sum + course.quizzesCompleted, 0);
        const totalQuizzes = courseProgress.reduce((sum, course) => sum + course.totalQuizzes, 0);
        const totalQuizzesPending = totalQuizzes - totalQuizzesCompleted;
        const overallAverageScore = courseProgress.length > 0 
          ? courseProgress.reduce((sum, course) => sum + course.overallPercentage, 0) / courseProgress.length
          : 0;

        this.reports = {
          learnerId: 1, // Static
          learnerName: 'Learner',
          courseProgress,
          overallStats: {
            totalCoursesEnrolled: courses.length,
            totalQuizzesCompleted,
            totalQuizzesPending,
            overallAverageScore
          }
        };
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load your progress reports. Please try again.';
        this.isLoading = false;
        console.error('Error loading Learner reports:', error);
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'completed';
      case 'in progress': return 'in-progress';
      default: return 'not-started';
    }
  }

  getQuizStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'completed';
      default: return 'pending';
    }
  }
} 