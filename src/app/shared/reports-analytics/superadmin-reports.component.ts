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
  template: `
    <div class="reports-container">
      <div class="reports-header">
        <h2><i class="fas fa-chart-bar"></i> SuperAdmin Reports</h2>
        <p>System-wide analytics and comprehensive statistics</p>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading reports...</p>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMessage }}
      </div>

      <div *ngIf="reports && !isLoading" class="reports-content">
        <!-- System Overview Cards -->
        <div class="stats-grid">
          <div class="stat-card students">
            <div class="stat-icon">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="stat-content">
              <h3>{{ reports.totalStudents }}</h3>
              <p>Total Students</p>
            </div>
          </div>

          <div class="stat-card courses">
            <div class="stat-icon">
              <i class="fas fa-book"></i>
            </div>
            <div class="stat-content">
              <h3>{{ reports.totalCourses }}</h3>
              <p>Total Courses</p>
            </div>
          </div>

          <div class="stat-card instructors">
            <div class="stat-icon">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="stat-content">
              <h3>{{ reports.totalInstructors }}</h3>
              <p>Total Instructors</p>
            </div>
          </div>

          <div class="stat-card admins">
            <div class="stat-icon">
              <i class="fas fa-users-cog"></i>
            </div>
            <div class="stat-content">
              <h3>{{ reports.totalAdmins }}</h3>
              <p>Total Admins</p>
            </div>
          </div>

          <div class="stat-card completed">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <h3>{{ getCompletedStudentsCount() }}</h3>
              <p>Students Completed</p>
              <small>Based on course completion logs</small>
            </div>
          </div>
        </div>

        <!-- Filter Section -->
        <div class="filter-section">
          <div class="filter-group">
            <label for="courseFilter">Filter by Course:</label>
            <select id="courseFilter" [(ngModel)]="selectedCourseId" (ngModelChange)="onCourseFilterChange()">
              <option value="">All Courses</option>
              <option *ngFor="let course of reports.courseEnrollmentStats" [value]="course.courseId">
                {{ course.courseTitle }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="completionFilter">Completion Status:</label>
            <select id="completionFilter" [(ngModel)]="completionFilter" (ngModelChange)="applyFilters()">
              <option value="all">All</option>
              <option value="high">High Completion (>80%)</option>
              <option value="medium">Medium Completion (50-80%)</option>
              <option value="low">Low Completion (<50%)</option>
            </select>
          </div>
        </div>

        <!-- Course Completion Statistics -->
        <div class="section-card">
          <h3><i class="fas fa-trophy"></i> Course Completion Statistics</h3>
          <div class="table-container">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Total Enrollments</th>
                  <th>Completed Students</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let course of filteredCompletionStats">
                  <td>
                    <div class="course-info">
                      <strong>{{ course.courseTitle }}</strong>
                      <small>ID: {{ course.courseId }}</small>
                    </div>
                  </td>
                  <td>
                    <span class="enrollment-badge">{{ getEnrollmentsForCourse(course.courseId) }}</span>
                  </td>
                  <td>
                    <span class="completion-badge">{{ getCompletedStudentsForCourse(course.courseId) }}</span>
                  </td>
                  <td>
                    <div class="progress-container">
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="getCompletionRateForCourse(course.courseId)"></div>
                      </div>
                      <span class="percentage">{{ getCompletionRateForCourse(course.courseId) | number:'1.1-1' }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Instructor Statistics -->
        <div class="section-card">
          <h3><i class="fas fa-chalkboard-teacher"></i> Instructor Statistics</h3>
          <div class="table-container">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Instructor Name</th>
                  <th>Email</th>
                  <th>Assigned Courses</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let instructor of instructorStats">
                  <td>
                    <div class="instructor-info">
                      <strong>{{ instructor.instructorName }}</strong>
                      <small>ID: {{ instructor.instructorId }}</small>
                    </div>
                  </td>
                  <td>{{ instructor.instructorEmail }}</td>
                  <td>
                    <span class="course-count-badge">{{ instructor.assignedCourses }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Course Details -->
        <div class="section-card">
          <h3><i class="fas fa-book-open"></i> Course Details</h3>
          <div class="table-container">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Instructor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let course of courseDetails">
                  <td>
                    <div class="course-info">
                      <strong>{{ course.title }}</strong>
                      <small>ID: {{ course.courseId }}</small>
                    </div>
                  </td>
                  <td>{{ course.instructorName }}</td>
                  <td>
                    <button class="view-btn" (click)="viewCourseDetails(course.courseId)">
                      <i class="fas fa-eye"></i> View Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Course Details Modal -->
      <div class="modal-overlay" *ngIf="showCourseModal" (click)="closeCourseModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><i class="fas fa-info-circle"></i> Course Details: {{ selectedCourseForModal?.title }}</h2>
            <button class="close-btn" (click)="closeCourseModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedCourseForModal && courseModalData">
            
            <!-- Course Information -->
            <div class="course-info-section">
              <h3><i class="fas fa-book"></i> Course Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <strong>Description:</strong>
                  <p>{{ selectedCourseForModal.description || 'No description available' }}</p>
                </div>
                <div class="info-item" *ngIf="selectedCourseForModal.prerequisites">
                  <strong>Prerequisites:</strong>
                  <p>{{ selectedCourseForModal.prerequisites }}</p>
                </div>
                <div class="info-item" *ngIf="selectedCourseForModal.syllabus">
                  <strong>Syllabus:</strong>
                  <p>{{ selectedCourseForModal.syllabus }}</p>
                </div>
                <div class="info-item">
                  <strong>Created:</strong>
                  <p>{{ selectedCourseForModal.createdAt | date:'medium' }}</p>
                </div>
              </div>
            </div>

            <!-- Course Materials -->
            <div class="materials-section" *ngIf="courseModalData.materials?.length > 0">
              <h3><i class="fas fa-folder"></i> Course Materials ({{ courseModalData.materials.length }})</h3>
              <div class="materials-list">
                <div class="material-item" *ngFor="let material of courseModalData.materials; let i = index">
                  <div class="material-number">{{ i + 1 }}</div>
                  <div class="material-icon">
                    <i class="fas fa-file-alt"></i>
                  </div>
                  <div class="material-info">
                    <h4>{{ material.title }}</h4>
                    <p>Type: {{ material.type || 'Document' }}</p>
                    <small>Uploaded: {{ material.uploadedAt | date:'short' }}</small>
                  </div>
                  <div class="material-actions">
                    <button class="view-material-btn" (click)="viewMaterial(material)">
                      <i class="fas fa-eye"></i> View
                    </button>
                    <button class="download-material-btn" (click)="downloadMaterial(material)">
                      <i class="fas fa-download"></i> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Course Quizzes -->
            <div class="quizzes-section" *ngIf="courseModalData.quizzes?.length > 0">
              <h3><i class="fas fa-clipboard-question"></i> Quizzes ({{ courseModalData.quizzes.length }})</h3>
              <div class="quizzes-list">
                <div class="quiz-item" *ngFor="let quiz of courseModalData.quizzes; let i = index">
                  <div class="quiz-number">{{ i + 1 }}</div>
                  <div class="quiz-icon">
                    <i class="fas fa-clipboard-question"></i>
                  </div>
                  <div class="quiz-info">
                    <h4>{{ quiz.title }}</h4>
                    <div class="quiz-meta">
                      <span class="marks">
                        <i class="fas fa-star"></i>
                        {{ quiz.totalMarks }} marks
                      </span>
                      <span class="questions">
                        <i class="fas fa-list"></i>
                        {{ quiz.questionCount || 0 }} questions
                      </span>
                      <span class="date">
                        <i class="fas fa-calendar"></i>
                        {{ quiz.createdAt | date:'short' }}
                      </span>
                    </div>
                  </div>
                  <div class="quiz-actions">
                    <button class="view-quiz-btn" (click)="viewQuiz(quiz)">
                      <i class="fas fa-eye"></i> View Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty States -->
            <div class="empty-state" *ngIf="courseModalData.materials?.length === 0 && courseModalData.quizzes?.length === 0">
              <i class="fas fa-box-open"></i>
              <h3>No Content Available</h3>
              <p>This course doesn't have any materials or quizzes yet.</p>
            </div>

          </div>
        </div>
      </div>

      <!-- Quiz View Modal -->
      <div class="modal-overlay" *ngIf="showQuizViewModal" (click)="closeQuizViewModal()">
        <div class="modal-content large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2><i class="fas fa-clipboard-question"></i> Quiz Details: {{ selectedQuizForView?.title }}</h2>
            <button class="close-btn" (click)="closeQuizViewModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <!-- Loading State -->
            <div *ngIf="quizLoading" class="loading-container">
              <div class="spinner"></div>
              <p>Loading quiz details...</p>
            </div>

            <!-- Quiz Content -->
            <div *ngIf="!quizLoading && selectedQuizForView" class="quiz-view-container">
              <!-- Quiz Info -->
              <div class="quiz-info-section">
                <h3><i class="fas fa-info-circle"></i> Quiz Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <strong>Total Questions:</strong>
                    <p>{{ selectedQuizQuestions.length }}</p>
                  </div>
                  <div class="info-item">
                    <strong>Total Marks:</strong>
                    <p>{{ selectedQuizForView.totalMarks }}</p>
                  </div>
                  <div class="info-item">
                    <strong>Created:</strong>
                    <p>{{ selectedQuizForView.createdAt | date:'medium' }}</p>
                  </div>
                </div>
              </div>

              <!-- Questions List -->
              <div class="quiz-questions-section" *ngIf="selectedQuizQuestions.length > 0">
                <h3><i class="fas fa-list"></i> Questions</h3>
                <div class="questions-list">
                  <div class="question-item" *ngFor="let question of selectedQuizQuestions; let i = index">
                    <div class="question-header">
                      <span class="question-number">{{ i + 1 }}.</span>
                      <span class="marks-badge">[{{ question.marks }} marks]</span>
                    </div>
                    <div class="question-text">{{ question.questionText }}</div>
                    <div class="options-list">
                      <div class="option-item" [class.correct]="question.correctOption === 'A'">
                        <span class="option-label">A)</span> 
                        <span class="option-text">{{ question.optionA }}</span>
                        <i *ngIf="question.correctOption === 'A'" class="fas fa-check-circle correct-icon"></i>
                      </div>
                      <div class="option-item" [class.correct]="question.correctOption === 'B'">
                        <span class="option-label">B)</span> 
                        <span class="option-text">{{ question.optionB }}</span>
                        <i *ngIf="question.correctOption === 'B'" class="fas fa-check-circle correct-icon"></i>
                      </div>
                      <div class="option-item" [class.correct]="question.correctOption === 'C'">
                        <span class="option-label">C)</span> 
                        <span class="option-text">{{ question.optionC }}</span>
                        <i *ngIf="question.correctOption === 'C'" class="fas fa-check-circle correct-icon"></i>
                      </div>
                      <div class="option-item" [class.correct]="question.correctOption === 'D'">
                        <span class="option-label">D)</span> 
                        <span class="option-text">{{ question.optionD }}</span>
                        <i *ngIf="question.correctOption === 'D'" class="fas fa-check-circle correct-icon"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div class="empty-state" *ngIf="selectedQuizQuestions.length === 0 && !quizLoading">
                <i class="fas fa-box-open"></i>
                <h3>No Questions Available</h3>
                <p>This quiz doesn't have any questions yet.</p>
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

    .stat-card.students { border-left: 4px solid #3498db; }
    .stat-card.courses { border-left: 4px solid #2ecc71; }
    .stat-card.instructors { border-left: 4px solid #f39c12; }
    .stat-card.admins { border-left: 4px solid #9b59b6; }
    .stat-card.completed { border-left: 4px solid #27ae60; }

    .stat-icon {
      font-size: 2.5rem;
      margin-right: 20px;
      width: 60px;
      text-align: center;
    }

    .stat-card.students .stat-icon { color: #3498db; }
    .stat-card.courses .stat-icon { color: #2ecc71; }
    .stat-card.instructors .stat-icon { color: #f39c12; }
    .stat-card.admins .stat-icon { color: #9b59b6; }
    .stat-card.completed .stat-icon { color: #27ae60; }

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

    .stat-content small {
      display: block;
      margin-top: 3px;
      color: #95a5a6;
      font-size: 11px;
      font-style: italic;
    }

    .filter-section {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      min-width: 200px;
    }

    .filter-group label {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 5px;
    }

    .filter-group select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
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

    .table-container {
      overflow-x: auto;
    }

    .reports-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .reports-table th,
    .reports-table td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #ecf0f1;
    }

    .reports-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
    }

    .course-info strong {
      display: block;
      color: #2c3e50;
    }

    .course-info small {
      color: #7f8c8d;
    }

    .enrollment-badge {
      background: #3498db;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      font-weight: 500;
      font-size: 12px;
    }

    .completion-badge {
      background: #27ae60;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      font-weight: 500;
      font-size: 12px;
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
    }

    .course-count-badge {
      background: #3b82f6;
      color: white;
      padding: 4px 12px;
      border-radius: 15px;
      font-weight: 500;
      font-size: 12px;
    }

    .instructor-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .view-btn {
      background: #059669;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background 0.2s;
    }

    .view-btn:hover {
      background: #047857;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 800px;
      max-height: 90vh;
      width: 90%;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      background: #3498db;
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .modal-body {
      padding: 20px;
      max-height: calc(90vh - 80px);
      overflow-y: auto;
    }

    .course-info-section {
      margin-bottom: 30px;
    }

    .course-info-section h3 {
      color: #2c3e50;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ecf0f1;
    }

    .info-grid {
      display: grid;
      gap: 15px;
    }

    .info-item {
      padding: 10px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .info-item strong {
      color: #2c3e50;
      display: block;
      margin-bottom: 5px;
    }

    .info-item p {
      margin: 0;
      color: #5a6c7d;
      line-height: 1.5;
    }

    .materials-section, .quizzes-section {
      margin-bottom: 30px;
    }

    .materials-section h3, .quizzes-section h3 {
      color: #2c3e50;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ecf0f1;
    }

    .materials-list, .quizzes-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .material-item, .quiz-item {
      display: flex;
      align-items: center;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #3498db;
    }

    .material-number, .quiz-number {
      background: #3498db;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      margin-right: 15px;
    }

    .material-icon, .quiz-icon {
      font-size: 1.5rem;
      color: #3498db;
      margin-right: 15px;
    }

    .material-info, .quiz-info {
      flex: 1;
    }

    .material-info h4, .quiz-info h4 {
      margin: 0 0 5px 0;
      color: #2c3e50;
    }

    .material-info p, .quiz-info .quiz-meta {
      margin: 0;
      color: #5a6c7d;
      font-size: 14px;
    }

    .quiz-meta {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .quiz-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .material-actions, .quiz-actions {
      display: flex;
      gap: 8px;
    }

    .view-material-btn, .download-material-btn, .view-quiz-btn {
      background: #27ae60;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: background 0.2s;
    }

    .download-material-btn {
      background: #3498db;
    }

    .view-material-btn:hover {
      background: #219a52;
    }

    .download-material-btn:hover {
      background: #2980b9;
    }

    .view-quiz-btn:hover {
      background: #219a52;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: 15px;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #5a6c7d;
    }

    /* Quiz View Modal Styles */
    .large-modal {
      max-width: 900px;
      width: 95%;
    }

    .quiz-view-container {
      padding: 0;
    }

    .quiz-info-section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #3498db;
    }

    .quiz-info-section h3 {
      color: #2c3e50;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ecf0f1;
    }

    .quiz-info-section .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .quiz-info-section .info-item {
      padding: 10px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e3e6f0;
    }

    .quiz-info-section .info-item strong {
      color: #2c3e50;
      display: block;
      margin-bottom: 5px;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .quiz-info-section .info-item p {
      margin: 0;
      color: #5a6c7d;
      font-size: 16px;
      font-weight: 500;
    }

    .quiz-questions-section {
      margin-bottom: 20px;
    }

    .quiz-questions-section h3 {
      color: #2c3e50;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #ecf0f1;
    }

    .questions-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .question-item {
      background: white;
      border: 1px solid #e3e6f0;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ecf0f1;
    }

    .question-number {
      color: #2c3e50;
      font-size: 16px;
      font-weight: 700;
    }

    .question-text {
      margin-bottom: 15px;
      color: #2c3e50;
      font-size: 16px;
      font-weight: 500;
      line-height: 1.5;
    }

    .marks-badge {
      background: #28a745;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .option-item {
      display: flex;
      align-items: center;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e3e6f0;
      background: #fafafa;
      transition: all 0.2s ease;
      position: relative;
    }

    .option-item.correct {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      border-color: #28a745;
      color: #155724;
      font-weight: 500;
    }

    .option-label {
      color: #6c757d;
      font-weight: 600;
      margin-right: 8px;
      min-width: 20px;
    }

    .option-item.correct .option-label {
      color: #155724;
    }

    .option-text {
      flex: 1;
      color: #495057;
    }

    .option-item.correct .option-text {
      color: #155724;
    }

    .correct-icon {
      color: #28a745;
      margin-left: 10px;
      font-size: 16px;
    }
      `]
  })
