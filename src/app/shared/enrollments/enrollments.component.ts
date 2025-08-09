import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnrollmentService, CourseAssignmentItem, ExistingAssignment } from '../../services/enrollment.service';

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enrollments.component.html',
  styleUrls: ['./enrollments.component.css']
})
export class EnrollmentsComponent implements OnInit {
  currentUserRole: string = '';
  isLoading = false;
  
  // Navigation and view control
  activeView: string = 'enrollment-management'; // 'enrollment-management', 'view-enrollments', 'view-assignments'
  
  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showBulkModal = false;
  
  // Form data
  selectedRole: 'Instructor' | 'Learner' = 'Learner';
  singleAssignment: CourseAssignmentItem = {
    userEmail: '',
    courseTitle: ''
  };
  
  // Bulk assignment
  bulkAssignments: CourseAssignmentItem[] = [];
  bulkText: string = '';
  
  // Edit form
  editAssignment: ExistingAssignment | null = null;
  editForm = {
    userEmail: '',
    courseTitle: '',
    newCourseTitle: ''
  };
  
  // Data lists
  studentEnrollments: ExistingAssignment[] = [];
  instructorAssignments: ExistingAssignment[] = [];
  filteredData: ExistingAssignment[] = [];
  availableUsers: any[] = [];
  availableCourses: any[] = [];
  
  // Search and filter
  searchTerm = '';
  
  // Messages
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(private enrollmentService: EnrollmentService) {}

  ngOnInit(): void {
    this.currentUserRole = sessionStorage.getItem('role') || '';
    this.loadData();
    this.loadAvailableUsers();
  }

  // Method to refresh all data
  refreshData(): void {
    this.clearMessage();
    this.loadData();
    this.loadAvailableUsers();
  }

  // Load available users based on selected role
  loadAvailableUsers(): void {
    console.log(`🔍 Loading available users for role: ${this.selectedRole}`);
    this.enrollmentService.getAvailableUsers(this.selectedRole).subscribe({
      next: (users: any[]) => {
        this.availableUsers = users;
        console.log(`✅ Loaded ${users.length} ${this.selectedRole}(s):`, users);
        
        if (users.length === 0) {
          console.warn(`⚠️ No ${this.selectedRole}s found in the system. Check your database.`);
        }
              },
        error: (error: any) => {
          console.error('❌ Error loading available users:', error);
          this.availableUsers = [];
        }
    });
  }

  // Navigation methods
  setActiveView(view: string): void {
    this.activeView = view;
    this.clearMessage();
    this.closeAllModals();
    
    switch (view) {
      case 'student-enrollment':
      case 'enroll student':
        this.activeView = 'enrollment-management';
        this.selectedRole = 'Learner';
        break;
      case 'instructor-assignment':
      case 'assign instructor':
        this.activeView = 'enrollment-management';
        this.selectedRole = 'Instructor';
        break;
      case 'view-enrollments':
      case 'view student enrollments':
        this.activeView = 'view-enrollments';
        this.selectedRole = 'Learner';
        this.loadEnrollments();
        break;
      case 'view-assignments':
      case 'view instructor assignments':
        this.activeView = 'view-assignments';
        this.selectedRole = 'Instructor';
        this.loadAssignments();
        break;
      default:
        this.activeView = 'enrollment-management';
        this.selectedRole = 'Learner';
    }
  }

  // Data loading methods
  loadData(): void {
    this.loadEnrollments();
    this.loadAssignments();
  }

  loadEnrollments(): void {
    this.enrollmentService.getAllCourseAssignments('Learner').subscribe({
      next: (data) => {
        this.studentEnrollments = data || [];
        if (this.activeView === 'view-enrollments') {
          this.filteredData = [...this.studentEnrollments];
          this.filterData();
        }
      },
      error: (error) => {
        console.log('Student enrollments response:', error);
        this.studentEnrollments = [];
        if (this.activeView === 'view-enrollments') {
          this.filteredData = [];
        }
        
        // Handle 404 as empty data (no assignments found)
        if (error.status === 404) {
          console.log('No student enrollments found - treating as empty data');
          return; // Don't show error message for empty data
        }
        
        // Show error only for actual server errors
        this.showMessage('Failed to load student enrollments.', 'error');
      }
    });
  }

  loadAssignments(): void {
    this.enrollmentService.getAllCourseAssignments('Instructor').subscribe({
      next: (data) => {
        this.instructorAssignments = data || [];
        if (this.activeView === 'view-assignments') {
          this.filteredData = [...this.instructorAssignments];
          this.filterData();
        }
      },
      error: (error) => {
        console.log('Instructor assignments response:', error);
        this.instructorAssignments = [];
        if (this.activeView === 'view-assignments') {
          this.filteredData = [];
        }
        
        // Handle 404 as empty data (no assignments found)
        if (error.status === 404) {
          console.log('No instructor assignments found - treating as empty data');
          return; // Don't show error message for empty data
        }
        
        // Show error only for actual server errors
        this.showMessage('Failed to load instructor assignments.', 'error');
      }
    });
  }

  // Filter and search
  filterData(): void {
    const sourceData = this.selectedRole === 'Learner' ? this.studentEnrollments : this.instructorAssignments;
    
    if (!this.searchTerm.trim()) {
      this.filteredData = [...sourceData];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredData = sourceData.filter(item => 
        item.userEmail.toLowerCase().includes(term) ||
        item.courseTitle.toLowerCase().includes(term)
      );
    }
  }

  onSearchChange(): void {
    this.filterData();
  }

