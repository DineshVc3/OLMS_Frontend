import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService, Course, Quiz, LearnerCourseContent } from '../../services/course.service';

export interface QuizAttempt {
  questionId: number;
  response: string;
}

export interface QuizSubmission {
  courseId: number;
  quizId: number;
  answers: QuizAttempt[];
}

@Component({
  selector: 'app-learner-course-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './learner-course-access.component.html',
  styleUrls: ['./learner-course-access.component.css']
})
export class LearnerCourseAccessComponent implements OnInit {
  // Navigation
  activeTab: string = 'my-courses'; // 'my-courses', 'browse-courses', 'course-content', 'take-quiz', 'my-progress'
  selectedCourse: Course | null = null;
  selectedQuiz: Quiz | null = null;
  
  // Data
  myCourses: Course[] = [];
  allCourses: Course[] = [];
  courseContent: LearnerCourseContent | null = null;
  myProgress: any[] = [];
  
  // Quiz taking
  currentQuizQuestions: any[] = [];
  quizAnswers: { [questionId: number]: string } = {};
  quizTimeRemaining: number = 0;
  quizTimer: any = null;
  isQuizSubmitted = false;
  showQuizResults = false;
  quizScore = 0;
  totalMarks = 0;
  
  // Loading states
  isLoading = false;
  isSubmitting = false;
  
  // Search and filter
  searchTerm = '';
  filteredCourses: Course[] = [];
  
  // Messages
  message = '';
  messageType: 'success' | 'error' | '' = '';
  
