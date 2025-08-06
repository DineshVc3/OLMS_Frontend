import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService, Course, CourseDto } from '../../services/course.service';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-management.component.html',
  styleUrls: ['./course-management.component.css']
})
export class CourseManagementComponent implements OnInit {
  // Data properties
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  searchTerm = '';
  isLoading = false;
  currentUserRole = '';

  // Navigation and view control
  activeView: string = 'course-list'; // 'course-list', 'add-course', 'edit-course', 'course-details'
  
  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showDetailsModal = false;
  selectedCourse: Course | null = null;
  
  // Form data
  createForm: CourseDto = {
    title: '',
    description: '',
    syllabus: '',
    prerequisites: ''
  };
  
  editForm: CourseDto = {
    title: '',
    description: '',
    syllabus: '',
    prerequisites: ''
  };
  
  // Messages
  message = '';
  messageType: 'success' | 'error' | '' = '';
  
  // Statistics
  stats = {
    totalCourses: 0,
    recentCourses: 0,
    popularCourses: 0
  };

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.currentUserRole = this.courseService.getCurrentUserRole();
    this.loadCourses();
  }

  // ==================== DATA LOADING ====================
  
  loadCourses(): void {
    this.isLoading = true;
    this.courseService.getAllCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
        this.filteredCourses = [...courses];
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.showMessage('Failed to load courses.', 'error');
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.totalCourses = this.courses.length;
    
    // Recent courses (created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.stats.recentCourses = this.courses.filter(course => 
      new Date(course.createdAt) >= thirtyDaysAgo
    ).length;
    
    // For now, popular courses is just a placeholder
    this.stats.popularCourses = Math.floor(this.courses.length * 0.3);
  }

  // ==================== VIEW MANAGEMENT ====================
  
  setActiveView(view: string): void {
    this.activeView = view;
    this.closeAllModals();
    this.clearMessage();
    
    if (view === 'course-list') {
      this.loadCourses();
    }
  }

  closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showDetailsModal = false;
    this.selectedCourse = null;
  }

  // ==================== SEARCH AND FILTER ====================
  
  onSearchChange(): void {
    this.filterCourses();
  }

  filterCourses(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCourses = [...this.courses];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredCourses = this.courses.filter(course =>
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.prerequisites.toLowerCase().includes(term)
      );
    }
  }

  // ==================== CREATE COURSE ====================
  
  openCreateModal(): void {
    this.createForm = {
      title: '',
      description: '',
      syllabus: '',
      prerequisites: ''
    };
    this.showCreateModal = true;
    this.clearMessage();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm = {
      title: '',
      description: '',
      syllabus: '',
      prerequisites: ''
    };
  }

  createCourse(): void {
    if (!this.validateCreateForm()) {
      return;
    }

    this.isLoading = true;
    this.courseService.addCourse(this.createForm).subscribe({
      next: (response) => {
        this.showMessage('Course created successfully!', 'success');
        this.closeCreateModal();
        this.loadCourses();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating course:', error);
        let errorMessage = 'Failed to create course.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to create courses.';
        }
        this.showMessage(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  // ==================== EDIT COURSE ====================
  
  openEditModal(course: Course): void {
    this.selectedCourse = course;
    this.editForm = {
      title: course.title,
      description: course.description,
      syllabus: course.syllabus,
      prerequisites: course.prerequisites
    };
    this.showEditModal = true;
    this.clearMessage();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedCourse = null;
    this.editForm = {
      title: '',
      description: '',
      syllabus: '',
      prerequisites: ''
    };
  }

  updateCourse(): void {
    if (!this.selectedCourse || !this.validateEditForm()) {
      return;
    }

    this.isLoading = true;
    this.courseService.updateCourse(this.selectedCourse.courseId, this.editForm).subscribe({
      next: (response) => {
        this.showMessage('Course updated successfully!', 'success');
        this.closeEditModal();
        this.loadCourses();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating course:', error);
        let errorMessage = 'Failed to update course.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 404) {
          errorMessage = 'Course not found.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to update this course.';
        }
        this.showMessage(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  // ==================== DELETE COURSE ====================
  
  openDeleteModal(course: Course): void {
    this.selectedCourse = course;
    this.showDeleteModal = true;
    this.clearMessage();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedCourse = null;
  }

  deleteCourse(): void {
    if (!this.selectedCourse) return;

    this.isLoading = true;
    this.courseService.deleteCourse(this.selectedCourse.courseId).subscribe({
      next: (response) => {
        this.showMessage('Course deleted successfully!', 'success');
        this.closeDeleteModal();
        this.loadCourses();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting course:', error);
        let errorMessage = 'Failed to delete course.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 404) {
          errorMessage = 'Course not found.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to delete this course.';
        }
        this.showMessage(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  // ==================== COURSE DETAILS ====================
  
  openDetailsModal(course: Course): void {
    this.selectedCourse = course;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedCourse = null;
  }

  // ==================== VALIDATION ====================
  
  validateCreateForm(): boolean {
    if (!this.createForm.title.trim()) {
      this.showMessage('Course title is required.', 'error');
      return false;
    }

    if (!this.createForm.description.trim()) {
      this.showMessage('Course description is required.', 'error');
      return false;
    }

    if (!this.createForm.syllabus.trim()) {
      this.showMessage('Course syllabus is required.', 'error');
      return false;
    }

    return true;
  }

  validateEditForm(): boolean {
    if (!this.editForm.title.trim()) {
      this.showMessage('Course title is required.', 'error');
      return false;
    }

    if (!this.editForm.description.trim()) {
      this.showMessage('Course description is required.', 'error');
      return false;
    }

    if (!this.editForm.syllabus.trim()) {
      this.showMessage('Course syllabus is required.', 'error');
      return false;
    }

    return true;
  }

  // ==================== UTILITY METHODS ====================
  
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

  // Track by function for better performance
  trackByCourseId(index: number, course: Course): any {
    return course.courseId;
  }
} 