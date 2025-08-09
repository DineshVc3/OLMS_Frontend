import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CourseStateService } from '../../../services/course-state.service';
import { EnrolledCourse, LearnerService, QuizSummary } from '../../../services/learner.service';
import { CourseService, Quiz, Course } from '../../../services/course.service';
import { QuizCompletionService } from '../../../services/quiz-completion.service';

@Component({
  selector: 'app-learner-course',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="learner-course">
      <div class="section-header">
        <h2><i class="fas fa-book"></i> Course Content</h2>
        <div *ngIf="selectedCourse" class="course-info">
          <span class="course-title">{{ selectedCourse.title }}</span>
        </div>
      </div>
      
      <div class="course-content">
        <!-- Selected Course Details -->
        <div *ngIf="selectedCourse" class="selected-course-details">
          <div class="course-header">
            <h3>{{ selectedCourse.title }}</h3>
            <span class="status-badge" [ngClass]="getStatusClass(selectedCourse.status)">
              {{ selectedCourse.status || 'Not Started' }}
            </span>
          </div>
          
          <div class="course-meta">
            <div class="meta-item">
              <i class="fas fa-user-tie"></i>
              <span>Instructor: {{ selectedCourse.instructorName }}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-calendar"></i>
              <span>Enrolled: {{ selectedCourse.enrolledAt }}</span>
            </div>
            <div class="meta-item">
              <i class="fas fa-chart-line"></i>
              <span>Progress: {{ selectedCourse.progressPercentage || 0 }}%</span>
            </div>
          </div>
          
          <div class="course-description">
            <h4><i class="fas fa-info-circle"></i> Description</h4>
            <p>{{ selectedCourse.description }}</p>
          </div>
          
          <!-- Course Details Sections -->
          <div class="course-details-grid">
            <div class="detail-card" *ngIf="fullCourseDetails?.syllabus">
              <h4><i class="fas fa-list"></i> Syllabus</h4>
              <p>{{ fullCourseDetails?.syllabus }}</p>
            </div>
            
            <div class="detail-card" *ngIf="fullCourseDetails?.prerequisites">
              <h4><i class="fas fa-graduation-cap"></i> Prerequisites</h4>
              <p>{{ fullCourseDetails?.prerequisites }}</p>
            </div>
            
            <div class="detail-card">
              <h4><i class="fas fa-clock"></i> Course Timeline</h4>
              <div class="timeline-info">
                <div class="timeline-item">
                  <span class="label">Enrolled:</span>
                  <span class="value">{{ selectedCourse.enrolledAt }}</span>
                </div>
                <div class="timeline-item">
                  <span class="label">Status:</span>
                  <span class="value status-badge" [ngClass]="getStatusClass(selectedCourse.status)">
                    {{ selectedCourse.status || 'Not Started' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="course-progress">
            <div class="progress-header">
              <span>Course Progress</span>
              <span class="progress-percentage">{{ selectedCourse.progressPercentage || 0 }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width]="(selectedCourse.progressPercentage || 0) + '%'"></div>
            </div>
          </div>
          
          <!-- Enhanced Course Statistics -->
          <div class="course-stats">
            <h4><i class="fas fa-chart-bar"></i> Course Statistics</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <i class="fas fa-file-alt"></i>
                <span class="stat-number">{{ courseData.length }}</span>
                <span class="stat-label">Materials</span>
              </div>
              <div class="stat-card">
                <i class="fas fa-question-circle"></i>
                <span class="stat-number">{{ courseQuizzes.length }}</span>
                <span class="stat-label">Quizzes</span>
              </div>
              <div class="stat-card">
                <i class="fas fa-check-circle"></i>
                <span class="stat-number">{{ completedQuizzes }}</span>
                <span class="stat-label">Completed</span>
              </div>
              <div class="stat-card">
                <i class="fas fa-trophy"></i>
                <span class="stat-number">{{ passedQuizzes }}</span>
                <span class="stat-label">Passed</span>
              </div>
            </div>
          </div>

          <!-- Course Materials Section -->
          <div class="course-materials">
            <h4><i class="fas fa-folder-open"></i> Course Materials</h4>
            
            <!-- Loading State -->
            <div *ngIf="loading" class="loading-section">
              <div class="spinner"></div>
              <p>Loading course materials...</p>
            </div>
            
            <!-- Error State -->
            <div *ngIf="error && !loading" class="error-section">
              <i class="fas fa-exclamation-triangle"></i>
              <p>{{ error }}</p>
              <div class="error-actions">
                <button class="retry-btn" (click)="loadCourseData(selectedCourse.courseId)">
                  <i class="fas fa-retry"></i>
                  Try Again
                </button>
                <button class="debug-btn" (click)="testJwtInfo()">
                  <i class="fas fa-bug"></i>
                  Debug JWT
                </button>
                <button class="debug-btn" (click)="testEnrollment()">
                  <i class="fas fa-search"></i>
                  Check Enrollment
                </button>
              </div>
            </div>
            
            <!-- Course Data Display -->
            <div *ngIf="!loading && !error && courseData.length > 0" class="materials-list">
              <div *ngFor="let material of courseData; trackBy: trackByMaterialId" class="material-item">
                <div class="material-info">
                  <div class="material-icon">
                    <i [class]="getMaterialIcon(material?.type || material?.filePath || '')"></i>
                  </div>
                  <div class="material-details">
                    <h5>{{ material.title || 'Course Material' }}</h5>
                    <p class="material-description">{{ material.description || 'No description available' }}</p>
                    <div class="material-meta">
                      <span class="material-type">{{ getMaterialType(material?.type || material?.filePath || '') }}</span>
                      <span class="upload-date">
                        <i class="fas fa-calendar"></i>
                        {{ formatDate(material.createdAt || material.uploadedAt) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="material-actions">
                  <button *ngIf="material.filePath" 
                          class="download-btn"
                          (click)="downloadMaterial(material)"
                          [title]="'Download ' + (material.title || 'material')">
                    <i class="fas fa-download"></i>
                    Download
                  </button>
                  <button *ngIf="material.filePath" 
                          class="view-btn"
                          (click)="viewMaterial(material)"
                          [title]="'View ' + (material.title || 'material')">
                    <i class="fas fa-eye"></i>
                    View
                  </button>
                </div>
              </div>
            </div>
             
            <!-- No Materials State -->
            <div *ngIf="!loading && !error && courseData.length === 0" class="no-materials">
              <i class="fas fa-folder-open"></i>
              <h5>No Materials Yet</h5>
              <p>Course materials haven't been uploaded yet. Check back later!</p>
            </div>
          </div>

          <!-- Enhanced Course Quizzes Section -->
          <div class="course-quizzes">
            <h4><i class="fas fa-question-circle"></i> Course Quizzes</h4>
            
            <!-- Quiz Loading State -->
            <div *ngIf="quizLoading" class="loading-section">
              <div class="spinner"></div>
              <p>Loading course quizzes...</p>
            </div>
            
            <!-- Quiz Error State -->
            <div *ngIf="quizError && !quizLoading" class="error-section">
              <i class="fas fa-exclamation-triangle"></i>
              <p>{{ quizError }}</p>
              <div class="error-actions">
                <button class="retry-btn" (click)="loadCourseQuizzes(selectedCourse.courseId)">
                  <i class="fas fa-retry"></i>
                  Try Again
                </button>
              </div>
            </div>
            
            <!-- Quiz List Display -->
            <div *ngIf="!quizLoading && !quizError && courseQuizzes.length > 0" class="quiz-list">
              <div *ngFor="let quiz of courseQuizzes; trackBy: trackByQuizId" class="quiz-item">
                <div class="quiz-info">
                  <div class="quiz-icon">
                    <i class="fas fa-question-circle"></i>
                  </div>
                  <div class="quiz-details">
                    <h5>{{ quiz.title }}</h5>
                    <p class="quiz-description">Total Marks: {{ quiz.totalMarks }}</p>
                    <div class="quiz-meta">
                      <span class="quiz-questions">
                        <i class="fas fa-list"></i>
                        {{ quiz.questions?.length || 0 }} Questions
                      </span>
                      <span class="quiz-created">
                        <i class="fas fa-calendar"></i>
                        {{ formatDate(quiz.createdAt) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="quiz-status">
                  <span class="status-badge" [ngClass]="getQuizStatusClass(quiz.Status || 'Not Attempted')">
                    {{ quiz.Status || 'Not Attempted' }}
                  </span>
                </div>
                <div class="quiz-actions">
                  <!-- Learner Actions -->
                  <ng-container *ngIf="isLearner()">
                    <button class="attempt-btn" 
                            (click)="attemptQuiz(quiz)"
                            [disabled]="quiz.IsPassed"
                            [class.success]="quiz.IsPassed"
                            [class.warning]="quiz.IsFailed">
                      <i class="fas" [class.fa-play]="!quiz.IsAttempted" [class.fa-redo]="quiz.IsFailed" [class.fa-check]="quiz.IsPassed"></i>
                      {{ quiz.IsPassed ? 'Passed ✅' : (quiz.IsFailed ? 'Retake' : 'Take Quiz') }}
                    </button>
                    <button class="result-btn" 
                            (click)="viewQuizResult(quiz)" 
                            *ngIf="quiz.IsAttempted"
                            title="View Results">
                      <i class="fas fa-chart-bar"></i>
                      Results
                    </button>
                  </ng-container>
                  
                  <!-- Instructor Actions -->
                  <ng-container *ngIf="isInstructor()">
                    <button class="edit-btn" (click)="editQuiz(quiz)" title="Edit Quiz">
                      <i class="fas fa-edit"></i>
                      Edit
                    </button>
                    <button class="result-btn" (click)="viewQuizResult(quiz)" title="View Student Results">
                      <i class="fas fa-chart-bar"></i>
                      Student Results
                    </button>
                  </ng-container>
                  
                  <!-- Admin Actions -->
                  <ng-container *ngIf="canManageCourses()">
                    <button class="view-btn" (click)="viewQuizDetails(quiz)" title="View Quiz Details">
                      <i class="fas fa-eye"></i>
                      View Details
                    </button>
                  </ng-container>
                </div>
              </div>
            </div>
             
            <!-- No Quizzes State -->
            <div *ngIf="!quizLoading && !quizError && courseQuizzes.length === 0" class="no-quizzes">
              <i class="fas fa-question-circle"></i>
              <h5>No Quizzes Yet</h5>
              <p>No quizzes have been created for this course yet. Check back later!</p>
            </div>
          </div>
        </div>
        
        <!-- No Course Selected Placeholder -->
        <div *ngIf="!selectedCourse" class="content-placeholder">
          <i class="fas fa-graduation-cap"></i>
          <h3>Select a Course</h3>
          <p>Select a course from your dashboard to view detailed content, quizzes, and course materials.</p>
          <div class="features-list">
            <div class="feature-item">
              <i class="fas fa-video"></i>
              <span>Video Lectures</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-file-alt"></i>
              <span>Reading Materials</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-question-circle"></i>
              <span>Interactive Quizzes</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-certificate"></i>
              <span>Assignments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* =============== ENHANCED STYLES =============== */
    .learner-course {
      padding: 2rem;
      background: #f8f9fa;
      min-height: calc(100vh - 140px);
    }

    .section-header {
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-header h2 {
      color: #2c3e50;
      font-size: 1.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    .course-info {
      display: flex;
      align-items: center;
    }

    .course-title {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    /* =============== COURSE DETAILS GRID =============== */
    .course-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin: 1.5rem 0;
    }

    .detail-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1.25rem;
      transition: all 0.3s ease;
    }

    .detail-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .detail-card h4 {
      margin: 0 0 1rem 0;
      color: #495057;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .detail-card h4 i {
      color: #667eea;
    }

    /* =============== ENHANCED COURSE STATISTICS =============== */
    .course-stats {
      margin: 2rem 0;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .course-stats h4 {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-card i {
      font-size: 2rem;
      color: #667eea;
      margin-bottom: 0.5rem;
    }

    .stat-number {
      display: block;
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #6c757d;
      font-weight: 500;
    }

    /* =============== ENHANCED MATERIALS LIST =============== */
    .course-materials, .course-quizzes {
      margin: 2rem 0;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #e9ecef;
    }

    .course-materials h4, .course-quizzes h4 {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .materials-list, .quiz-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .material-item, .quiz-item {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .material-item:hover, .quiz-item:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
      transform: translateY(-1px);
    }

    .material-info, .quiz-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .material-icon, .quiz-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .material-details, .quiz-details {
      flex: 1;
    }

    .material-details h5, .quiz-details h5 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .material-description, .quiz-description {
      margin: 0 0 0.5rem 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .material-meta, .quiz-meta {
      display: flex;
      gap: 1rem;
      align-items: center;
      font-size: 0.85rem;
      color: #6c757d;
    }

    .material-type, .quiz-questions, .quiz-created {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* =============== ACTION BUTTONS =============== */
    .material-actions, .quiz-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .download-btn, .view-btn, .attempt-btn, .result-btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: none;
      cursor: pointer;
    }

    .download-btn {
      background: #28a745;
      color: white;
    }

    .download-btn:hover {
      background: #218838;
      transform: translateY(-1px);
    }

    .view-btn {
      background: #667eea;
      color: white;
    }

    .view-btn:hover {
      background: #5a6fd8;
      transform: translateY(-1px);
    }

    .attempt-btn {
      background: #007bff;
      color: white;
    }

    .attempt-btn:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }

    /* ✅ ADDED: Success state for passed quizzes */
    .attempt-btn.success {
      background: #28a745;
      cursor: not-allowed;
    }

    .attempt-btn.success:hover {
      background: #28a745;
      transform: none;
    }

    /* ✅ ADDED: Warning state for failed quizzes (retake) */
    .attempt-btn.warning {
      background: #ffc107;
      color: #212529;
    }

    .attempt-btn.warning:hover {
      background: #e0a800;
      transform: translateY(-1px);
    }

    .result-btn {
      background: #6f42c1;
      color: white;
    }

    .result-btn:hover {
      background: #5a32a3;
      transform: translateY(-1px);
    }

    .edit-btn {
      background: #fd7e14;
      color: white;
    }

    .edit-btn:hover {
      background: #e8650e;
      transform: translateY(-1px);
    }

    /* =============== QUIZ STATUS AND SCORE =============== */
    .quiz-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-right: 1rem;
    }

    .quiz-score {
      font-size: 0.85rem;
      color: #6c757d;
      font-weight: 500;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .status-completed, .quiz-status-passed {
      background: #d4edda;
      color: #155724;
    }

    .status-progress, .quiz-status-attempted {
      background: #fff3cd;
      color: #856404;
    }

    .status-not-started, .quiz-status-not-attempted {
      background: #e2e3e5;
      color: #383d41;
    }

    .quiz-status-failed {
      background: #f8d7da;
      color: #721c24;
    }

    /* =============== COMMON STYLES =============== */
    .selected-course-details {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .course-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f1f3f4;
    }

    .course-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.8rem;
    }

    .course-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      font-weight: 500;
    }

    .meta-item i {
      color: #667eea;
      width: 20px;
    }

    .course-description {
      margin-bottom: 2rem;
    }

    .course-description h4 {
      margin: 0 0 1rem 0;
      color: #495057;
      font-size: 1.2rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .course-description p {
      color: #666;
      line-height: 1.6;
      font-size: 1rem;
    }

    .course-progress {
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .progress-percentage {
      color: #667eea;
      font-weight: 700;
    }

    .progress-bar {
      width: 100%;
      height: 12px;
      background: #e9ecef;
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 6px;
      transition: width 0.3s ease;
    }

    /* =============== LOADING AND ERROR STATES =============== */
    .loading-section, .error-section, .no-materials, .no-quizzes {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .loading-section .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-section i, .no-materials i, .no-quizzes i {
      font-size: 2rem;
      color: #e74c3c;
      margin-bottom: 1rem;
    }

    .no-materials i, .no-quizzes i {
      color: #bdc3c7;
    }

    .retry-btn, .debug-btn {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      margin: 0.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .debug-btn {
      background: #667eea;
    }

    .retry-btn:hover {
      background: #c0392b;
    }

    .debug-btn:hover {
      background: #5a6fd8;
    }

    /* =============== CONTENT PLACEHOLDER =============== */
    .content-placeholder {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .content-placeholder i {
      font-size: 4rem;
      color: #667eea;
      margin-bottom: 1rem;
    }

    .content-placeholder h3 {
      color: #2c3e50;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }

    .content-placeholder p {
      color: #7f8c8d;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    .features-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      font-weight: 500;
      color: #2c3e50;
      border: 1px solid #e9ecef;
    }

    .feature-item i {
      color: #667eea;
      font-size: 1.2rem;
    }

    /* =============== RESPONSIVE DESIGN =============== */
    @media (max-width: 768px) {
      .learner-course {
        padding: 1rem;
      }

      .section-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .course-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .material-item, .quiz-item {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .material-actions, .quiz-actions {
        width: 100%;
        justify-content: center;
      }

      .quiz-status {
        align-items: flex-start;
        margin-right: 0;
      }
    }
  `]
})
export class LearnerCourseComponent implements OnInit, OnDestroy {
  selectedCourse: EnrolledCourse | null = null;
  selectedCourseId: number | null = null;
  currentlyLoadedCourseId: number | null = null;
  fullCourseDetails: Course | null = null;
  courseData: any[] = [];
  courseQuizzes: Quiz[] = [];
  loading = false;
  quizLoading = false;
  error = '';
  quizError = '';
  
  // Statistics
  completedQuizzes = 0;
  passedQuizzes = 0;
  
  // Add these properties to your component class
  showQuizModal = false;
  currentQuiz: any = null;
  quizQuestions: any[] = [];
  userAnswers: { [questionId: number]: string } = {};
  quizTimer: any = null;
  timeRemaining: number = 0;
  
  // Debug properties
  debugModal = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private courseStateService: CourseStateService,
    private courseService: CourseService,
    private learnerService: LearnerService,
    private cdr: ChangeDetectorRef,
    private quizCompletionService: QuizCompletionService
  ) {}

  ngOnInit(): void {
    console.log('🏠 Learner course component initializing...');
    
    // Subscribe to selected course changes
    this.subscription.add(
      this.courseStateService.selectedCourse$.subscribe(course => {
        console.log('📝 Selected course changed:', course?.courseId);
        this.selectedCourse = course;
        if (course && course.courseId !== this.currentlyLoadedCourseId) {
          console.log('🔄 Loading new course:', course.courseId);
          this.currentlyLoadedCourseId = course.courseId;
          this.loadFullCourseDetails(course.courseId);
          this.loadCourseData(course.courseId);
          this.loadCourseQuizzes(course.courseId);
        } else if (!course) {
          // If no course is selected, load the first enrolled course
          this.loadDefaultCourse();
        } else {
          console.log('📝 Course already loaded, skipping reload');
        }
      })
    );

    this.subscription.add(
      this.courseStateService.selectedCourseId$.subscribe(courseId => {
        console.log('📝 Selected course ID changed:', courseId);
        this.selectedCourseId = courseId;
        if (courseId && !this.selectedCourse && courseId !== this.currentlyLoadedCourseId) {
          console.log('🔄 Loading course by ID:', courseId);
          this.currentlyLoadedCourseId = courseId;
          this.loadFullCourseDetails(courseId);
          this.loadCourseData(courseId);
          this.loadCourseQuizzes(courseId);
        }
      })
    );
  }

  loadDefaultCourse(): void {
    this.learnerService.getEnrolledCourses().subscribe({
      next: (courses) => {
        if (courses && courses.length > 0) {
          const firstCourse = courses[0];
          this.selectedCourse = firstCourse;
          this.courseStateService.setSelectedCourse(firstCourse);
          this.loadFullCourseDetails(firstCourse.courseId);
          this.loadCourseData(firstCourse.courseId);
          this.loadCourseQuizzes(firstCourse.courseId);
        }
      },
      error: (error) => {
        console.error('Error loading default course:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadCourseData(courseId: number): void {
    console.log('🔍 FRONTEND DEBUG: loadCourseData called with courseId:', courseId);
    this.loading = true;
    this.error = '';
    this.courseData = [];

    console.log('🔍 FRONTEND DEBUG: About to call learnerService.getCourseData');
    this.learnerService.getCourseData(courseId).subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.courseData = data;
        } else if (data && data.message) {
          this.courseData = [];
          console.log('Course data message:', data.message);
        } else {
          this.courseData = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('🔍 FRONTEND DEBUG: Error loading course data:', error);
        console.error('🔍 FRONTEND DEBUG: Error status:', error.status);
        console.error('🔍 FRONTEND DEBUG: Error URL:', error.url);
        
        if (error.status === 403) {
          this.error = 'Access denied: You are not enrolled in this course or do not have permission to view this content.';
        } else if (error.status === 404) {
          this.error = 'Course content not found.';
        } else if (error.status === 401) {
          this.error = 'Please log in again to access course content.';
        } else if (error.status === 400) {
          this.error = 'Invalid request. Please try refreshing the page.';
        } else {
          this.error = 'Failed to load course content. Please try again.';
        }
        this.loading = false;
      }
    });
  }

  loadCourseQuizzes(courseId: number): void {
    this.quizLoading = true;
    this.quizError = '';

    const userRole = this.courseService.getCurrentUserRole();
    
    if (userRole === 'Learner') {
      // Use learner-specific endpoint
      this.courseService.getQuizzesForLearner(courseId).subscribe({
        next: (quizzes) => {
          console.log('Learner quizzes loaded:', quizzes);
          // ✅ FIXED: Backend returns quiz data with proper status, map to Quiz format
          this.courseQuizzes = quizzes.map(q => ({
            quizId: q.QuizId || q.quizId,
            courseId: courseId,
            title: q.Title || q.title,
            totalMarks: q.TotalMarks || q.totalMarks,
            createdAt: q.CreatedAt || q.createdAt,
            questions: [], // Questions aren't included for learners
            IsAttempted: q.IsAttempted || q.isAttempted || false,
            IsPassed: q.IsPassed || q.isPassed || false,
            IsFailed: q.IsFailed || q.isFailed || false,
            Score: q.Score || q.score || 0,
            Status: q.Status || q.status || 'Not Attempted',
            QuestionCount: q.QuestionCount || q.questionCount || 0
          } as any));
          this.updateQuizStatistics();
          this.quizLoading = false;
        },
        error: (error) => {
          console.error('Error loading learner quizzes:', error);
          this.quizError = 'Failed to load quizzes. Please try again.';
          this.quizLoading = false;
        }
      });
    } else {
      // Use instructor endpoint for full quiz data
      this.courseService.getQuizzesByCourse(courseId).subscribe({
        next: (quizzes) => {
          console.log('Instructor quizzes loaded:', quizzes);
          this.courseQuizzes = quizzes;
          this.updateQuizStatistics();
          this.quizLoading = false;
        },
        error: (error) => {
          console.error('Error loading instructor quizzes:', error);
          this.quizError = 'Failed to load quizzes. Please try again.';
          this.quizLoading = false;
        }
      });
    }
  }

  loadFullCourseDetails(courseId: number): void {
    this.courseService.getCourseById(courseId).subscribe({
      next: (course: Course) => {
        this.fullCourseDetails = course;
        console.log('Full course details loaded:', course);
      },
      error: (error: any) => {
        console.error('Error loading full course details:', error);
        // Don't show error to user for this, as it's supplementary data
      }
    });
  }

  updateQuizStatistics(): void {
    console.log('🔄 Updating quiz statistics...');
    // ✅ FIXED: Calculate statistics based on actual quiz status
    if (!this.courseQuizzes || this.courseQuizzes.length === 0) {
      this.completedQuizzes = 0;
      this.passedQuizzes = 0;
      this.updateCourseProgress(0);
      return;
    }

    // Count quizzes by status
    const newCompletedQuizzes = this.courseQuizzes.filter(quiz => 
      quiz.Status === 'Passed' || quiz.IsPassed
    ).length;
    
    const newPassedQuizzes = this.courseQuizzes.filter(quiz => 
      quiz.Status === 'Passed' || quiz.IsPassed
    ).length;

    // ✅ ADDED: Calculate and update course progress percentage
    const progressPercentage = this.courseQuizzes.length > 0 
      ? Math.round((newPassedQuizzes / this.courseQuizzes.length) * 100)
      : 0;
    
    // Only update if values have actually changed to prevent redundant notifications
    const hasChanged = this.completedQuizzes !== newCompletedQuizzes || 
                      this.passedQuizzes !== newPassedQuizzes ||
                      this.selectedCourse?.progressPercentage !== progressPercentage;
    
    this.completedQuizzes = newCompletedQuizzes;
    this.passedQuizzes = newPassedQuizzes;
    
    if (hasChanged) {
      console.log('📈 Progress has changed, updating...');
      this.updateCourseProgress(progressPercentage);
      
      // Log newly completed quizzes for instructor reporting
      this.logNewQuizCompletions(newCompletedQuizzes);
    } else {
      console.log('📈 Progress unchanged, skipping update');
    }

    // 🔍 DEBUG: Log quiz statistics
    console.log('📊 Quiz Statistics Updated:', {
      totalQuizzes: this.courseQuizzes.length,
      completedQuizzes: this.completedQuizzes,
      passedQuizzes: this.passedQuizzes,
      progressPercentage: progressPercentage,
      quizStatuses: this.courseQuizzes.map(q => ({ 
        id: q.quizId, 
        title: q.title,
        status: q.Status, 
        isPassed: q.IsPassed,
        isAttempted: q.IsAttempted 
      }))
    });
  }

  // ✅ ENHANCED: Update course progress percentage and notify dashboard
  updateCourseProgress(percentage: number): void {
    if (this.selectedCourse) {
      this.selectedCourse.progressPercentage = percentage;
      console.log(`📈 Course progress updated to: ${percentage}%`);
      
      // Determine status based on progress
      let status: 'Not Started' | 'In Progress' | 'Completed' = 'Not Started';
      if (percentage === 100) {
        status = 'Completed';
      } else if (percentage > 0) {
        status = 'In Progress';
      }
      
      // Update the selected course status
      this.selectedCourse.status = status;
      
      // Notify the dashboard about the progress update
      const progressUpdate = {
        courseId: this.selectedCourse.courseId,
        progressPercentage: percentage,
        totalQuizzes: this.courseQuizzes?.length || 0,
        completedQuizzes: this.completedQuizzes || 0,
        passedQuizzes: this.passedQuizzes || 0,
        status: status
      };
      
      console.log('🔔 Notifying dashboard of progress update:', progressUpdate);
      this.courseStateService.updateCourseProgress(progressUpdate);
    }
  }

  // Log newly completed quizzes for instructor reporting
  private logNewQuizCompletions(currentCompletedCount: number): void {
    if (!this.selectedCourse || !this.courseQuizzes) return;
    
    // Find newly completed quizzes
    const completedQuizzes = this.courseQuizzes.filter(quiz => 
      quiz.Status === 'Passed' || quiz.IsPassed
    );
    
    // Log each completed quiz (this could be enhanced to only log new ones)
    completedQuizzes.forEach(quiz => {
      const completionLog = this.quizCompletionService.createQuizCompletionLog(
        this.selectedCourse!.courseId,
        this.selectedCourse!.title,
        quiz.quizId,
        quiz.title,
        quiz.Score || 0,
        quiz.totalMarks || 0,
        1 // Attempt number - could be enhanced
      );
      
      // Log to backend (in a real app, you'd want to debounce this)
      this.quizCompletionService.logQuizCompletion(completionLog).subscribe({
        next: () => console.log('✅ Quiz completion logged successfully'),
        error: (error) => console.error('❌ Failed to log quiz completion:', error)
      });
    });
    
    // If course is completed, mark it as completed
    if (currentCompletedCount === this.courseQuizzes.length && this.courseQuizzes.length > 0) {
      this.markCourseAsCompleted();
    }
  }

  // Mark course as completed in the backend
  private markCourseAsCompleted(): void {
    if (!this.selectedCourse) return;
    
    const learnerId = (this.quizCompletionService as any).getCurrentUserId(); // Access private method
    this.quizCompletionService.markCourseCompleted(learnerId, this.selectedCourse.courseId).subscribe({
      next: () => {
        console.log('🎉 Course marked as completed in backend');
        // Persist the completion status locally
        this.persistCourseCompletion();
      },
      error: (error) => console.error('❌ Failed to mark course as completed:', error)
    });
  }

  // Persist course completion status locally
  private persistCourseCompletion(): void {
    if (!this.selectedCourse) return;
    
    // Store completion status in sessionStorage for persistence
    const completedCourses = JSON.parse(sessionStorage.getItem('completedCourses') || '[]');
    const courseCompletion = {
      courseId: this.selectedCourse.courseId,
      completedAt: new Date().toISOString(),
      learnerId: (this.quizCompletionService as any).getCurrentUserId()
    };
    
    // Add if not already present
    if (!completedCourses.find((c: any) => c.courseId === this.selectedCourse!.courseId)) {
      completedCourses.push(courseCompletion);
      sessionStorage.setItem('completedCourses', JSON.stringify(completedCourses));
      console.log('💾 Course completion persisted locally');
    }
  }

  getStatusClass(status: string | undefined): string {
    const safeStatus = status || 'Not Started';
    switch (safeStatus) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-progress';
      case 'Not Started': return 'status-not-started';
      default: return 'status-default';
    }
  }

  getQuizStatusClass(status: string | undefined): string {
    const safeStatus = status || 'Not Attempted';
    switch (safeStatus) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-progress';
      case 'Not Started': return 'status-not-started';
      case 'Passed': return 'quiz-status-passed';
      case 'Failed': return 'quiz-status-failed';
      default: return 'quiz-status-not-attempted';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByMaterialId(index: number, material: any): any {
    return material.dataId || material.id || index;
  }

  trackByQuizId(index: number, quiz: Quiz): any {
    return quiz.quizId || index;
  }

  getMaterialIcon(typeOrPath: string): string {
    if (!typeOrPath || typeof typeOrPath !== 'string') {
      return 'fas fa-file';
    }
    
    const type = typeOrPath.toLowerCase();
    if (type.includes('video') || type.includes('.mp4') || type.includes('.avi')) {
      return 'fas fa-video';
    } else if (type.includes('document') || type.includes('.pdf') || type.includes('.doc')) {
      return 'fas fa-file-pdf';
    } else if (type.includes('image') || type.includes('.jpg') || type.includes('.png')) {
      return 'fas fa-image';
    } else if (type.includes('.ppt') || type.includes('presentation')) {
      return 'fas fa-file-powerpoint';
    } else if (type.includes('.xls') || type.includes('spreadsheet')) {
      return 'fas fa-file-excel';
    }
    return 'fas fa-file-alt';
  }

  getMaterialType(typeOrPath: string): string {
    if (!typeOrPath || typeof typeOrPath !== 'string') {
      return 'Document';
    }
    
    const type = typeOrPath.toLowerCase();
    if (type.includes('video')) return 'Video';
    if (type.includes('document') || type.includes('pdf')) return 'Document';
    if (type.includes('image')) return 'Image';
    if (type.includes('presentation')) return 'Presentation';
    if (type.includes('spreadsheet')) return 'Spreadsheet';
    
    // Extract from file extension
    if (type.includes('.pdf')) return 'PDF Document';
    if (type.includes('.mp4') || type.includes('.avi')) return 'Video';
    if (type.includes('.jpg') || type.includes('.png')) return 'Image';
    if (type.includes('.ppt')) return 'Presentation';
    if (type.includes('.xls')) return 'Spreadsheet';
    
    return 'Document';
  }

  getFullDownloadUrl(filePath: string): string {
    if (!filePath) return '#';
    
    // If it's already a full URL, return as is
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    // If it starts with /, it's a relative path from the server root
    if (filePath.startsWith('/')) {
      return `http://localhost:5255${filePath}`;
    }
    
    // Otherwise, assume it's a relative path and add the server URL
    return `http://localhost:5255/${filePath}`;
  }

  viewMaterial(material: any): void {
    if (!material.filePath) {
      alert('File path not available for this material.');
      return;
    }

    try {
      const url = this.getFullDownloadUrl(material.filePath);
      window.open(url, '_blank');
      console.log(`Viewing material: ${material.title}`);
    } catch (error) {
      console.error('View material error:', error);
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
      
      // Create a temporary anchor element to trigger download with proper filename
      const link = document.createElement('a');
      link.href = url;
      link.download = material.title || 'course-material';
      link.target = '_blank';
      
      // Add to document temporarily
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Download initiated for: ${material.title}`);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file. Please try again or contact support.');
    }
  }

  attemptQuiz(quiz: Quiz): void {
    if (this.isLearner()) {
      this.courseService.getQuizForAttempt(quiz.quizId).subscribe({
        next: (response) => {
          console.log('✅ Quiz for attempt:', response);
          // Backend returns { quiz: quizData, hasAttempted: boolean } or just quizData
          const quizData = response.quiz || response;
          
          if (response.hasAttempted !== undefined && response.hasAttempted) {
            // Show result modal instead of basic alert
            this.showQuizResultModal({
              success: false,
              message: "You have already passed this quiz. Check your results instead.",
              allowRetry: false,
              quizTitle: quiz.title
            });
          } else {
            // Open quiz modal with the quiz data
            this.openQuizModal(quizData);
          }
        },
        error: (error) => {
          console.error('❌ Error getting quiz for attempt:', error);
          
          // Show error modal instead of basic alert
          this.showQuizResultModal({
            success: false,
            message: 'Unable to load quiz. Please try again.',
            allowRetry: true,
            quizTitle: quiz.title
          });
        }
      });
    } else if (this.isInstructor()) {
      // Navigate to quiz management for instructors
      console.log('Managing quiz:', quiz);
      this.showQuizResultModal({
        success: false,
        message: "Instructor quiz management feature coming soon!",
        allowRetry: false,
        quizTitle: quiz.title
      });
    }
  }

  // New method to open quiz modal
  openQuizModal(quizData: any): void {
    console.log('🚀 Opening quiz modal - START');
    console.log('Quiz data received:', quizData);
    
    this.currentQuiz = quizData;
    this.quizQuestions = quizData.Questions || quizData.questions || [];
    this.userAnswers = {};
    this.showQuizModal = true;
    
    console.log('🚀 Modal state set:');
    console.log('- showQuizModal:', this.showQuizModal);
    console.log('- currentQuiz:', this.currentQuiz);
    console.log('- quizQuestions count:', this.quizQuestions.length);
    console.log('- quizQuestions:', this.quizQuestions);
    
    // Force change detection multiple times
    this.cdr.detectChanges();
    console.log('🚀 Change detection forced');
    
    // Try again after small delay
    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('🚀 Second change detection forced');
    }, 10);
    
    // Additional debugging - check DOM elements and template values
    setTimeout(() => {
      const overlay = document.querySelector('.quiz-modal-overlay');
      const modal = document.querySelector('.quiz-modal');
      const debugTemplateDiv = document.querySelector('div[style*="purple"]');
      
      console.log('🔍 DOM Check:');
      console.log('- Overlay exists:', !!overlay);
      console.log('- Overlay visible:', overlay ? getComputedStyle(overlay).display !== 'none' : false);
      console.log('- Modal exists:', !!modal);
      console.log('- Modal visible:', modal ? getComputedStyle(modal).display !== 'none' : false);
      console.log('- Debug template div exists:', !!debugTemplateDiv);
      if (debugTemplateDiv) {
        console.log('- Debug template content:', debugTemplateDiv.innerHTML);
      }
      
      // Force check the actual property values
      console.log('🔍 Property Check:');
      console.log('- this.showQuizModal:', this.showQuizModal);
      console.log('- typeof this.showQuizModal:', typeof this.showQuizModal);
      console.log('- !!this.showQuizModal:', !!this.showQuizModal);
      console.log('- this.showQuizModal === true:', this.showQuizModal === true);
      console.log('- this.showQuizModal === false:', this.showQuizModal === false);
    }, 100);
    
    // Start timer if quiz has time limit (you can add this feature later)
    console.log('Opening quiz modal with:', this.quizQuestions.length, 'questions');
    
    // EMERGENCY FALLBACK: Try multiple approaches
    if (!document.querySelector('.quiz-modal-overlay')) {
      console.log('⚠️ Modal not showing, trying fallback approaches...');
      
      // Approach 1: Manual DOM injection (for testing)
      setTimeout(() => {
        if (!document.querySelector('.quiz-modal-overlay')) {
          console.log('💉 Injecting modal manually for testing...');
          this.injectModalManually();
        }
      }, 200);
    }
  }
  
  // FUNCTIONAL QUIZ MODAL: Convert emergency modal to fully functional quiz
  private injectModalManually(): void {
    const overlay = document.createElement('div');
    overlay.className = 'emergency-modal-overlay';
    overlay.style.cssText = `
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100vw; 
      height: 100vh; 
      background: rgba(0,0,0,0.8); 
      z-index: 99999; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      padding: 20px;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white; 
      padding: 30px; 
      border-radius: 12px; 
      max-width: 800px; 
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    `;
    
    modal.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 20px -30px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; font-size: 1.8rem;">${this.currentQuiz?.title || 'Quiz'}</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Total Marks: ${this.currentQuiz?.totalMarks || 0} | Questions: ${this.quizQuestions?.length || 0}</p>
      </div>
      <div id="quiz-questions-container"></div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <div id="quiz-progress" style="margin-bottom: 15px; color: #666;"></div>
        <div style="display: flex; gap: 15px; justify-content: flex-end;">
          <button id="close-quiz-btn" style="padding: 12px 24px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">
            ❌ Cancel
          </button>
          <button id="submit-quiz-btn" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
            ✅ Submit Quiz
          </button>
        </div>
      </div>
    `;
    
    // Add functional questions with radio buttons
    this.addFunctionalQuestions(modal);
    
    // Add event listeners
    this.addQuizEventListeners(modal);
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Update progress initially
    this.updateQuizProgress();
    
    console.log('🚀 Functional quiz modal injected successfully');
  }
  
  // Add questions with radio button functionality
  private addFunctionalQuestions(modal: HTMLElement): void {
    const container = modal.querySelector('#quiz-questions-container');
    if (!container || !this.quizQuestions?.length) return;
    
    this.quizQuestions.forEach((question, index) => {
      const questionId = question.questionId || question.QuestionId || index + 1;
      const questionDiv = document.createElement('div');
      questionDiv.style.cssText = `
        margin: 20px 0; 
        padding: 25px; 
        border: 2px solid #f0f0f0; 
        border-radius: 8px;
        background: #fafafa;
      `;
      
      questionDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0; color: #333;">Question ${index + 1}</h3>
          <span style="background: #007bff; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">
            ${question.marks || question.Marks || 0} marks
          </span>
        </div>
        
        <div style="margin-bottom: 20px; font-size: 1.1rem; line-height: 1.5; color: #444;">
          ${question.questionText || question.QuestionText || 'No question text'}
        </div>
        
        <div class="options-container">
          ${this.generateOptionHTML(questionId, 'A', question.optionA || question.OptionA || 'Option A')}
          ${this.generateOptionHTML(questionId, 'B', question.optionB || question.OptionB || 'Option B')}
          ${this.generateOptionHTML(questionId, 'C', question.optionC || question.OptionC || 'Option C')}
          ${this.generateOptionHTML(questionId, 'D', question.optionD || question.OptionD || 'Option D')}
        </div>
      `;
      
      container.appendChild(questionDiv);
    });
  }
  
  // Generate radio button HTML for each option
  private generateOptionHTML(questionId: number, option: string, text: string): string {
    return `
      <div style="margin: 10px 0; padding: 15px; border: 2px solid #e9ecef; border-radius: 6px; cursor: pointer; transition: all 0.2s;" 
           class="quiz-option" 
           data-question-id="${questionId}" 
           data-option="${option}"
           onmouseover="this.style.borderColor='#007bff'; this.style.backgroundColor='#f8f9fa';"
           onmouseout="this.style.borderColor='#e9ecef'; this.style.backgroundColor='white';">
        
        <label style="display: flex; align-items: center; cursor: pointer; width: 100%;">
          <input type="radio" 
                 name="question_${questionId}" 
                 value="${option}" 
                 style="margin-right: 12px; transform: scale(1.2);">
          <span style="font-size: 1rem;"><strong>${option}.</strong> ${text}</span>
        </label>
      </div>
    `;
  }
  
  // Add event listeners for quiz functionality
  private addQuizEventListeners(modal: HTMLElement): void {
    // Close button
    const closeBtn = modal.querySelector('#close-quiz-btn');
    closeBtn?.addEventListener('click', () => {
      document.querySelector('.emergency-modal-overlay')?.remove();
    });
    
    // Submit button
    const submitBtn = modal.querySelector('#submit-quiz-btn');
    submitBtn?.addEventListener('click', () => {
      this.handleEmergencyQuizSubmit();
    });
    
    // Option selection
    const options = modal.querySelectorAll('.quiz-option');
    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const questionId = target.dataset['questionId'];
        const optionValue = target.dataset['option'];
        const radio = target.querySelector('input[type="radio"]') as HTMLInputElement;
        
        if (radio && questionId && optionValue) {
          radio.checked = true;
          this.handleOptionSelection(parseInt(questionId), optionValue, target);
          this.updateQuizProgress();
        }
      });
    });
    
    // Radio button changes
    const radios = modal.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const questionId = parseInt(target.name.split('_')[1]);
        const option = target.value;
        const optionDiv = target.closest('.quiz-option') as HTMLElement;
        
        this.handleOptionSelection(questionId, option, optionDiv);
        this.updateQuizProgress();
      });
    });
  }
  
  // Handle option selection visual feedback
  private handleOptionSelection(questionId: number, option: string, selectedDiv: HTMLElement): void {
    // Store answer
    this.userAnswers[questionId] = option;
    
    // Update visual state - remove selection from siblings
    const allOptionsForQuestion = document.querySelectorAll(`[data-question-id="${questionId}"]`);
    allOptionsForQuestion.forEach(opt => {
      const optDiv = opt as HTMLElement;
      optDiv.style.borderColor = '#e9ecef';
      optDiv.style.backgroundColor = 'white';
      optDiv.style.fontWeight = 'normal';
    });
    
    // Highlight selected option
    selectedDiv.style.borderColor = '#28a745';
    selectedDiv.style.backgroundColor = '#f8fff9';
    selectedDiv.style.fontWeight = 'bold';
    
    console.log(`Question ${questionId} answered: ${option}`);
  }
  
  // Update progress indicator
  private updateQuizProgress(): void {
    const progressDiv = document.querySelector('#quiz-progress');
    if (progressDiv) {
      const answeredCount = Object.keys(this.userAnswers).length;
      const totalQuestions = this.quizQuestions?.length || 0;
      progressDiv.innerHTML = `
        <strong>Progress:</strong> ${answeredCount} / ${totalQuestions} questions answered
        ${answeredCount === totalQuestions ? ' ✅ <span style="color: #28a745;">Ready to submit!</span>' : ''}
      `;
    }
  }
  
  // Handle quiz submission
  private handleEmergencyQuizSubmit(): void {
    const answeredCount = Object.keys(this.userAnswers).length;
    const totalQuestions = this.quizQuestions?.length || 0;
    
    // Check if all questions are answered
    if (answeredCount < totalQuestions) {
      const proceed = confirm(`You have answered ${answeredCount} out of ${totalQuestions} questions. Do you want to submit anyway?`);
      if (!proceed) return;
    }
    
    // Prepare submission data in the exact format backend expects
    const submitData = {
      quizId: this.currentQuiz?.quizId || this.currentQuiz?.QuizId || 0,
      courseId: this.selectedCourse?.courseId || this.currentQuiz?.courseId || this.currentQuiz?.CourseId || 0,
      answers: this.quizQuestions.map(q => {
        const questionId = q.questionId || q.QuestionId;
        return {
          questionId: questionId,
          response: this.userAnswers[questionId] || ''
        };
      })
    };
    
    console.log('🚀 Submitting quiz with data:', submitData);
    
    // Submit using the existing course service
    this.courseService.submitQuiz(submitData).subscribe({
      next: (result) => {
        console.log('✅ Quiz submitted successfully:', result);
        
        // Close quiz modal
        document.querySelector('.emergency-modal-overlay')?.remove();
        
        // Show beautiful result modal
        this.showQuizResultModal(result);
        
        // Refresh quiz list
        if (this.selectedCourse?.courseId) {
          this.loadCourseQuizzes(this.selectedCourse.courseId);
        }
      },
      error: (error) => {
        console.error('❌ Error submitting quiz:', error);
        this.showQuizResultModal({
          success: false,
          message: 'Failed to submit quiz. Please try again.',
          allowRetry: true
        });
      }
    });
  }

  // Close quiz modal
  closeQuizModal(): void {
    this.showQuizModal = false;
    this.currentQuiz = null;
    this.quizQuestions = [];
    this.userAnswers = {};
    
    if (this.quizTimer) {
      clearInterval(this.quizTimer);
      this.quizTimer = null;
    }
  }

  // Handle answer selection
  selectAnswer(questionId: number, answer: string): void {
    this.userAnswers[questionId] = answer;
    console.log('Answer selected:', questionId, answer);
  }

  // Submit quiz
  submitQuiz(): void {
    // Check if all questions are answered
    const unansweredQuestions = this.quizQuestions.filter(q => 
      !this.userAnswers[q.QuestionId || q.questionId]
    );
    
    if (unansweredQuestions.length > 0) {
      const proceed = confirm(`You have ${unansweredQuestions.length} unanswered questions. Do you want to submit anyway?`);
      if (!proceed) return;
    }
    
    // Prepare submission data with correct property names
    const submitData = {
      quizId: this.currentQuiz.QuizId || this.currentQuiz.quizId,
      courseId: this.selectedCourse?.courseId || this.currentQuiz.CourseId,
      answers: this.quizQuestions.map(q => ({
        questionId: q.QuestionId || q.questionId,
        response: this.userAnswers[q.QuestionId || q.questionId] || ''
      }))
    };
    
    console.log('🚀 Submitting quiz:', submitData);
    
    // Submit quiz using your existing service
    this.courseService.submitQuiz(submitData).subscribe({
      next: (result) => {
        console.log('✅ Quiz submitted successfully:', result);
        
        // Close quiz modal first
        this.closeQuizModal();
        
        // Show beautiful result modal with detailed results
        this.showQuizResultModal(result);
        
        // Refresh quiz list to update attempt status
        if (this.selectedCourse?.courseId) {
          this.loadCourseQuizzes(this.selectedCourse.courseId);
        }
      },
      error: (error) => {
        console.error('❌ Error submitting quiz:', error);
        
        // Show error modal instead of basic alert
        this.showQuizResultModal({
          success: false,
          message: 'Failed to submit quiz. Please try again.',
          allowRetry: true,
          quizTitle: this.currentQuiz?.title || 'Quiz'
        });
      }
    });
  }

  viewQuizResult(quiz: Quiz): void {
    if (this.isLearner()) {
      this.courseService.getLearnerQuizResult(quiz.quizId).subscribe({
        next: (result) => {
          console.log('Quiz result:', result);
          
          // Use our beautiful result modal
          this.showQuizResultModal({
            success: true,
            message: "Your quiz results:",
            score: result.Score || result.score,
            totalMarks: result.TotalMarks || result.totalMarks,
            percentage: result.Percentage || result.percentage,
            status: result.Status || result.status,
            isPassed: result.IsPassed || result.isPassed,
            quizTitle: result.QuizTitle || result.quizTitle || quiz.title,
            allowRetry: false,
            questionResults: [] // No detailed breakdown for viewing past results
          });
        },
        error: (error) => {
          if (error.status === 404) {
            console.log('ℹ️ Quiz not passed yet, showing retry option');
            // Quiz not passed yet - show helpful message
            this.showQuizResultModal({
              success: false,
              message: "No results available yet. You need to pass this quiz to see your results.",
              allowRetry: true,
              quizTitle: quiz.title
            });
          } else {
            console.error('❌ Unexpected error getting quiz result:', error);
            // Other error
            this.showQuizResultModal({
              success: false,
              message: "Unable to load quiz results. Please try again later.",
              allowRetry: false,
              quizTitle: quiz.title
            });
          }
        }
      });
    } else {
      // Handle instructor result viewing
      console.log('Viewing results for all students for quiz:', quiz);
      this.showQuizResultModal({
        success: false,
        message: "Instructor view: Student results feature coming soon!",
        allowRetry: false,
        quizTitle: quiz.title
      });
    }
  }

  // Debug methods
  testJwtInfo(): void {
    this.learnerService.testJwtInfo().subscribe({
      next: (info) => console.log('JWT Debug Info:', info),
      error: (error) => console.error('JWT Debug Error:', error)
    });
  }

  // NEW: Debug method to test quiz modal
  testQuizModal(): void {
    console.log('🧪 Testing quiz modal with sample data...');
    const sampleQuiz = {
      quizId: 999,
      title: 'Test Quiz',
      totalMarks: 30,
      questions: [
        {
          questionId: 1,
          questionText: 'What is Angular?',
          optionA: 'Framework',
          optionB: 'Library', 
          optionC: 'Language',
          optionD: 'Database',
          marks: 10
        },
        {
          questionId: 2,
          questionText: 'What is TypeScript?',
          optionA: 'JavaScript',
          optionB: 'Superset of JavaScript',
          optionC: 'Database',
          optionD: 'CSS Framework',
          marks: 10
        }
      ]
    };
    
    this.openQuizModal(sampleQuiz);
  }

  // NEW: Force show modal for debugging
  forceShowModal(): void {
    console.log('🚨 FORCE SHOWING MODAL');
    
    // First test simple modal
    this.debugModal = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.debugModal = false;
      
      // Now force quiz modal
      this.showQuizModal = true;
      this.currentQuiz = {
        quizId: 999,
        title: 'FORCE TEST QUIZ',
        totalMarks: 50
      };
      this.quizQuestions = [
        {
          questionId: 1,
          questionText: 'FORCE TEST QUESTION?',
          optionA: 'Option A',
          optionB: 'Option B',
          optionC: 'Option C',
          optionD: 'Option D',
          marks: 50
        }
      ];
      
      console.log('🚨 FORCED STATE:');
      console.log('- showQuizModal:', this.showQuizModal);
      console.log('- currentQuiz:', this.currentQuiz);
      console.log('- quizQuestions:', this.quizQuestions);
      
      this.cdr.detectChanges();
      
      // Check DOM after force
      setTimeout(() => {
        const overlay = document.querySelector('.quiz-modal-overlay');
        const modal = document.querySelector('.quiz-modal');
        console.log('🚨 FORCED DOM CHECK:');
        console.log('- Overlay exists:', !!overlay);
        console.log('- Modal exists:', !!modal);
        if (overlay) console.log('- Overlay styles:', getComputedStyle(overlay).display, getComputedStyle(overlay).visibility);
        if (modal) console.log('- Modal styles:', getComputedStyle(modal).display, getComputedStyle(modal).visibility);
      }, 100);
      
    }, 2000);
    }

  // Beautiful Quiz Result Modal
  private showQuizResultModal(result: any): void {
    // Create result modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'quiz-result-modal-overlay';
    overlay.style.cssText = `
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100vw; 
      height: 100vh; 
      background: rgba(0,0,0,0.8); 
      z-index: 99999; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease-out;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white; 
      padding: 0; 
      border-radius: 16px; 
      max-width: 600px; 
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 80px rgba(0,0,0,0.4);
      animation: slideUp 0.4s ease-out;
      position: relative;
    `;

    // Determine result type and colors
    const isPassed = result.isPassed;
    const allowRetry = result.allowRetry;
    const headerColor = isPassed ? '#28a745' : '#dc3545';
    const headerIcon = isPassed ? '🎉' : '💪';
    const headerText = isPassed ? 'Congratulations!' : 'Keep Trying!';

    modal.innerHTML = `
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .result-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .stat-value { font-size: 1.5rem; font-weight: bold; color: #333; }
        .stat-label { font-size: 0.85rem; color: #666; margin-top: 5px; }
        .question-result { margin: 10px 0; padding: 12px; border-radius: 6px; font-size: 0.9rem; }
        .correct { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
        .incorrect { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
      </style>
      
      <div style="background: ${headerColor}; color: white; padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
        <div style="font-size: 3rem; margin-bottom: 10px;">${headerIcon}</div>
        <h2 style="margin: 0; font-size: 1.8rem;">${headerText}</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 1.1rem;">${result.message || 'Quiz completed!'}</p>
      </div>

      <div style="padding: 30px;">
        ${result.success ? `
          <div class="result-stats">
            <div class="stat-item">
              <div class="stat-value">${result.score || 0}</div>
              <div class="stat-label">Score</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${result.totalMarks || 0}</div>
              <div class="stat-label">Total Marks</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: ${isPassed ? '#28a745' : '#dc3545'};">${result.percentage || 0}%</div>
              <div class="stat-label">Percentage</div>
            </div>
            <div class="stat-item">
              <div class="stat-value" style="color: ${isPassed ? '#28a745' : '#dc3545'};">${result.status || 'Unknown'}</div>
              <div class="stat-label">Result</div>
            </div>
          </div>

          ${result.questionResults && result.questionResults.length > 0 ? `
            <div style="margin-top: 25px;">
              <h4 style="margin-bottom: 15px; color: #333;">Question Breakdown:</h4>
              ${result.questionResults.map((q: any, index: number) => `
                <div class="question-result ${q.isCorrect ? 'correct' : 'incorrect'}">
                  <strong>Question ${index + 1}:</strong> 
                  Your answer: <strong>${q.userAnswer}</strong> 
                  ${q.isCorrect ? '✅' : '❌'}
                  <span style="float: right;">${q.marks}/${q.totalMarks} marks</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${!isPassed ? `
            <div style="margin-top: 25px; padding: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
              <h5 style="margin: 0 0 10px 0; color: #856404;">💡 Don't Give Up!</h5>
              <p style="margin: 0; color: #856404;">
                You need ${result.passingPercentage || 70}% to pass. You can retake this quiz to improve your score!
              </p>
            </div>
          ` : `
            <div style="margin-top: 25px; padding: 20px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px;">
              <h5 style="margin: 0 0 10px 0; color: #155724;">🌟 Excellent Work!</h5>
              <p style="margin: 0; color: #155724;">
                You've successfully passed this quiz with ${result.percentage}%! Your progress has been saved.
              </p>
            </div>
          `}
        ` : `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 3rem; color: #dc3545; margin-bottom: 15px;">⚠️</div>
            <p style="color: #666; font-size: 1.1rem;">${result.message}</p>
          </div>
        `}

        <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: center;">
          ${allowRetry ? `
            <button id="retry-quiz-btn" style="
              padding: 12px 24px; 
              background: #007bff; 
              color: white; 
              border: none; 
              border-radius: 6px; 
              cursor: pointer; 
              font-weight: bold;
              font-size: 1rem;
            ">
              🔄 Try Again
            </button>
          ` : ''}
          
          <button id="close-result-btn" style="
            padding: 12px 24px; 
            background: #6c757d; 
            color: white; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer;
            font-weight: bold;
            font-size: 1rem;
          ">
            ✅ Close
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = modal.querySelector('#close-result-btn');
    const retryBtn = modal.querySelector('#retry-quiz-btn');

    closeBtn?.addEventListener('click', () => {
      overlay.remove();
    });

    retryBtn?.addEventListener('click', () => {
      overlay.remove();
      // Trigger quiz attempt again
      const currentQuizData = this.currentQuiz;
      if (currentQuizData) {
        this.openQuizModal(currentQuizData);
      }
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    console.log('🎨 Quiz result modal displayed:', result);
  }
  
  testEnrollment(): void {
    if (this.selectedCourse) {
      this.learnerService.testEnrollment(this.selectedCourse.courseId).subscribe({
        next: (result) => console.log('Enrollment Debug:', result),
        error: (error) => console.error('Enrollment Debug Error:', error)
      });
    }
  }

  // Utility methods for user role checking
  isLearner(): boolean {
    return this.courseService.isLearner();
  }

  isInstructor(): boolean {
    return this.courseService.isInstructor();
  }

  canManageCourses(): boolean {
    return this.courseService.canManageCourses();
  }

  // Additional quiz management methods
  editQuiz(quiz: Quiz): void {
    console.log('Editing quiz:', quiz.title);
    // TODO: Navigate to quiz editing component
    alert(`Edit quiz "${quiz.title}" functionality would be implemented here.`);
  }

  viewQuizDetails(quiz: Quiz): void {
    console.log('Viewing quiz details:', quiz.title);
    // TODO: Show quiz details modal or navigate to quiz details page
    alert(`Quiz details for "${quiz.title}" would be displayed here.`);
  }
} 