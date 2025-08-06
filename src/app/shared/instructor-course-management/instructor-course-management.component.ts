import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService, Course, Quiz, LearnerProgress } from '../../services/course.service';

export interface CourseContent {
  dataId: number;
  courseId: number;
  title: string;
  type: string;
  filePath: string;
  createdAt: string;
}

export interface QuizQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  marks: number;
}

@Component({
  selector: 'app-instructor-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-course-management.component.html',
  styleUrls: ['./instructor-course-management.component.css']
})
export class InstructorCourseManagementComponent implements OnInit {
  // Navigation
  activeTab: string = 'my-courses'; // 'my-courses', 'course-content', 'quiz-management', 'student-progress'
  selectedCourse: Course | null = null;
  
  // Data
  myCourses: Course[] = [];
  courseContent: CourseContent[] = [];
  courseQuizzes: Quiz[] = [];
  studentProgress: LearnerProgress[] = [];
  
  // Loading states
  isLoading = false;
  isUploading = false;
  
  // Course content upload
  contentUploadForm = {
    title: '',
    type: 'PDF', // PDF, Video, Document, Image
    file: null as File | null
  };
  
  // Quiz creation
  showCreateQuizModal = false;
  showAddQuestionsModal = false;
  selectedQuiz: Quiz | null = null;
  
  quizForm = {
    title: '',
    totalMarks: 100,
    courseId: 0
  };
  
  questionForm: QuizQuestion = {
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    marks: 5
  };
  
  quizQuestions: QuizQuestion[] = [];
  
  // Messages
  message = '';
  messageType: 'success' | 'error' | '' = '';
  