  // Modal management
  closeAllModals(): void {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showBulkModal = false;
    this.editAssignment = null;
    this.resetForms();
  }

  resetForms(): void {
    this.singleAssignment = { userEmail: '', courseTitle: '' };
    this.bulkText = '';
    this.bulkAssignments = [];
    this.editForm = { userEmail: '', courseTitle: '', newCourseTitle: '' };
  }

  // Single assignment methods
  openAddModal(): void {
    this.resetForms();
    this.showAddModal = true;
    this.clearMessage();
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.resetForms();
  }

  // Convert frontend role to backend format if needed
  private getRoleForBackend(role: 'Instructor' | 'Learner'): 'Instructor' | 'Learner' {
    // Your backend expects string values that match enum names
    return role; // 'Instructor' or 'Learner'
  }

  addSingleAssignment(): void {
    if (!this.validateSingleAssignment()) {
      return;
    }

    const assignment = {
      role: this.getRoleForBackend(this.selectedRole),
      assignments: [this.singleAssignment]
    };



    this.isLoading = true;
    this.enrollmentService.addCourseAssignments(assignment).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showMessage(`${this.selectedRole} assigned successfully!`, 'success');
          this.closeAddModal();
          this.loadData();
        } else {
          this.showMessage(response.message || 'Assignment failed.', 'error');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error adding assignment:', error);
        let errorMessage = 'Failed to add assignment.';
        
        if (error.status === 400 && error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
        
        this.showMessage(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  // Bulk assignment methods
  openBulkModal(): void {
    this.resetForms();
    this.showBulkModal = true;
    this.clearMessage();
  }

  closeBulkModal(): void {
    this.showBulkModal = false;
    this.resetForms();
  }

  parseBulkText(): void {
    const lines = this.bulkText.trim().split('\n');
    this.bulkAssignments = [];
    
    for (const line of lines) {
      const parts = line.trim().split(',');
      if (parts.length >= 2) {
        this.bulkAssignments.push({
          userEmail: parts[0].trim(),
          courseTitle: parts[1].trim()
        });
      }
    }
  }

  addBulkAssignments(): void {
    this.parseBulkText();
    
    if (this.bulkAssignments.length === 0) {
      this.showMessage('No valid assignments found in the text.', 'error');
      return;
    }

    const assignment = {
      role: this.selectedRole,
      assignments: this.bulkAssignments
    };

    this.isLoading = true;
    this.enrollmentService.addCourseAssignments(assignment).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showMessage(`${this.bulkAssignments.length} ${this.selectedRole}(s) assigned successfully!`, 'success');
          this.closeBulkModal();
          this.loadData();
        } else {
          this.showMessage(response.message || 'Bulk assignment failed.', 'error');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error adding bulk assignments:', error);
        this.showMessage(error.error?.message || 'Failed to add bulk assignments.', 'error');
        this.isLoading = false;
      }
    });
  }

  // Edit assignment methods
  openEditModal(assignment: ExistingAssignment): void {
    this.editAssignment = assignment;
    this.editForm = {
      userEmail: assignment.userEmail,
      courseTitle: assignment.courseTitle,
      newCourseTitle: assignment.courseTitle
    };
    this.showEditModal = true;
    this.clearMessage();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editAssignment = null;
    this.resetForms();
  }

  updateAssignment(): void {
    if (!this.editAssignment || !this.editForm.newCourseTitle.trim()) {
      this.showMessage('Course title is required.', 'error');
      return;
    }

    this.isLoading = true;
    this.enrollmentService.updateCourseAssignment(
      this.selectedRole,
      this.editForm.userEmail,
      this.editForm.newCourseTitle
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Assignment updated successfully!', 'success');
          this.closeEditModal();
          this.loadData();
        } else {
          this.showMessage(response.message || 'Update failed.', 'error');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating assignment:', error);
        this.showMessage(error.error?.message || 'Failed to update assignment.', 'error');
        this.isLoading = false;
      }
    });
  }

  // Delete assignment methods
  openDeleteModal(assignment: ExistingAssignment): void {
    this.editAssignment = assignment;
    this.showDeleteModal = true;
    this.clearMessage();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.editAssignment = null;
  }

  deleteAssignment(): void {
    if (!this.editAssignment) return;

    this.isLoading = true;
    this.enrollmentService.deleteCourseAssignment(
      this.selectedRole,
      this.editAssignment.userEmail
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Assignment deleted successfully!', 'success');
          this.closeDeleteModal();
          this.loadData();
        } else {
          this.showMessage(response.message || 'Delete failed.', 'error');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting assignment:', error);
        this.showMessage(error.error?.message || 'Failed to delete assignment.', 'error');
        this.isLoading = false;
      }
    });
  }

  // Validation methods
  validateSingleAssignment(): boolean {
    if (!this.singleAssignment.userEmail.trim()) {
      this.showMessage('Email is required.', 'error');
      return false;
    }
    
    if (!this.isValidEmail(this.singleAssignment.userEmail)) {
      this.showMessage('Valid email is required.', 'error');
      return false;
    }
    
    if (!this.singleAssignment.courseTitle.trim()) {
      this.showMessage('Course title is required.', 'error');
      return false;
    }
    
    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Utility methods
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

  getRoleDisplayName(): string {
    return this.selectedRole === 'Learner' ? 'Student' : 'Instructor';
  }

  getActionDisplayName(): string {
    return this.selectedRole === 'Learner' ? 'Enroll' : 'Assign';
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
  trackByEmail(index: number, assignment: ExistingAssignment): string {
    return assignment.userEmail;
  }
} 