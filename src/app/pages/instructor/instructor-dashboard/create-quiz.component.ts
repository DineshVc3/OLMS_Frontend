import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CourseService, Course, CreateQuizDto, AddQuizQuestionsDto, CourseData } from '../../../services/course.service';

interface QuizQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  marks: number;
}

interface QuizData {
  courseId: number;
  dataId?: number;
  title: string;
  questions: QuizQuestion[];
}

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-quiz.component.html',
  styleUrls: ['./create-quiz.component.css']
})
export class CreateQuizComponent implements OnInit {
  @Output() quizCreated = new EventEmitter<any>();
  @Output() backToDashboard = new EventEmitter<void>();

  courses: Course[] = [];
  courseDataItems: CourseData[] = []; // Available data IDs for selected course
  isLoadingCourseData = false; // Loading state for course data
  quiz: QuizData = {
    courseId: 0,
    title: '',
    questions: []
  };

  isLoading = false;
  message = '';
  messageType: 'success' | 'danger' = 'success';

  constructor(
    private courseService: CourseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.addQuestion(); // Add first question by default
  }

  loadCourses(): void {
    this.courseService.getInstructorCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
        console.log('Courses loaded successfully:', courses);
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.showMessage('Failed to load courses. Please try again.', 'danger');
        // Fallback to mock data for development
        this.courses = [
          { courseId: 1, title: 'Introduction to Angular', description: 'Learn Angular basics', syllabus: '', prerequisites: '', createdAt: '', createdBy: 1 },
          { courseId: 2, title: 'Advanced JavaScript', description: 'Advanced JS concepts', syllabus: '', prerequisites: '', createdAt: '', createdBy: 1 },
          { courseId: 3, title: 'CSS Fundamentals', description: 'Master CSS styling', syllabus: '', prerequisites: '', createdAt: '', createdBy: 1 }
        ];
      }
    });
  }

  // New method to load course data when course is selected
  onCourseSelectionChange(): void {
    if (this.quiz.courseId) {
      this.loadCourseData(this.quiz.courseId);
    } else {
      this.courseDataItems = [];
      this.quiz.dataId = undefined;
    }
  }

  // Load available data IDs for the selected course
  loadCourseData(courseId: number): void {
    this.isLoadingCourseData = true;
    this.courseDataItems = [];
    this.quiz.dataId = undefined;
    
    console.log(`Loading course data for course ID: ${courseId}`);
    
    this.courseService.getCourseDataByCourseId(courseId).subscribe({
      next: (courseData) => {
        this.courseDataItems = courseData;
        this.isLoadingCourseData = false;
        console.log(`Loaded ${courseData.length} data items for course ${courseId}:`, courseData);
        
        if (courseData.length === 0) {
          console.log('No course materials found for this course');
        }
      },
      error: (error) => {
        console.error('Error loading course data:', error);
        this.courseDataItems = [];
        this.isLoadingCourseData = false;
        // Don't show error message as this is optional data
        console.log('Course data loading failed - continuing without data IDs');
      }
    });
  }

  // Get display text for data ID option
  getDataIdDisplayText(courseData: CourseData): string {
    return `${courseData.dataId} - ${courseData.title} (${courseData.type})`;
  }

  addQuestion(): void {
    const newQuestion: QuizQuestion = {
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      marks: 1
    };
    
    this.quiz.questions.push(newQuestion);
  }

  removeQuestion(index: number): void {
    if (this.quiz.questions.length > 1) {
      this.quiz.questions.splice(index, 1);
    }
  }

  duplicateQuestion(index: number): void {
    const questionToDuplicate = { ...this.quiz.questions[index] };
    questionToDuplicate.questionText = questionToDuplicate.questionText + ' (Copy)';
    this.quiz.questions.splice(index + 1, 0, questionToDuplicate);
  }

  calculateTotalMarks(): number {
    return this.quiz.questions.reduce((total, question) => total + (question.marks || 0), 0);
  }

  saveQuiz(): void {
    if (!this.validateQuiz()) {
      return;
    }

    this.isLoading = true;

    // First create the quiz
    const createQuizDto: CreateQuizDto = {
      courseId: this.quiz.courseId,
      dataId: this.quiz.dataId || undefined,
      title: this.quiz.title,
      totalMarks: this.calculateTotalMarks()
    };

    this.courseService.createQuiz(createQuizDto).subscribe({
      next: (response: any) => {
        // Quiz created successfully, now add questions
        this.addQuestionsToQuiz(response.quizId);
      },
      error: (error: any) => {
        console.error('Error creating quiz:', error);
        this.isLoading = false;
        
        let errorMessage = 'Failed to create quiz. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 403) {
          errorMessage = 'You are not authorized to create quizzes for this course.';
        }
        
        this.showMessage(errorMessage, 'danger');
      }
    });
  }

  addQuestionsToQuiz(quizId: number): void {
    const addQuestionsDto: AddQuizQuestionsDto = {
      quizId: quizId,
      questions: this.quiz.questions.map(q => ({
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        marks: q.marks
      }))
    };

    this.courseService.addQuestionsToQuiz(addQuestionsDto).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.showMessage('Quiz created successfully!', 'success');
        this.quizCreated.emit({ quizId, ...this.quiz });
        
        // Reset form after successful creation
        setTimeout(() => {
          this.resetForm();
        }, 2000);
      },
      error: (error: any) => {
        console.error('Error adding questions:', error);
        this.isLoading = false;
        
        let errorMessage = 'Quiz was created but failed to add questions. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.showMessage(errorMessage, 'danger');
      }
    });
  }

  validateQuiz(): boolean {
    // Check if course is selected
    if (!this.quiz.courseId) {
      this.showMessage('Please select a course.', 'danger');
      return false;
    }

    // Check if title is provided
    if (!this.quiz.title.trim()) {
      this.showMessage('Please enter a quiz title.', 'danger');
      return false;
    }

    // Check if there are questions
    if (this.quiz.questions.length === 0) {
      this.showMessage('Please add at least one question.', 'danger');
      return false;
    }

    // Validate each question
    for (let i = 0; i < this.quiz.questions.length; i++) {
      const question = this.quiz.questions[i];
      
      if (!question.questionText.trim()) {
        this.showMessage(`Question ${i + 1}: Please enter the question text.`, 'danger');
        return false;
      }

      if (!question.optionA.trim() || !question.optionB.trim() || 
          !question.optionC.trim() || !question.optionD.trim()) {
        this.showMessage(`Question ${i + 1}: Please fill in all answer options.`, 'danger');
        return false;
      }

      if (!question.correctOption) {
        this.showMessage(`Question ${i + 1}: Please select the correct answer.`, 'danger');
        return false;
      }

      if (!question.marks || question.marks < 1) {
        this.showMessage(`Question ${i + 1}: Please enter a valid mark value (at least 1).`, 'danger');
        return false;
      }
    }

    return true;
  }

  saveDraft(): void {
    // For now, just save to localStorage
    const draftKey = `quiz_draft_${Date.now()}`;
    localStorage.setItem(draftKey, JSON.stringify(this.quiz));
    this.showMessage('Quiz saved as draft in local storage.', 'success');
  }

  previewQuiz(): void {
    if (this.quiz.questions.length === 0) {
      this.showMessage('Please add at least one question to preview.', 'danger');
      return;
    }

    // Open preview modal
    const modal = document.getElementById('previewModal');
    if (modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  }

  goBack(): void {
    console.log('🔙 goBack() method called');
    if (this.hasUnsavedChanges()) {
      console.log('📝 Has unsaved changes - showing confirmation');
      if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
        console.log('✅ User confirmed - emitting backToDashboard');
        this.navigateBack();
      } else {
        console.log('❌ User cancelled');
      }
    } else {
      console.log('✅ No unsaved changes - emitting backToDashboard');
      this.navigateBack();
    }
  }

  navigateBack(): void {
    try {
      // First try to emit the event for the parent component to handle
      this.backToDashboard.emit();
      console.log('📤 Event emitted successfully');
      
      // Add a fallback timeout in case the event doesn't work
      setTimeout(() => {
        // Check if we're still on the create-quiz page (event didn't work)
        if (window.location.href.includes('create-quiz') || 
            document.querySelector('app-create-quiz')) {
          console.log('🚨 Event emission may have failed, using router fallback');
          this.router.navigate(['/instructor/dashboard']).then(() => {
            console.log('✅ Router navigation successful');
          }).catch(error => {
            console.error('❌ Router navigation failed:', error);
          });
        }
      }, 500); // Wait 500ms to see if the event worked
    } catch (error) {
      console.error('❌ Error in navigateBack:', error);
      // Final fallback - reload the page
      window.location.reload();
    }
  }

  hasUnsavedChanges(): boolean {
    return this.quiz.title.trim() !== '' || 
           this.quiz.questions.some(q => 
             q.questionText.trim() !== '' || 
             q.optionA.trim() !== '' || 
             q.optionB.trim() !== '' || 
             q.optionC.trim() !== '' || 
             q.optionD.trim() !== ''
           );
  }

  resetForm(): void {
    this.quiz = {
      courseId: 0,
      title: '',
      questions: []
    };
    this.courseDataItems = [];
    this.addQuestion(); // Add first question
    this.clearMessage();
  }

  trackByQuestionIndex(index: number, question: QuizQuestion): number {
    return index;
  }

  // Helper methods
  showMessage(text: string, type: 'success' | 'danger'): void {
    this.message = text;
    this.messageType = type;
    
    // Auto-clear success messages
    if (type === 'success') {
      setTimeout(() => this.clearMessage(), 5000);
    }
  }

  clearMessage(): void {
    this.message = '';
  }

  // Getter for course name (for display purposes)
  getSelectedCourseName(): string {
    const course = this.courses.find(c => c.courseId === this.quiz.courseId);
    return course ? course.title : '';
  }

  // Method to check if question is valid (for UI feedback)
  isQuestionValid(question: QuizQuestion): boolean {
    return question.questionText.trim() !== '' &&
           question.optionA.trim() !== '' &&
           question.optionB.trim() !== '' &&
           question.optionC.trim() !== '' &&
           question.optionD.trim() !== '' &&
           question.correctOption !== '' &&
           question.marks > 0;
  }

  // Method to get question validation status for styling
  getQuestionValidationClass(question: QuizQuestion): string {
    if (this.isQuestionValid(question)) {
      return 'border-success';
    } else if (question.questionText.trim() !== '' || 
               question.optionA.trim() !== '' || 
               question.optionB.trim() !== '' || 
               question.optionC.trim() !== '' || 
               question.optionD.trim() !== '') {
      return 'border-warning';
    }
    return 'border-light';
  }
} 