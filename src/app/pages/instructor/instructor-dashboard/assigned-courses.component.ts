import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CourseService, Course, CourseData, Quiz, UpdateQuizDto, QuizEditResponseDto, UpdateQuizWithQuestionsDto, UpdateQuestionDto } from '../../../services/course.service';
import { EnrollmentService, EnrolledStudent } from '../../../services/enrollment.service';

@Component({
  selector: 'app-assigned-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './assigned-courses.component.html',
  styleUrls: ['./assigned-courses.component.css']
})
export class AssignedCoursesComponent implements OnInit {
  @Output() sectionChange = new EventEmitter<string>();

  // Data arrays
  courses: Course[] = [];
  courseContent: CourseData[] = [];
  quizzes: Quiz[] = [];
  courseStudents: EnrolledStudent[] = [];
  
  // Selected items
  selectedCourse: Course | null = null;
  selectedContent: CourseData | null = null;
  selectedQuiz: Quiz | null = null;
  selectedStudent: EnrolledStudent | null = null;
  selectedQuizForView: Quiz | null = null;
  selectedQuizQuestions: any[] = [];
  selectedContentForPreview: CourseData | null = null;
  selectedQuizForEdit: QuizEditResponseDto | null = null;
  editingQuestions: UpdateQuestionDto[] = [];

  // Modal states
  showQuizModal = false;
  showDetailsModal = false;
  showContentModal = false;
  showStudentsModal = false;
  showEditContentModal = false;
  showEditQuizModal = false;
  showQuizViewModal = false;
  showContentPreviewModal = false;

  // Loading states
  loading = false;
  isLoading = false;
  detailsLoading = false;
  quizzesLoading = false;
  contentLoading = false;
  courseContentLoading = false;
  studentsLoading = false;
  uploading = false;

  // UI state
  activeDropdown: number | null = null;
  message = '';
  messageType: 'success' | 'danger' = 'success';
  uploadProgress = 0;

  // Forms and files
  editContentForm: FormGroup;
  editQuizForm: FormGroup;
  selectedFile: File | null = null;
  
  // File type configurations - Updated to match backend CourseContentType enum
  private fileTypeConfig = {
    Video: {
      accept: '.mp4,.avi,.mov,.wmv,.flv,.webm,.mkv,.m4v',
      description: 'Video files (.mp4, .avi, .mov, .wmv, .flv, .webm, .mkv, .m4v)',
      icon: 'fas fa-file-video'
    },
    Document: {
      accept: '.pdf,.doc,.docx,.rtf,.txt,.ppt,.pptx,.xls,.xlsx,.csv',
      description: 'Document files (.pdf, .doc, .docx, .rtf, .txt, .ppt, .pptx, .xls, .xlsx, .csv)',
      icon: 'fas fa-file-alt'
    }
  };

  // Cache for stats to prevent change detection errors
  private courseStatsCache = new Map<number, {
    contentCount: number;
    quizCount: number;
    studentCount: number;
  }>();