  // Statistics
  stats = {
    enrolledCourses: 0,
    completedQuizzes: 0,
    totalScore: 0,
    avgProgress: 0
  };

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.loadMyCourses();
    this.loadAllCourses();
    this.loadMyProgress();
    this.calculateStats();
  }

  ngOnDestroy(): void {
    if (this.quizTimer) {
      clearInterval(this.quizTimer);
    }
  }

  // ==================== NAVIGATION ====================
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessage();
    
    // Clear quiz state when leaving quiz tab
    if (tab !== 'take-quiz') {
      this.resetQuizState();
    }
    
    if (tab === 'my-courses') {
      this.loadMyCourses();
    } else if (tab === 'browse-courses') {
      this.loadAllCourses();
    } else if (tab === 'my-progress') {
      this.loadMyProgress();
    }
  }

  selectCourse(course: Course): void {
    this.selectedCourse = course;
    this.setActiveTab('course-content');
    this.loadCourseContent();
  }

  selectQuiz(quiz: any): void {
    // Create a minimal quiz object from the courseContent quiz data
    this.selectedQuiz = {
      quizId: quiz.quizId,
      courseId: this.selectedCourse?.courseId || 0,
      title: quiz.title,
      totalMarks: quiz.totalMarks,
      createdAt: '',
      createdBy: 0
    };
    this.setActiveTab('take-quiz');
    this.loadQuizForTaking();
  }

  // ==================== DATA LOADING ====================
  
  loadMyCourses(): void {
    this.isLoading = true;
    // In a real implementation, this would load only enrolled courses
    this.courseService.getUserCourses().subscribe({
      next: (courses) => {
        this.myCourses = courses;
        this.isLoading = false;
        this.calculateStats();
      },
      error: (error) => {
        console.error('Error loading my courses:', error);
        this.showMessage('Failed to load your courses.', 'error');
        this.isLoading = false;
      }
    });
  }

  loadAllCourses(): void {
    this.isLoading = true;
    this.courseService.getAllCourses().subscribe({
      next: (courses) => {
        this.allCourses = courses;
        this.filteredCourses = [...courses];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading all courses:', error);
        this.showMessage('Failed to load courses.', 'error');
        this.isLoading = false;
      }
    });
  }

  loadCourseContent(): void {
    if (!this.selectedCourse) return;
    
    this.isLoading = true;
    this.courseService.getCourseContentForLearner(this.selectedCourse.courseId).subscribe({
      next: (content) => {
        this.courseContent = content;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course content:', error);
        this.showMessage('Failed to load course content.', 'error');
        this.isLoading = false;
      }
    });
  }

  loadQuizForTaking(): void {
    if (!this.selectedQuiz) return;
    
    this.isLoading = true;
    this.courseService.getQuizByTitle(this.selectedQuiz.title).subscribe({
      next: (quiz) => {
        if (quiz.questions) {
          this.currentQuizQuestions = quiz.questions;
          this.totalMarks = quiz.totalMarks;
          this.initializeQuizAnswers();
          this.startQuizTimer();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading quiz questions:', error);
        this.showMessage('Failed to load quiz questions.', 'error');
        this.isLoading = false;
      }
    });
  }

  loadMyProgress(): void {
    this.isLoading = true;
    // In a real implementation, this would load user's progress across all courses
    // For now, we'll simulate some data
    setTimeout(() => {
      this.myProgress = [
        {
          courseTitle: 'JavaScript Fundamentals',
          totalQuizzes: 5,
          completedQuizzes: 3,
          totalScore: 240,
          maxScore: 300,
          percentage: 80,
          lastActivity: new Date().toISOString()
        },
        {
          courseTitle: 'React Development',
          totalQuizzes: 4,
          completedQuizzes: 2,
          totalScore: 160,
          maxScore: 200,
          percentage: 80,
          lastActivity: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      this.isLoading = false;
      this.calculateStats();
    }, 1000);
  }

  calculateStats(): void {
    this.stats.enrolledCourses = this.myCourses.length;
    
    if (this.myProgress.length > 0) {
      this.stats.completedQuizzes = this.myProgress.reduce((sum, course) => sum + course.completedQuizzes, 0);
      this.stats.totalScore = this.myProgress.reduce((sum, course) => sum + course.totalScore, 0);
      
      const totalPercentage = this.myProgress.reduce((sum, course) => sum + course.percentage, 0);
      this.stats.avgProgress = Math.round(totalPercentage / this.myProgress.length);
    }
  }

  // ==================== COURSE BROWSING ====================
  
  onSearchChange(): void {
    this.filterCourses();
  }

  filterCourses(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCourses = [...this.allCourses];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCourses = this.allCourses.filter(course =>
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.prerequisites.toLowerCase().includes(term)
      );
    }
  }

  enrollInCourse(course: Course): void {
    // In a real implementation, this would call an enrollment API
    this.showMessage('Enrollment feature to be implemented.', 'error');
  }

  // ==================== COURSE CONTENT ACCESS ====================
  
  downloadMaterial(material: any): void {
    const fullUrl = `http://localhost:5255${material.filePath}`;
    window.open(fullUrl, '_blank');
  }

  // ==================== QUIZ TAKING ====================
  
  initializeQuizAnswers(): void {
    this.quizAnswers = {};
    this.currentQuizQuestions.forEach(question => {
      this.quizAnswers[question.questionId] = '';
    });
  }

  startQuizTimer(): void {
    // Set quiz duration (30 minutes for demo)
    this.quizTimeRemaining = 30 * 60; // 30 minutes in seconds
    
    this.quizTimer = setInterval(() => {
      this.quizTimeRemaining--;
      
      if (this.quizTimeRemaining <= 0) {
        this.submitQuiz(true); // Auto-submit when time runs out
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getTimerColor(): string {
    if (this.quizTimeRemaining > 600) return '#10b981'; // Green (>10 min)
    if (this.quizTimeRemaining > 300) return '#f59e0b'; // Yellow (>5 min)
    return '#ef4444'; // Red (<5 min)
  }

  selectAnswer(questionId: number, option: string): void {
    this.quizAnswers[questionId] = option;
  }

  submitQuiz(autoSubmit: boolean = false): void {
    if (!autoSubmit) {
      // Check if all questions are answered
      const unansweredQuestions = this.currentQuizQuestions.filter(
        question => !this.quizAnswers[question.questionId]
      );
      
      if (unansweredQuestions.length > 0) {
        if (!confirm(`You have ${unansweredQuestions.length} unanswered questions. Do you want to submit anyway?`)) {
          return;
        }
      } else {
        if (!confirm('Are you sure you want to submit the quiz?')) {
          return;
        }
      }
    }

    this.isSubmitting = true;
    
    // Stop the timer
    if (this.quizTimer) {
      clearInterval(this.quizTimer);
      this.quizTimer = null;
    }

    // Calculate score
    this.calculateQuizScore();
    
    // Prepare submission data
    const submission: QuizSubmission = {
      courseId: this.selectedCourse?.courseId || 0,
      quizId: this.selectedQuiz?.quizId || 0,
      answers: Object.keys(this.quizAnswers).map(questionId => ({
        questionId: parseInt(questionId),
        response: this.quizAnswers[parseInt(questionId)]
      }))
    };

    // Submit to backend
    this.courseService.submitQuiz(submission).subscribe({
      next: (response) => {
        this.isQuizSubmitted = true;
        this.showQuizResults = true;
        this.showMessage('Quiz submitted successfully!', 'success');
        this.isSubmitting = false;
        
        // ✅ FIXED: Refresh course content to update quiz status after submission
        this.loadCourseContent();
      },
      error: (error) => {
        console.error('Error submitting quiz:', error);
        this.showMessage('Failed to submit quiz.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  calculateQuizScore(): void {
    this.quizScore = 0;
    
    this.currentQuizQuestions.forEach(question => {
      const userAnswer = this.quizAnswers[question.questionId];
      if (userAnswer && userAnswer.toUpperCase() === question.correctOption.toUpperCase()) {
        this.quizScore += question.marks;
      }
    });
  }

  resetQuizState(): void {
    if (this.quizTimer) {
      clearInterval(this.quizTimer);
      this.quizTimer = null;
    }
    
    this.selectedQuiz = null;
    this.currentQuizQuestions = [];
    this.quizAnswers = {};
    this.quizTimeRemaining = 0;
    this.isQuizSubmitted = false;
    this.showQuizResults = false;
    this.quizScore = 0;
    this.totalMarks = 0;
  }

  retakeQuiz(): void {
    this.resetQuizState();
    if (this.selectedQuiz) {
      this.loadQuizForTaking();
    }
  }

  // ==================== QUIZ RESULT CALCULATIONS ====================
  
  getCorrectAnswersCount(): number {
    return Object.keys(this.quizAnswers).filter(qId => {
      const question = this.currentQuizQuestions.find(q => q.questionId == qId);
      return question && this.quizAnswers[parseInt(qId)] === question.correctOption;
    }).length;
  }

  getIncorrectAnswersCount(): number {
    return Object.keys(this.quizAnswers).filter(qId => {
      const question = this.currentQuizQuestions.find(q => q.questionId == qId);
      return question && this.quizAnswers[parseInt(qId)] && this.quizAnswers[parseInt(qId)] !== question.correctOption;
    }).length;
  }

  getUnansweredCount(): number {
    const answeredCount = Object.keys(this.quizAnswers).filter(qId => this.quizAnswers[parseInt(qId)]).length;
    return this.currentQuizQuestions.length - answeredCount;
  }

  getAnsweredCount(): number {
    return Object.keys(this.quizAnswers).filter(qId => this.quizAnswers[parseInt(qId)]).length;
  }

  getProgressPercentage(): number {
    if (this.currentQuizQuestions.length === 0) return 0;
    return (this.getAnsweredCount() / this.currentQuizQuestions.length) * 100;
  }

  // ==================== HELPER METHODS ====================
  
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

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  getFileIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'pdf': return 'fa-file-pdf';
      case 'video': return 'fa-file-video';
      case 'document': return 'fa-file-word';
      case 'image': return 'fa-file-image';
      default: return 'fa-file';
    }
  }

  truncateText(text: string, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }

  // Message handling
  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    
    if (type === 'success') {
      setTimeout(() => this.clearMessage(), 3000);
    }
  }

  clearMessage(): void {
    this.message = '';
    this.messageType = '';
  }

  // ✅ FIXED: Navigate back to course and refresh content to show updated quiz status
  backToCourse(): void {
    this.setActiveTab('course-content');
    // Refresh course content to ensure updated quiz status is displayed
    this.loadCourseContent();
  }

  // Track by functions for performance
  trackByCourseId(index: number, course: Course): any {
    return course.courseId;
  }

  trackByQuizId(index: number, quiz: any): any {
    return quiz.quizId;
  }

  trackByQuestionId(index: number, question: any): any {
    return question.questionId;
  }
} 