  // Statistics
  stats = {
    totalCourses: 0,
    totalStudents: 0,
    totalQuizzes: 0,
    avgProgress: 0
  };

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.loadMyCourses();
    this.calculateStats();
  }

  // ==================== NAVIGATION ====================
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessage();
    
    if (tab === 'my-courses') {
      this.loadMyCourses();
    } else if (tab === 'course-content' && this.selectedCourse) {
      this.loadCourseContent();
    } else if (tab === 'quiz-management' && this.selectedCourse) {
      this.loadCourseQuizzes();
    } else if (tab === 'student-progress' && this.selectedCourse) {
      this.loadStudentProgress();
    }
  }

  selectCourse(course: Course): void {
    this.selectedCourse = course;
    this.quizForm.courseId = course.courseId;
    this.setActiveTab('course-content');
  }

  // ==================== DATA LOADING ====================
  
  loadMyCourses(): void {
    this.isLoading = true;
    this.courseService.getUserCourses().subscribe({
      next: (courses) => {
        this.myCourses = courses;
        this.isLoading = false;
        this.calculateStats();
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.showMessage('Failed to load courses.', 'error');
        this.isLoading = false;
      }
    });
  }

  loadCourseContent(): void {
    if (!this.selectedCourse) return;
    
    this.isLoading = true;
    this.courseService.getCourseDataByCourseId(this.selectedCourse.courseId).subscribe({
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

  loadCourseQuizzes(): void {
    if (!this.selectedCourse) return;
    
    this.isLoading = true;
    this.courseService.getQuizzesByCourse(this.selectedCourse.courseId).subscribe({
      next: (quizzes) => {
        this.courseQuizzes = quizzes;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading quizzes:', error);
        this.showMessage('Failed to load quizzes.', 'error');
        this.isLoading = false;
      }
    });
  }

  loadStudentProgress(): void {
    if (!this.selectedCourse) return;
    
    this.isLoading = true;
    this.courseService.getAggregatedProgressByCourse(this.selectedCourse.courseId).subscribe({
      next: (progress) => {
        this.studentProgress = progress;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading student progress:', error);
        this.showMessage('Failed to load student progress.', 'error');
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.totalCourses = this.myCourses.length;
    this.stats.totalQuizzes = this.courseQuizzes.length;
    this.stats.totalStudents = this.studentProgress.length;
    
    if (this.studentProgress.length > 0) {
      const totalProgress = this.studentProgress.reduce((sum, student) => {
        return sum + ((student.score / student.totalMarks) * 100);
      }, 0);
      this.stats.avgProgress = Math.round(totalProgress / this.studentProgress.length);
    }
  }

  // ==================== COURSE CONTENT MANAGEMENT ====================
  
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.contentUploadForm.file = file;
      
      // Auto-set title from filename if empty
      if (!this.contentUploadForm.title) {
        this.contentUploadForm.title = file.name.split('.')[0];
      }
      
      // Auto-detect type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension) {
        if (['pdf'].includes(extension)) {
          this.contentUploadForm.type = 'PDF';
        } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
          this.contentUploadForm.type = 'Video';
        } else if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
          this.contentUploadForm.type = 'Document';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
          this.contentUploadForm.type = 'Image';
        }
      }
    }
  }

  uploadContent(): void {
    if (!this.validateContentForm()) return;
    if (!this.selectedCourse) return;

    const formData = new FormData();
    formData.append('CourseId', this.selectedCourse.courseId.toString());
    formData.append('Title', this.contentUploadForm.title);
    formData.append('Type', this.contentUploadForm.type);
    formData.append('File', this.contentUploadForm.file!);

    this.isUploading = true;
    this.courseService.uploadCourseData(formData).subscribe({
      next: (response) => {
        this.showMessage('Content uploaded successfully!', 'success');
        this.resetContentForm();
        this.loadCourseContent();
        this.isUploading = false;
      },
      error: (error) => {
        console.error('Error uploading content:', error);
        this.showMessage('Failed to upload content.', 'error');
        this.isUploading = false;
      }
    });
  }

  deleteContent(content: CourseContent): void {
    if (confirm(`Are you sure you want to delete "${content.title}"?`)) {
      // Note: Delete endpoint would need to be implemented in backend
      this.showMessage('Delete functionality to be implemented.', 'error');
    }
  }

  downloadContent(content: CourseContent): void {
    // Open file in new tab for download
    const fullUrl = `http://localhost:5255${content.filePath}`;
    window.open(fullUrl, '_blank');
  }

  // ==================== QUIZ MANAGEMENT ====================
  
  openCreateQuizModal(): void {
    // ✅ FIXED: Ensure we have a valid courseId
    if (!this.selectedCourse || !this.selectedCourse.courseId) {
      this.showMessage('Please select a course first.', 'error');
      return;
    }

    console.log('🔍 Opening quiz modal for course:', this.selectedCourse.courseId);
    
    this.quizForm = {
      title: '',
      totalMarks: 100,
      courseId: this.selectedCourse.courseId
    };
    this.showCreateQuizModal = true;
    this.clearMessage();
  }

  closeCreateQuizModal(): void {
    this.showCreateQuizModal = false;
    this.quizForm = {
      title: '',
      totalMarks: 100,
      courseId: 0
    };
  }

  createQuiz(): void {
    if (!this.validateQuizForm()) return;

    // ✅ ADDED: Double-check we have valid data before sending
    if (!this.quizForm.courseId || this.quizForm.courseId <= 0) {
      this.showMessage('Invalid course selected. Please try again.', 'error');
      return;
    }

    console.log('🔍 Creating quiz with data:', this.quizForm);

    this.isLoading = true;
    this.courseService.createQuiz(this.quizForm).subscribe({
      next: (response) => {
        console.log('✅ Quiz created successfully:', response);
        this.showMessage('Quiz created successfully!', 'success');
        this.closeCreateQuizModal();
        this.loadCourseQuizzes();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error creating quiz:', error);
        let errorMessage = 'Failed to create quiz.';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        }
        
        this.showMessage(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  openAddQuestionsModal(quiz: Quiz): void {
    this.selectedQuiz = quiz;
    this.quizQuestions = [];
    this.resetQuestionForm();
    this.showAddQuestionsModal = true;
    this.clearMessage();
  }

  closeAddQuestionsModal(): void {
    this.showAddQuestionsModal = false;
    this.selectedQuiz = null;
    this.quizQuestions = [];
    this.resetQuestionForm();
  }

  addQuestion(): void {
    if (!this.validateQuestionForm()) return;

    this.quizQuestions.push({ ...this.questionForm });
    this.resetQuestionForm();
    this.showMessage('Question added! Add more or save all questions.', 'success');
  }

  removeQuestion(index: number): void {
    this.quizQuestions.splice(index, 1);
  }

  saveAllQuestions(): void {
    if (this.quizQuestions.length === 0) {
      this.showMessage('Please add at least one question.', 'error');
      return;
    }

    if (!this.selectedQuiz) return;

    const addQuestionsDto = {
      quizId: this.selectedQuiz.quizId,
      questions: this.quizQuestions
    };

    this.isLoading = true;
    this.courseService.addQuestionsToQuiz(addQuestionsDto).subscribe({
      next: (response) => {
        this.showMessage('Questions added successfully!', 'success');
        this.closeAddQuestionsModal();
        this.loadCourseQuizzes();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error adding questions:', error);
        this.showMessage('Failed to add questions.', 'error');
        this.isLoading = false;
      }
    });
  }

  viewQuizProgress(quiz: Quiz): void {
    this.courseService.getProgressByQuiz(quiz.quizId).subscribe({
      next: (progress) => {
        console.log('Quiz progress:', progress);
        this.showMessage('Quiz progress loaded in console.', 'success');
      },
      error: (error) => {
        console.error('Error loading quiz progress:', error);
        this.showMessage('Failed to load quiz progress.', 'error');
      }
    });
  }

  // ==================== VALIDATION ====================
  
  validateContentForm(): boolean {
    if (!this.contentUploadForm.title.trim()) {
      this.showMessage('Content title is required.', 'error');
      return false;
    }

    if (!this.contentUploadForm.file) {
      this.showMessage('Please select a file to upload.', 'error');
      return false;
    }

    // Check file size (50MB limit)
    if (this.contentUploadForm.file.size > 50 * 1024 * 1024) {
      this.showMessage('File size must be less than 50MB.', 'error');
      return false;
    }

    return true;
  }

  validateQuizForm(): boolean {
    if (!this.quizForm.title.trim()) {
      this.showMessage('Quiz title is required.', 'error');
      return false;
    }

    if (this.quizForm.totalMarks < 1) {
      this.showMessage('Total marks must be at least 1.', 'error');
      return false;
    }

    return true;
  }

  validateQuestionForm(): boolean {
    if (!this.questionForm.questionText.trim()) {
      this.showMessage('Question text is required.', 'error');
      return false;
    }

    if (!this.questionForm.optionA.trim() || !this.questionForm.optionB.trim() || 
        !this.questionForm.optionC.trim() || !this.questionForm.optionD.trim()) {
      this.showMessage('All answer options are required.', 'error');
      return false;
    }

    if (this.questionForm.marks < 1) {
      this.showMessage('Question marks must be at least 1.', 'error');
      return false;
    }

    return true;
  }

  // ==================== HELPER METHODS ====================
  
  resetContentForm(): void {
    this.contentUploadForm = {
      title: '',
      type: 'PDF',
      file: null
    };
    
    // Reset file input
    const fileInput = document.getElementById('contentFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  resetQuestionForm(): void {
    this.questionForm = {
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      marks: 5
    };
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

  getFileIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'pdf': return 'fa-file-pdf';
      case 'video': return 'fa-file-video';
      case 'document': return 'fa-file-word';
      case 'image': return 'fa-file-image';
      default: return 'fa-file';
    }
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return '#10b981'; // Green
    if (percentage >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
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

  // Track by functions for performance
  trackByCourseId(index: number, course: Course): any {
    return course.courseId;
  }

  trackByContentId(index: number, content: CourseContent): any {
    return content.dataId;
  }

  trackByQuizId(index: number, quiz: Quiz): any {
    return quiz.quizId;
  }
} 