  constructor(
    private courseService: CourseService,
    private enrollmentService: EnrollmentService,
    private fb: FormBuilder
  ) {
    this.editContentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      description: ['']
    });

    this.editQuizForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      totalMarks: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadAssignedCourses();
  }

  loadAssignedCourses(): void {
    this.loading = true;
    
    this.courseService.getInstructorCourses().subscribe({
      next: (courses: Course[]) => {
        this.courses = courses;
        // Load real student counts for each course
        this.loadCourseStats();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading assigned courses:', error);
        this.loading = false;
        // Fallback to mock data
        this.loadMockData();
      }
    });
  }

  private loadCourseStats(): void {
    // Real stats will be loaded on-demand when count methods are called
    // This prevents unnecessary API calls and improves performance
    console.log('Course stats will be loaded on-demand for', this.courses.length, 'courses');
  }

  private loadRealCourseStats(courseId: number): void {
    // Initialize with zeros first
    this.courseStatsCache.set(courseId, {
      contentCount: 0,
      quizCount: 0,
      studentCount: 0
    });

    // Load real content count
    this.courseService.getCourseDataByCourseId(courseId).subscribe({
      next: (content: CourseData[]) => {
        const currentStats = this.courseStatsCache.get(courseId);
        if (currentStats) {
          this.courseStatsCache.set(courseId, {
            ...currentStats,
            contentCount: content.length
          });
        }
      },
      error: (error: any) => {
        console.error(`Error loading content count for course ${courseId}:`, error);
        // Handle the case where API returns "No data uploaded yet." as plain text
        const currentStats = this.courseStatsCache.get(courseId);
        if (currentStats) {
          this.courseStatsCache.set(courseId, {
            ...currentStats,
            contentCount: 0 // Set to 0 when no data or error occurs
          });
        }
      }
    });

    // Load real quiz count
    this.courseService.getQuizzesByCourse(courseId).subscribe({
      next: (quizzes: Quiz[]) => {
        const currentStats = this.courseStatsCache.get(courseId);
        if (currentStats) {
          this.courseStatsCache.set(courseId, {
            ...currentStats,
            quizCount: quizzes.length
          });
        }
      },
      error: (error: any) => {
        console.error(`Error loading quiz count for course ${courseId}:`, error);
      }
    });

    // Load real student count
    this.enrollmentService.getCourseStudents(courseId).subscribe({
      next: (students: EnrolledStudent[]) => {
        const currentStats = this.courseStatsCache.get(courseId);
        if (currentStats) {
          this.courseStatsCache.set(courseId, {
            ...currentStats,
            studentCount: students.length
          });
        }
      },
      error: (error: any) => {
        console.error(`Error loading student count for course ${courseId}:`, error);
      }
    });
  }

  private loadMockData(): void {
    // Mock data for demonstration
    this.courses = [
      {
        courseId: 1,
        title: 'Introduction to Angular',
        description: 'Learn the basics of Angular framework',
        syllabus: 'Components, Services, Routing, HTTP Client',
        prerequisites: 'Basic HTML, CSS, JavaScript',
        createdAt: new Date().toISOString(),
        createdBy: 1
      },
      {
        courseId: 2,
        title: 'Advanced JavaScript',
        description: 'Deep dive into JavaScript concepts',
        syllabus: 'ES6+, Promises, Async/Await, Modules',
        prerequisites: 'Basic JavaScript',
        createdAt: new Date().toISOString(),
        createdBy: 1
      },
      {
        courseId: 3,
        title: 'CSS Fundamentals',
        description: 'Master CSS styling and layouts',
        syllabus: 'Selectors, Flexbox, Grid, Animations',
        prerequisites: 'HTML basics',
        createdAt: new Date().toISOString(),
        createdBy: 1
      }
    ];
  }

  toggleDropdown(courseId: number): void {
    this.activeDropdown = this.activeDropdown === courseId ? null : courseId;
  }

  viewCourseContent(courseId: number): void {
    this.selectedCourse = this.courses.find(course => course.courseId === courseId) || null;
    this.loadCourseContent(courseId);
    this.showContentModal = true;
    this.activeDropdown = null;
  }

  loadCourseContent(courseId: number): void {
    this.contentLoading = true;
    
    console.log('Loading course content for courseId:', courseId);
    
    this.courseService.getCourseDataByCourseId(courseId).subscribe({
      next: (content: CourseData[]) => {
        console.log('Received course content:', content);
        
        // Handle empty content gracefully
        if (!content || content.length === 0) {
          this.courseContent = [];
          console.log('No course content found for course:', courseId);
        } else {
          // Validate and clean the data
          this.courseContent = this.validateCourseData(content);
          console.log('Processed course content:', this.courseContent);
        }
        this.contentLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading course content:', error);
        this.courseContent = [];
        this.contentLoading = false;
        this.showMessage('Failed to load course content. Please try again.', 'danger');
      }
    });
  }

  private validateCourseData(content: any): CourseData[] {
    if (!Array.isArray(content)) {
      console.warn('Course content is not an array:', content);
      return [];
    }

    return content.map((item: any) => {
      // Ensure all required fields exist with defaults
      const validated: CourseData = {
        dataId: item.dataId || 0,
        courseId: item.courseId || 0,
        title: item.title || 'Untitled Content',
        type: item.type || 'Document',
        filePath: item.filePath || '',
        createdAt: item.createdAt || new Date().toISOString(),
        modifiedAt: item.modifiedAt || null,
        instructorId: item.instructorId || null,
        createdBy: item.createdBy || null
      };

      console.log('Validated content item:', validated);
      return validated;
    });
  }

  viewCourseStudents(courseId: number): void {
    this.selectedCourse = this.courses.find(course => course.courseId === courseId) || null;
    this.loadCourseStudents(courseId);
    this.showStudentsModal = true;
    this.activeDropdown = null;
  }

  loadCourseStudents(courseId: number): void {
    this.studentsLoading = true;
    
    this.enrollmentService.getCourseStudents(courseId).subscribe({
      next: (students: EnrolledStudent[]) => {
        this.courseStudents = students;
        this.studentsLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading course students:', error);
        this.courseStudents = [];
        this.studentsLoading = false;
      }
    });
  }

  viewQuizzes(courseId: number): void {
    this.selectedCourse = this.courses.find(course => course.courseId === courseId) || null;
    this.loadQuizzes(courseId);
    this.showQuizModal = true;
    this.activeDropdown = null;
  }

  loadQuizzes(courseId: number): void {
    this.quizzesLoading = true;
    
    this.courseService.getQuizzesByCourse(courseId).subscribe({
      next: (quizzes: Quiz[]) => {
        this.quizzes = quizzes;
        this.quizzesLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading quizzes:', error);
        this.quizzes = [];
        this.quizzesLoading = false;
      }
    });
  }

  uploadContent(courseId: number): void {
    this.sectionChange.emit('add-content');
  }

  createQuiz(courseId: number): void {
    this.sectionChange.emit('create-quiz');
  }

  getCourseContentCount(courseId: number): number {
    // Use cached value to prevent change detection errors
    if (!this.courseStatsCache.has(courseId)) {
      this.initializeCourseStats(courseId);
      // Trigger loading of real data
      this.loadRealCourseStats(courseId);
    }
    return this.courseStatsCache.get(courseId)?.contentCount || 0;
  }

  getCourseQuizCount(courseId: number): number {
    // Use cached value to prevent change detection errors
    if (!this.courseStatsCache.has(courseId)) {
      this.initializeCourseStats(courseId);
      // Trigger loading of real data
      this.loadRealCourseStats(courseId);
    }
    return this.courseStatsCache.get(courseId)?.quizCount || 0;
  }

  getCourseStudentCount(courseId: number): number {
    // Use cached value to prevent change detection errors
    if (!this.courseStatsCache.has(courseId)) {
      this.initializeCourseStats(courseId);
      // Trigger loading of real data
      this.loadRealCourseStats(courseId);
    }
    return this.courseStatsCache.get(courseId)?.studentCount || 0;
  }

  private initializeCourseStats(courseId: number): void {
    // Initialize with zeros instead of fake random data
    this.courseStatsCache.set(courseId, {
      contentCount: 0,
      quizCount: 0,
      studentCount: 0
    });
  }

  getFileIcon(type: string): string {
    // Handle null, undefined, or non-string types
    if (!type || typeof type !== 'string') {
      return 'fa-file';
    }

    // Use the content type directly if it matches our enum
    if (type === 'Video') {
      return 'fa-file-video';
    } else if (type === 'Document') {
      return 'fa-file-alt';
    }
    
    // Fallback for legacy or unknown types
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'video':
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'webm':
      case 'mkv':
      case 'm4v':
        return 'fa-file-video';
        
      case 'document':
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
      case 'ppt':
      case 'pptx':
      case 'xls':
      case 'xlsx':
      case 'csv':
        return 'fa-file-alt';
        
      default:
        return 'fa-file';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return 'Unknown date';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  }

  trackByCourseId(index: number, course: Course): number {
    return course.courseId;
  }

  closeContentModal(): void {
    this.showContentModal = false;
    this.selectedCourse = null;
    this.courseContent = [];
    this.activeDropdown = null;
  }

  closeStudentsModal(): void {
    this.showStudentsModal = false;
    this.selectedCourse = null;
    this.courseStudents = [];
    this.activeDropdown = null;
  }

  closeQuizModal(): void {
    this.showQuizModal = false;
    this.selectedCourse = null;
    this.quizzes = [];
    this.activeDropdown = null;
  }

  viewCourseDetails(courseId: number): void {
    this.selectedCourse = this.courses.find(course => course.courseId === courseId) || null;
    this.showDetailsModal = true;
    this.detailsLoading = true;
    this.activeDropdown = null;
    
    // Load all course data: content, quizzes, and students
    this.loadAllCourseData(courseId);
  }

  private loadAllCourseData(courseId: number): void {
    let loadingOperations = 0;
    let completedOperations = 0;

    const checkAllLoaded = () => {
      completedOperations++;
      if (completedOperations >= loadingOperations) {
        this.detailsLoading = false;
      }
    };

    // Load course content
    loadingOperations++;
    this.courseService.getCourseDataByCourseId(courseId).subscribe({
      next: (content: CourseData[]) => {
        if (!content || content.length === 0) {
          this.courseContent = [];
        } else {
          this.courseContent = this.validateCourseData(content);
        }
        checkAllLoaded();
      },
      error: (error: any) => {
        console.error('Error loading course content:', error);
        this.courseContent = [];
        checkAllLoaded();
      }
    });

    // Load quizzes
    loadingOperations++;
    this.courseService.getQuizzesByCourse(courseId).subscribe({
      next: (quizzes: Quiz[]) => {
        this.quizzes = quizzes;
        checkAllLoaded();
      },
      error: (error: any) => {
        console.error('Error loading quizzes:', error);
        this.quizzes = [];
        checkAllLoaded();
      }
    });

    // Load students
    loadingOperations++;
    this.enrollmentService.getCourseStudents(courseId).subscribe({
      next: (students: EnrolledStudent[]) => {
        this.courseStudents = students;
        checkAllLoaded();
      },
      error: (error: any) => {
        console.error('Error loading course students:', error);
        this.courseStudents = [];
        checkAllLoaded();
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCourse = null;
    this.courseContent = [];
    this.quizzes = [];
    this.courseStudents = [];
    this.detailsLoading = false;
    this.activeDropdown = null;
  }

  downloadContent(content: CourseData): void {
    // Implement download functionality
    console.log('Download content:', content);
    
    if (!content.filePath) {
      this.showMessage('File path not found for this content.', 'danger');
      return;
    }
    
    try {
      // Create full URL for download
      const downloadUrl = content.filePath.startsWith('http') 
        ? content.filePath 
        : `http://localhost:5255${content.filePath}`;
      
      console.log('Download URL:', downloadUrl);
      
      // Open in new tab for download
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      this.showMessage('Failed to download file. Please try again.', 'danger');
    }
  }

  editContent(content: CourseData): void {
    console.log('=== EDIT CONTENT STARTED ===');
    console.log('Content to edit:', content);
    console.log('Current user can edit?', this.canEditContent(content));
    
    this.selectedContent = content;
    
    // Reset form and clear any previous state
    this.editContentForm.reset();
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.clearMessage();
    
    // Populate form with current values
    this.editContentForm.patchValue({
      title: content.title || '',
      type: content.type || 'Document',
      description: ''
    });
    
    console.log('Form populated with values:', this.editContentForm.value);
    console.log('Form valid after population:', this.editContentForm.valid);
    console.log('Form errors after population:', this.editContentForm.errors);
    
    this.showEditContentModal = true;
  }

  // Add a test method to verify the update functionality
  testUpdateContent(): void {
    if (!this.selectedContent) {
      console.log('No content selected for testing');
      return;
    }

    console.log('=== TESTING UPDATE FUNCTIONALITY ===');
    console.log('Selected content:', this.selectedContent);
    console.log('Current user ID:', localStorage.getItem('userId'));
    console.log('Content instructor ID:', this.selectedContent.instructorId);
    console.log('User can edit:', this.canEditContent(this.selectedContent));
    
    // Create a simple test FormData
    const testFormData = new FormData();
    testFormData.append('CourseId', this.selectedContent.courseId.toString());
    testFormData.append('Title', `Test Update ${new Date().getTime()}`);
    testFormData.append('Type', this.selectedContent.type);
    
    console.log('Test FormData created with:');
    for (const [key, value] of testFormData.entries()) {
      console.log(`${key}: ${value}`);
    }
    
    console.log('Making test API call...');
    this.courseService.updateCourseData(this.selectedContent.dataId, testFormData).subscribe({
      next: (response) => {
        console.log('✅ TEST UPDATE SUCCESS:', response);
      },
      error: (error) => {
        console.error('❌ TEST UPDATE FAILED:', error);
      }
    });
  }

  deleteContent(content: CourseData): void {
    if (confirm(`Are you sure you want to delete "${content.title}"?`)) {
      // Note: Delete functionality would need to be implemented in the backend
      console.log('Delete content:', content);
      this.showMessage('Delete functionality not implemented in backend yet.', 'danger');
    }
  }

  onEditFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) {
      this.selectedFile = null;
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showMessage('File size must be less than 50MB.', 'danger');
      event.target.value = '';
      return;
    }

    // Validate file type if selected
    const selectedFileType = this.editContentForm.get('type')?.value;
    if (selectedFileType && !this.isValidFileType(file, selectedFileType)) {
      this.showMessage(`Invalid file type. Please select a ${this.getFileTypeDescription(selectedFileType)} file.`, 'danger');
      event.target.value = '';
      return;
    }

    this.selectedFile = file;
    this.clearMessage();
  }

  isValidFileType(file: File, fileType: string): boolean {
    const config = this.fileTypeConfig[fileType as keyof typeof this.fileTypeConfig];
    if (!config) return false;

    const acceptedTypes = config.accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    return acceptedTypes.includes(fileExtension);
  }

  getAcceptedFileTypes(): string {
    const fileType = this.editContentForm.get('type')?.value;
    if (!fileType) return '*';
    
    const config = this.fileTypeConfig[fileType as keyof typeof this.fileTypeConfig];
    return config ? config.accept : '*';
  }

  getFileTypeDescription(fileType?: string): string {
    const type = fileType || this.editContentForm.get('type')?.value;
    if (!type) return 'Any file type';
    
    const config = this.fileTypeConfig[type as keyof typeof this.fileTypeConfig];
    return config ? config.description : 'Any file type';
  }

  removeEditFile(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
    
    const fileInput = document.getElementById('editFileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onUpdateContent(): void {
    console.log('=== UPDATE CONTENT DEBUG ===');
    console.log('Form valid:', this.editContentForm.valid);
    console.log('Form errors:', this.editContentForm.errors);
    
    if (this.editContentForm.invalid) {
      this.markFormGroupTouched();
      console.log('Form validation failed, errors:', this.editContentForm.errors);
      return;
    }

    if (!this.selectedContent) {
      console.error('No selected content');
      return;
    }

    console.log('Selected content:', this.selectedContent);
    console.log('Form values:', this.editContentForm.value);
    console.log('Selected file:', this.selectedFile);
    console.log('Current user info:', {
      userId: localStorage.getItem('userId'),
      email: localStorage.getItem('email'),
      role: localStorage.getItem('role')
    });

    // Clear any previous error messages
    this.clearMessage();
    this.uploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('File', this.selectedFile);
      console.log('Added file to FormData:', this.selectedFile.name);
    } else {
      console.log('No file selected - updating metadata only');
    }
    
    formData.append('CourseId', this.selectedContent.courseId.toString());
    formData.append('Title', this.editContentForm.get('title')?.value);
    formData.append('Type', this.editContentForm.get('type')?.value);
    
    // Debug: Log all FormData entries
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    
    console.log('Making PUT request to:', `${this.courseService['apiUrl'] || 'http://localhost:5255/api'}/CourseData/course/data/${this.selectedContent.dataId}`);

    this.courseService.updateCourseData(this.selectedContent.dataId, formData).subscribe({
      next: (response) => {
        console.log('=== UPDATE SUCCESS ===');
        console.log('Response:', response);
        this.uploading = false;
        this.uploadProgress = 100;
        
        // Backend returns plain text: "Course content updated successfully."
        let successMessage = 'Content updated successfully!';
        if (typeof response === 'string') {
          successMessage = response;
        }
        
        // Show success message
        this.showMessage(successMessage, 'success');
        
        // Refresh the content list to show updated data
        if (this.selectedCourse) {
          console.log('Refreshing content list for course:', this.selectedCourse.courseId);
          this.loadCourseContent(this.selectedCourse.courseId);
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          this.closeEditContentModal();
        }, 2000);
      },
      error: (error) => {
        console.error('=== UPDATE ERROR DEBUG ===');
        console.error('Full error object:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error body:', error.error);
        console.error('Error headers:', error.headers);
        
        this.uploading = false;
        this.uploadProgress = 0;
        
        let errorMessage = 'Failed to update content. Please try again.';
        
        if (error.status === 400) {
          if (typeof error.error === 'string') {
            if (error.error === 'Update failed or unauthorized access.') {
              errorMessage = 'You are not authorized to edit this content. Only the instructor who created it can edit it.';
            } else if (error.error.includes('Invalid user identity')) {
              errorMessage = 'Authentication error. Please login again.';
            } else {
              errorMessage = error.error;
            }
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            // Handle validation errors
            const validationErrors = Object.keys(error.error.errors).map(key => 
              `${key}: ${error.error.errors[key].join(', ')}`
            ).join('\n');
            errorMessage = `Validation errors:\n${validationErrors}`;
          } else {
            errorMessage = 'Invalid request. Please check your form data and try again.';
          }
        } else if (error.status === 401) {
          errorMessage = 'You are not logged in or your session has expired. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to edit this content.';
        } else if (error.status === 404) {
          errorMessage = 'The content you are trying to edit was not found.';
        } else if (error.status === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        console.error('Final error message:', errorMessage);
        this.showMessage(errorMessage, 'danger');
      }
    });
  }

  closeEditContentModal(): void {
    this.showEditContentModal = false;
    this.selectedContent = null;
    this.editContentForm.reset();
    this.selectedFile = null;
    this.uploadProgress = 0;
    this.clearMessage();
    
    const fileInput = document.getElementById('editFileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getEditFileIcon(): string {
    if (!this.selectedFile) return 'fas fa-file';
    
    const fileName = this.selectedFile.name.toLowerCase();
    
    // Check for video files
    if (fileName.includes('.mp4') || fileName.includes('.avi') || fileName.includes('.mov') || 
        fileName.includes('.wmv') || fileName.includes('.flv') || fileName.includes('.webm') ||
        fileName.includes('.mkv') || fileName.includes('.m4v')) {
      return 'fas fa-file-video';
    }
    
    // Check for document files
    if (fileName.includes('.pdf') || fileName.includes('.doc') || fileName.includes('.docx') || 
        fileName.includes('.txt') || fileName.includes('.rtf') || fileName.includes('.ppt') || 
        fileName.includes('.pptx') || fileName.includes('.xls') || fileName.includes('.xlsx') ||
        fileName.includes('.csv')) {
      return 'fas fa-file-alt';
    }
    
    return 'fas fa-file';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editContentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.editContentForm.controls).forEach(key => {
      const control = this.editContentForm.get(key);
      control?.markAsTouched();
    });
  }

  private showMessage(text: string, type: 'success' | 'danger'): void {
    this.message = text;
    this.messageType = type;
  }

  clearMessage(): void {
    this.message = '';
  }

  // ✅ NEW: Close quiz view modal
  closeQuizViewModal(): void {
    this.showQuizViewModal = false;
    this.selectedQuizForView = null;
    this.selectedQuizQuestions = [];
    this.activeDropdown = null;
  }

  // ✅ NEW: Preview content functionality
  previewContent(content: CourseData): void {
    console.log('Preview content:', content);
    this.selectedContentForPreview = content;
    this.showContentPreviewModal = true;
    this.activeDropdown = null;
  }

  // ✅ NEW: Close content preview modal
  closeContentPreviewModal(): void {
    this.showContentPreviewModal = false;
    this.selectedContentForPreview = null;
    this.activeDropdown = null;
  }

  // ✅ NEW: Check if content can be previewed
  canPreviewContent(content: CourseData): boolean {
    console.log('Checking preview for content:', content);
    console.log('Content type:', content.type, 'Type of type:', typeof content.type);
    console.log('Content filePath:', content.filePath);
    
    if (!content.type || !content.filePath) {
      console.log('Missing type or filePath');
      return false;
    }
    
    // Convert type to string if it's not already a string
    let contentType: string;
    if (typeof content.type === 'string') {
      contentType = content.type.toLowerCase();
    } else {
      // If it's a number or other type, convert to string first
      contentType = String(content.type).toLowerCase();
    }
    
    console.log('Processed content type:', contentType);
    
    // Check file extension from title or filePath if type is not helpful
    const fileName = content.title || content.filePath || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    console.log('File name:', fileName);
    console.log('File extension:', fileExtension);
    
    const previewableTypes = ['video', 'document', 'pdf', 'image', 'mp4', 'avi', 'mov', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'];
    const previewableExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', 'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
    
    const canPreviewByType = previewableTypes.some(type => contentType.includes(type));
    const canPreviewByExtension = previewableExtensions.includes(fileExtension);
    
    const canPreview = canPreviewByType || canPreviewByExtension;
    
    console.log('Can preview by type:', canPreviewByType);
    console.log('Can preview by extension:', canPreviewByExtension);
    console.log('Final can preview:', canPreview);
    
    return canPreview;
  }

  // ✅ NEW: Get content preview URL
  getContentPreviewUrl(content: CourseData): string {
    console.log('Getting preview URL for:', content);
    
    if (!content.filePath) {
      console.log('No filePath available');
      return '';
    }
    
    const url = content.filePath.startsWith('http') 
      ? content.filePath 
      : `http://localhost:5255${content.filePath}`;
    
    console.log('Preview URL:', url);
    return url;
  }

  viewQuiz(quiz: Quiz): void {
    console.log('View quiz:', quiz);
    this.selectedQuizForView = quiz;
    this.selectedQuizQuestions = [];
    this.showQuizViewModal = true;
    this.activeDropdown = null;
    this.uploading = true;

    // Load complete quiz data with questions for viewing
    this.courseService.getQuizForEditing(quiz.quizId).subscribe({
      next: (quizData: QuizEditResponseDto) => {
        console.log('Quiz data loaded for viewing:', quizData);
        this.selectedQuizQuestions = quizData.questions;
        this.uploading = false;
      },
      error: (error) => {
        console.error('Error loading quiz for viewing:', error);
        this.uploading = false;
        this.showMessage('Failed to load quiz details. Please try again.', 'danger');
      }
    });
  }

  editQuiz(quiz: Quiz): void {
    console.log('Edit quiz:', quiz);
    this.selectedQuiz = quiz;
    this.uploading = true;
    this.clearMessage();
    this.showEditQuizModal = true;
    this.activeDropdown = null;

    // Load comprehensive quiz data with questions
    this.courseService.getQuizForEditing(quiz.quizId).subscribe({
      next: (quizData: QuizEditResponseDto) => {
        console.log('Quiz data loaded for editing:', quizData);
        this.selectedQuizForEdit = quizData;
        
        // Reset and populate form
        this.editQuizForm.reset();
        this.editQuizForm.patchValue({
          title: quizData.title,
          totalMarks: quizData.totalMarks
        });

        // Load questions for editing
        this.editingQuestions = quizData.questions.map(q => ({
          questionId: q.questionId,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption,
          marks: q.marks,
          isDeleted: false
        }));

        this.uploading = false;
      },
      error: (error) => {
        console.error('Error loading quiz for editing:', error);
        this.uploading = false;
        this.showMessage('Failed to load quiz data. Please try again.', 'danger');
        this.closeEditQuizModal();
      }
    });
  }

  addQuestion(): void {
    const newQuestion: UpdateQuestionDto = {
      questionId: undefined, // New question
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      marks: 1,
      isDeleted: false
    };
    this.editingQuestions.push(newQuestion);
  }

  removeQuestion(index: number): void {
    if (this.editingQuestions.length > 1) {
      const question = this.editingQuestions[index];
      if (question.questionId) {
        // Mark existing question for deletion
        question.isDeleted = true;
      } else {
        // Remove new question from array
        this.editingQuestions.splice(index, 1);
      }
    }
  }

  duplicateQuestion(index: number): void {
    const questionToDuplicate = { ...this.editingQuestions[index] };
    questionToDuplicate.questionId = undefined; // New question
    questionToDuplicate.questionText = questionToDuplicate.questionText + ' (Copy)';
    questionToDuplicate.isDeleted = false;
    this.editingQuestions.splice(index + 1, 0, questionToDuplicate);
  }

  calculateTotalMarks(): number {
    return this.editingQuestions
      .filter(q => !q.isDeleted)
      .reduce((total, question) => total + (question.marks || 0), 0);
  }

  getVisibleQuestions(): UpdateQuestionDto[] {
    return this.editingQuestions.filter(q => !q.isDeleted);
  }

  onUpdateQuiz(): void {
    if (this.editQuizForm.invalid || !this.selectedQuiz || !this.selectedQuizForEdit) {
      this.markQuizFormGroupTouched();
      return;
    }

    // Validate questions
    const visibleQuestions = this.getVisibleQuestions();
    if (visibleQuestions.length === 0) {
      this.showMessage('Quiz must have at least one question.', 'danger');
      return;
    }

    // Validate each question
    for (let i = 0; i < visibleQuestions.length; i++) {
      const question = visibleQuestions[i];
      if (!question.questionText.trim()) {
        this.showMessage(`Question ${i + 1}: Please enter the question text.`, 'danger');
        return;
      }
      if (!question.optionA.trim() || !question.optionB.trim() || 
          !question.optionC.trim() || !question.optionD.trim()) {
        this.showMessage(`Question ${i + 1}: Please fill in all answer options.`, 'danger');
        return;
      }
      if (!question.correctOption) {
        this.showMessage(`Question ${i + 1}: Please select the correct answer.`, 'danger');
        return;
      }
      if (!question.marks || question.marks < 1) {
        this.showMessage(`Question ${i + 1}: Please enter valid marks (at least 1).`, 'danger');
        return;
      }
    }

    this.uploading = true;
    this.clearMessage();

    const updateQuizDto: UpdateQuizWithQuestionsDto = {
      title: this.editQuizForm.get('title')?.value,
      totalMarks: this.calculateTotalMarks(),
      questions: this.editingQuestions // Include all questions (deleted ones marked with isDeleted: true)
    };

    console.log('Updating quiz with questions:', this.selectedQuiz.quizId, updateQuizDto);

    this.courseService.updateQuizWithQuestions(this.selectedQuiz.quizId, updateQuizDto).subscribe({
      next: (response) => {
        console.log('Quiz updated successfully:', response);
        this.uploading = false;
        this.showMessage('Quiz updated successfully!', 'success');
        
        // Update local quiz data
        if (this.selectedQuiz) {
          this.selectedQuiz.title = updateQuizDto.title;
          this.selectedQuiz.totalMarks = updateQuizDto.totalMarks;
        }
        
        // Refresh quiz list if in details modal
        if (this.showDetailsModal && this.selectedCourse) {
          this.loadQuizzes(this.selectedCourse.courseId);
        }
        
        // Close modal after delay
        setTimeout(() => {
          this.closeEditQuizModal();
        }, 2000);
      },
      error: (error) => {
        console.error('Error updating quiz:', error);
        this.uploading = false;
        
        let errorMessage = 'Failed to update quiz. Please try again.';
        if (error.status === 403) {
          errorMessage = 'You can only edit quizzes you created.';
        } else if (error.status === 404) {
          errorMessage = 'Quiz not found.';
        } else if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        }
        
        this.showMessage(errorMessage, 'danger');
      }
    });
  }

  closeEditQuizModal(): void {
    this.showEditQuizModal = false;
    this.selectedQuiz = null;
    this.selectedQuizForEdit = null;
    this.editingQuestions = [];
    this.editQuizForm.reset();
    this.clearMessage();
    this.uploading = false;
    this.activeDropdown = null;
  }

  private markQuizFormGroupTouched(): void {
    Object.keys(this.editQuizForm.controls).forEach(key => {
      const control = this.editQuizForm.get(key);
      control?.markAsTouched();
    });
  }

  isQuizFieldInvalid(fieldName: string): boolean {
    const field = this.editQuizForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isQuestionValid(question: UpdateQuestionDto): boolean {
    return question.questionText.trim() !== '' &&
           question.optionA.trim() !== '' &&
           question.optionB.trim() !== '' &&
           question.optionC.trim() !== '' &&
           question.optionD.trim() !== '' &&
           question.correctOption !== '' &&
           question.marks > 0;
  }

  getQuestionValidationClass(question: UpdateQuestionDto): string {
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

  trackByQuestionIndex(index: number, question: UpdateQuestionDto): number {
    return question.questionId || index;
  }

  deleteQuiz(quiz: Quiz): void {
    // Implement delete quiz functionality
    console.log('Delete quiz:', quiz);
  }

  contactStudent(email: string): void {
    // Open email client
    const emailSubject = `Regarding Course: ${this.selectedCourse?.title || 'Your Course'}`;
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}`;
    window.open(mailtoLink, '_blank');
  }

  viewStudentProgress(student: EnrolledStudent): void {
    // Implement student progress view
    console.log('View student progress:', student);
    // This could navigate to a detailed progress view or open a modal
  }

  canEditContent(content: CourseData): boolean {
    const currentUserId = localStorage.getItem('userId');
    const currentUserRole = localStorage.getItem('role');
    
    // Admin and SuperAdmin can edit any content
    if (currentUserRole === 'Admin' || currentUserRole === 'SuperAdmin') {
      return true;
    }
    
    // Instructors can only edit content they created
    if (currentUserRole === 'Instructor') {
      if (!currentUserId || !content.instructorId) {
        console.warn('Missing user ID or instructor ID for content ownership check');
        return false;
      }
      
      const canEdit = parseInt(currentUserId) === content.instructorId;
      console.log('Edit permission check:', {
        currentUserId: parseInt(currentUserId),
        contentInstructorId: content.instructorId,
        canEdit: canEdit
      });
      
      return canEdit;
    }
    
    return false;
  }

  // ✅ NEW: Helper methods for template
  isVideoContent(content: CourseData): boolean {
    if (!content) return false;
    
    const typeStr = typeof content.type === 'string' ? content.type : String(content.type || '');
    const fileName = content.title || content.filePath || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    return typeStr.toLowerCase().includes('video') || 
           ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(fileExtension);
  }

  isDocumentContent(content: CourseData): boolean {
    if (!content) return false;
    
    const typeStr = typeof content.type === 'string' ? content.type : String(content.type || '');
    const fileName = content.title || content.filePath || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    return typeStr.toLowerCase().includes('doc') || 
           typeStr.toLowerCase().includes('pdf') ||
           ['pdf', 'doc', 'docx'].includes(fileExtension);
  }

  isImageContent(content: CourseData): boolean {
    if (!content) return false;
    
    const typeStr = typeof content.type === 'string' ? content.type : String(content.type || '');
    const fileName = content.title || content.filePath || '';
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    return typeStr.toLowerCase().includes('image') || 
           ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(fileExtension);
  }
} 