import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';

interface Course {
  courseId: number;
  title: string;
  description: string;
}

@Component({
  selector: 'app-add-content',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-content.component.html',
  styleUrls: ['./add-content.component.css']
})
export class AddContentComponent implements OnInit {
  @Output() contentAdded = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  contentForm: FormGroup;
  courses: Course[] = [];
  selectedFile: File | null = null;
  uploading = false;
  uploadProgress = 0;
  message = '';
  messageType: 'success' | 'danger' = 'success';

  private apiUrl = 'http://localhost:5255/api';

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.contentForm = this.fb.group({
      courseId: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      fileType: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    const headers = this.getAuthHeaders();
    
    this.http.get<Course[]>(`${this.apiUrl}/CourseData/courses`, { headers }).subscribe({
      next: (courses) => {
        this.courses = courses;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.showMessage('Failed to load courses. Please try again.', 'danger');
        // Use mock data for development
        this.courses = [
          { courseId: 1, title: 'Introduction to Angular', description: 'Learn Angular basics' },
          { courseId: 2, title: 'Advanced JavaScript', description: 'Advanced JS concepts' },
          { courseId: 3, title: 'CSS Fundamentals', description: 'Master CSS styling' }
        ];
      }
    });
  }

  onFileTypeChange(): void {
    // Reset file selection when file type changes
    this.selectedFile = null;
    this.uploadProgress = 0;
    
    // Clear file input
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) {
      this.selectedFile = null;
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      this.showMessage('File size must be less than 50MB.', 'danger');
      event.target.value = ''; // Clear the input
      return;
    }

    // Validate file type if selected
    const selectedFileType = this.contentForm.get('fileType')?.value;
    if (selectedFileType && !this.isValidFileType(file, selectedFileType)) {
      this.showMessage(`Invalid file type. Please select a ${this.getFileTypeDescription()} file.`, 'danger');
      event.target.value = ''; // Clear the input
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

  removeFile(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
    
    // Clear file input
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit(): void {
    console.log('Form submission started');
    console.log('Form valid:', this.contentForm.valid);
    console.log('Form values:', this.contentForm.value);
    console.log('Selected file:', this.selectedFile);
    
    if (this.contentForm.invalid || !this.selectedFile) {
      this.markFormGroupTouched();
      if (!this.selectedFile) {
        this.showMessage('Please select a file to upload.', 'danger');
      }
      console.log('Form validation failed');
      return;
    }

    this.uploadContent();
  }

  uploadContent(): void {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('File', this.selectedFile);
    
    // Ensure CourseId is a valid number
    const courseId = this.contentForm.get('courseId')?.value;
    if (!courseId || isNaN(courseId)) {
      this.showMessage('Please select a valid course.', 'danger');
      this.uploading = false;
      return;
    }
    
    formData.append('CourseId', courseId.toString());
    formData.append('Title', this.contentForm.get('title')?.value);
    formData.append('Type', this.contentForm.get('fileType')?.value);
    
    // Debug: Log FormData contents
    console.log('FormData being sent:');
    console.log('- File:', this.selectedFile.name, this.selectedFile.type, this.selectedFile.size);
    console.log('- CourseId:', courseId);
    console.log('- Title:', this.contentForm.get('title')?.value);
    console.log('- Type:', this.contentForm.get('fileType')?.value);
    
    for (const [key, value] of formData.entries()) {
      console.log(`FormData ${key}:`, value);
    }
    
    // Note: Removing Description as it's not in the backend CourseDataDto
    // const description = this.contentForm.get('description')?.value;
    // if (description) {
    //   formData.append('Description', description);
    // }

    const headers = this.getAuthHeaders();
    // Remove Content-Type for FormData - let browser set it
    delete headers['Content-Type'];

    this.http.post(`${this.apiUrl}/CourseData/upload`, formData, {
      headers: headers,
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * (event.loaded / (event.total || 1)));
        } else if (event instanceof HttpResponse) {
          this.uploadProgress = 100;
          this.showMessage('Content uploaded successfully!', 'success');
          this.contentAdded.emit(event.body);
          
          // Reset form after successful upload
          setTimeout(() => {
            this.resetForm();
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.uploading = false;
        this.uploadProgress = 0;
        
        let errorMessage = 'Failed to upload content. Please try again.';
        if (error.error?.errors) {
          // Handle validation errors
          const validationErrors = Object.keys(error.error.errors).map(key => 
            `${key}: ${error.error.errors[key].join(', ')}`
          ).join('\n');
          errorMessage = `Validation errors:\n${validationErrors}`;
          console.error('Validation errors:', error.error.errors);
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 413) {
          errorMessage = 'File size too large. Please select a smaller file.';
        } else if (error.status === 401) {
          errorMessage = 'You are not authorized to upload content.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid request. Please check your form data and try again.';
        }
        
        this.showMessage(errorMessage, 'danger');
      },
      complete: () => {
        this.uploading = false;
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // Helper methods
  getAcceptedFileTypes(): string {
    const fileType = this.contentForm.get('fileType')?.value;
    if (!fileType) return '*';
    
    const config = this.fileTypeConfig[fileType as keyof typeof this.fileTypeConfig];
    return config ? config.accept : '*';
  }

  getFileTypeDescription(): string {
    const fileType = this.contentForm.get('fileType')?.value;
    if (!fileType) return 'Any file type';
    
    const config = this.fileTypeConfig[fileType as keyof typeof this.fileTypeConfig];
    return config ? config.description : 'Any file type';
  }

  getFileIcon(fileType: string): string {
    // Determine icon based on file extension or content type
    const fileName = this.selectedFile?.name.toLowerCase() || '';
    
    // If fileType is provided, use it
    if (fileType === 'Video') {
      return 'fas fa-file-video';
    } else if (fileType === 'Document') {
      return 'fas fa-file-alt';
    }
    
    // Fallback: determine by file extension
    if (fileName.includes('.mp4') || fileName.includes('.avi') || fileName.includes('.mov') || 
        fileName.includes('.wmv') || fileName.includes('.flv') || fileName.includes('.webm') ||
        fileName.includes('.mkv') || fileName.includes('.m4v')) {
      return 'fas fa-file-video';
    }
    
    if (fileName.includes('.pdf') || fileName.includes('.doc') || fileName.includes('.docx') || 
        fileName.includes('.txt') || fileName.includes('.rtf') || fileName.includes('.ppt') || 
        fileName.includes('.pptx') || fileName.includes('.xls') || fileName.includes('.xlsx') ||
        fileName.includes('.csv')) {
      return 'fas fa-file-alt';
    }
    
    return 'fas fa-file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contentForm.controls).forEach(key => {
      const control = this.contentForm.get(key);
      control?.markAsTouched();
    });
  }

  private resetForm(): void {
    this.contentForm.reset();
    this.selectedFile = null;
    this.uploadProgress = 0;
    
    // Clear file input
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private showMessage(text: string, type: 'success' | 'danger'): void {
    this.message = text;
    this.messageType = type;
  }

  clearMessage(): void {
    this.message = '';
  }

  private getAuthHeaders(): any {
    const token = sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
} 