export class SuperAdminReportsComponent implements OnInit {
  reports: SuperAdminReports | null = null;
  isLoading = false;
  errorMessage = '';
  selectedCourseId = '';
  completionFilter = 'all';
  courseEnrollmentCounts: { [courseId: number]: number } = {}; // Store real enrollment counts
  instructorStats: InstructorStats[] = [];
  courseDetails: CourseDetail[] = [];
  
  filteredCompletionStats: CourseCompletionStats[] = [];
  
  // Course details modal
  showCourseModal = false;
  selectedCourseForModal: any = null;
  courseModalData: any = null;
  filteredEnrollmentStats: CourseEnrollmentStats[] = [];

  // Quiz view modal
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

    // Use existing APIs to get data (same as Admin but with additional admin data)
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
        console.log('📊 SuperAdmin data loaded:', data);
        this.calculateSuperAdminReports(data);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load reports. Please try again.';
        this.isLoading = false;
        console.error('Error loading SuperAdmin reports:', error);
      }
    });
  }

  private calculateSuperAdminReports(data: any): void {
    // Calculate REAL enrollment counts from actual enrollment data (same as Admin)
    this.calculateRealEnrollmentCounts(data.students, data.courses, data.enrollments);
    
    // Calculate instructor statistics with REAL assignment data (same as Admin)
    console.log('🔍 SuperAdmin: Processing instructor data:', data.instructors);
    this.calculateInstructorStatistics(data.instructors);

    // Calculate course details with REAL instructor assignments (same as Admin)
    this.calculateCourseDetails(data.courses);

    // Calculate course completion stats (using REAL enrollment data)
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
    
    console.log('📊 SuperAdmin reports calculated:', this.reports);
  }

  // Calculate course details with real instructor assignments (same as Admin)
  private calculateCourseDetails(courses: any[]): void {
    console.log('📚 SuperAdmin: Calculating course details...');
    
    // Get instructor assignments to map real instructor names to courses
    this.enrollmentService.getAllCourseAssignments('Instructor').subscribe({
      next: (instructorAssignments) => {
        console.log('📋 SuperAdmin: Instructor assignments for courses:', instructorAssignments);
        
        this.courseDetails = courses.map(course => {
          // Find the instructor assigned to this course
          const assignment = instructorAssignments.find(assign => 
            assign.courseTitle === course.title
          );
          
          // Get instructor name from assignment, or use default
          let instructorName = 'No Instructor Assigned';
          if (assignment) {
            // Try to find the instructor's full name from our instructor list
            const instructor = this.instructorStats.find(inst => 
              inst.instructorEmail === assignment.userEmail
            );
            instructorName = instructor ? instructor.instructorName : assignment.userEmail;
          }
          
          console.log(`📚 SuperAdmin: Course "${course.title}" → Instructor: ${instructorName}`);
          
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
        
        console.log('✅ SuperAdmin: Course details calculated with REAL instructor assignments:', this.courseDetails);
      },
      error: (error) => {
        console.warn('⚠️ SuperAdmin: Failed to get instructor assignments for courses, using default:', error);
        
        // Fallback: use generic instructor names
        this.courseDetails = courses.map(course => ({
          courseId: course.courseId || 0,
          title: course.title,
          description: course.description,
          prerequisites: course.prerequisites,
          syllabus: course.syllabus,
          createdAt: course.createdAt,
          instructorName: course.instructorName || 'Instructor'
        }));
        
        console.log('✅ SuperAdmin: Course details calculated with FALLBACK data:', this.courseDetails);
      }
    });
  }

  // Calculate REAL enrollment counts from actual enrollment data (same as Admin)
  private calculateRealEnrollmentCounts(students: any[], courses: any[], enrollments: any[]): void {
    console.log('📊 SuperAdmin: Calculating REAL enrollment counts from actual enrollment data...');
    console.log('🔍 Students:', students.length);
    console.log('🔍 Courses:', courses.length); 
    console.log('🔍 Enrollments:', enrollments.length);
    
    // Initialize counts to 0
    courses.forEach(course => {
      this.courseEnrollmentCounts[course.courseId] = 0;
    });
    
    // Count actual enrollments per course from enrollment data
    enrollments.forEach(enrollment => {
      // Find the course by title (enrollment has courseTitle, we need courseId)
      const course = courses.find(c => c.title === enrollment.courseTitle);
      if (course) {
        // Check if the enrolled user is actually a learner (role = 1)
        const learner = students.find(s => s.email === enrollment.userEmail && s.role === 1);
        if (learner) {
          this.courseEnrollmentCounts[course.courseId]++;
          console.log(`✅ SuperAdmin: Learner ${enrollment.userEmail} enrolled in Course ${course.courseId} (${course.title})`);
        } else {
          console.log(`⚠️ SuperAdmin: Enrollment found but user ${enrollment.userEmail} is not a learner`);
        }
      } else {
        console.log(`⚠️ SuperAdmin: Course not found for enrollment: ${enrollment.courseTitle}`);
      }
    });
    
    console.log('✅ SuperAdmin: REAL enrollment counts calculated:', this.courseEnrollmentCounts);
  }

  // Calculate instructor statistics with REAL assignment data (same as Admin)
  private calculateInstructorStatistics(instructors: any[]): void {
    console.log('📊 SuperAdmin: Calculating instructor statistics with REAL assignment data...');
    
    // Get instructor assignments to count real assignments per instructor
    this.enrollmentService.getAllCourseAssignments('Instructor').subscribe({
      next: (instructorAssignments) => {
        console.log('📋 SuperAdmin: Instructor assignments data:', instructorAssignments);
        
        this.instructorStats = instructors.map((instructor: any) => {
          // Count actual assignments for this instructor
          const assignedCourses = instructorAssignments.filter(assign => 
            assign.userEmail === instructor.email
          ).length;
          
          console.log(`📚 SuperAdmin: Instructor ${instructor.name} (${instructor.email}) has ${assignedCourses} assigned courses`);
          
          const instructorStat = {
            instructorId: instructor.id,
            instructorName: instructor.name || 'Unknown Instructor',
            instructorEmail: instructor.email,
            assignedCourses: assignedCourses
          };
          console.log('📊 SuperAdmin: Instructor stat created:', instructorStat);
          return instructorStat;
        });
        
        console.log('✅ SuperAdmin: Final instructor stats:', this.instructorStats);
      },
      error: (error) => {
        console.warn('⚠️ SuperAdmin: Failed to get instructor assignments, using fallback calculation:', error);
        
        // Fallback to basic calculation
        this.instructorStats = instructors.map((instructor: any) => ({
          instructorId: instructor.id,
          instructorName: instructor.name || 'Unknown Instructor',
          instructorEmail: instructor.email,
          assignedCourses: 0 // Default to 0 if we can't get real data
        }));
        
        console.log('✅ SuperAdmin: Fallback instructor stats:', this.instructorStats);
      }
    });
  }

  // Get enrollment count for a specific course (using REAL enrollment data - same as Admin)
  getEnrollmentsForCourse(courseId: number): number {
    const count = this.courseEnrollmentCounts[courseId];
    if (count !== undefined) {
      return count;
    }
    console.warn(`⚠️ SuperAdmin: Enrollment data not calculated yet for course ${courseId}, returning 0`);
    return 0;
  }

  // Get actual completed students count for a specific course (same as Admin)
  getCompletedStudentsForCourse(courseId: number): number {
    const completions = this.getPersistedCompletions();
    const completedForThisCourse = completions.filter(c => c.courseId === courseId);
    return completedForThisCourse.length;
  }

  // Get persisted completion data from localStorage (same as Admin)
  private getPersistedCompletions(): any[] {
    try {
      const completionsData = localStorage.getItem('completedCourses'); // Same key as Admin
      if (!completionsData) {
        return [];
      }
      
      const completions = JSON.parse(completionsData);
      
      // Validate completion data structure
      const validCompletions = completions.filter((completion: any) => {
        return completion && 
               typeof completion.learnerId === 'number' && 
               typeof completion.courseId === 'number' && 
               completion.completedAt;
      });
      
      return validCompletions;
    } catch (error) {
      console.error('❌ SuperAdmin: Error reading persisted completions:', error);
      return [];
    }
  }

  getCompletionRateForCourse(courseId: number): number {
    const totalEnrollments = this.getEnrollmentsForCourse(courseId);
    const completedStudents = this.getCompletedStudentsForCourse(courseId);
    return totalEnrollments > 0 ? Math.round((completedStudents / totalEnrollments) * 100 * 100) / 100 : 0;
  }

  // Get total completed students count (same as Admin)
  getCompletedStudentsCount(): number {
    const completedCourses = this.getPersistedCompletions();
    // Get unique learner IDs who have completed at least one course
    const uniqueLearners = new Set(completedCourses.map(c => c.learnerId));
    return uniqueLearners.size;
  }

  // Filter and utility methods
  onCourseFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    if (!this.reports) return;

    let filtered = [...this.reports.courseCompletionStats];
    
    // Course filter
    if (this.selectedCourseId) {
      filtered = filtered.filter(course => course.courseId.toString() === this.selectedCourseId);
    }

    // Completion filter
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

  // Course details modal methods
  viewCourseDetails(courseId: number): void {
    console.log('🔍 SuperAdmin viewing course details for ID:', courseId);
    
    const course = this.courseDetails.find(c => c.courseId === courseId);
    if (!course) {
      console.error('Course not found');
      return;
    }

    this.selectedCourseForModal = course;
    this.isLoading = true;
    this.loadCourseModalData(courseId);
  }

  // Load course materials and quizzes for modal
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
        
        console.log('📋 SuperAdmin course modal data loaded:', this.courseModalData);
        this.showCourseModal = true;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Failed to load course modal data:', error);
        // Show modal with basic info even if materials/quizzes fail
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

  // Material management methods
  viewMaterial(material: any): void {
    console.log('📄 SuperAdmin viewing material:', material);
    
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
    console.log('📥 SuperAdmin downloading material:', material);
    
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

  // Quiz viewing methods
  viewQuiz(quiz: any): void {
    console.log('📝 SuperAdmin viewing quiz:', quiz);
    
    if (!quiz.quizId) {
      alert('Quiz ID not available.');
      return;
    }

    // Set up modal and loading state
    this.selectedQuizForView = quiz;
    this.selectedQuizQuestions = [];
    this.showQuizViewModal = true;
    this.quizLoading = true;

    // Load complete quiz data with questions for viewing
    this.courseService.getQuizForEditing(quiz.quizId).subscribe({
      next: (quizData: any) => {
        console.log('Quiz data loaded for viewing:', quizData);
        this.selectedQuizQuestions = quizData.questions || [];
        this.quizLoading = false;
      },
      error: (error) => {
        console.error('Error loading quiz for viewing:', error);
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
} 