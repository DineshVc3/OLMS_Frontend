import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { AppUser, UserRole, CreateUserRequest, NumericRoleMapping } from '../../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: AppUser[] = [];
  filteredUsers: AppUser[] = [];
  selectedRole: UserRole = UserRole.Learner;
  currentUserRole: string = '';
  isLoading = false;
  searchTerm = '';
  
  // Navigation and view control
  activeView: string = 'view-all'; // 'register', 'view-all', 'view-by-role', 'update', 'delete'
  availableViews: string[] = [];
  showRoleFilter: boolean = false; // Control whether to show role filter
  
  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showToggleModal = false;
  selectedUser: AppUser | null = null;
  toggleAction: 'activate' | 'deactivate' = 'activate';
  
  // Messages
  message = '';
  messageType: 'success' | 'error' | '' = '';
  
  // Create form
  createForm: CreateUserRequest = {
    name: '',
    email: '',
    role: UserRole.Learner,
    phoneNumber: '',
    password: ''
  };
  
  // Edit form
  editForm = {
    email: '',
    name: '',
    phonenumber: ''
  };
  
  // Available roles based on current user permissions
  availableRoles: UserRole[] = [];
  
  // Enum reference for template
  UserRole = UserRole;

  constructor(private profileService: ProfileService) {}

  // Helper method to debug JWT token
  private debugJWTToken(): void {
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT payload (without verification - just for debugging)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Token Payload:', payload);
        console.log('Role claim:', payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role);
        console.log('Email claim:', payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email);
        console.log('NameIdentifier claim:', payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub);
      } catch (error) {
        console.error('Error decoding JWT token:', error);
      }
    }
  }

  ngOnInit(): void {
    this.currentUserRole = this.profileService.getCurrentUserRole() || '';
    this.setAvailableRoles();
    this.setAvailableViews();
    this.debugJWTToken(); // Add debugging
    this.loadUsers();
  }

  private setAvailableRoles(): void {
    // Set available roles based on user role
    if (this.currentUserRole === 'SuperAdmin') {
      this.availableRoles = [UserRole.Admin, UserRole.Instructor, UserRole.Learner];
    } else if (this.currentUserRole === 'Admin') {
      this.availableRoles = [UserRole.Instructor, UserRole.Learner];
      this.selectedRole = UserRole.Learner; // Default to Learner for Admin
    }
    console.log('Available roles for', this.currentUserRole, ':', this.availableRoles);
  }

  private setAvailableViews(): void {
    // Set available views based on user role
    if (this.currentUserRole === 'SuperAdmin') {
      this.availableViews = ['register', 'view-all', 'view-by-role', 'update', 'delete'];
    } else if (this.currentUserRole === 'Admin') {
      this.availableViews = ['register', 'view-all', 'view-by-role', 'update', 'delete'];
    }
  }

  // Method to be called from parent component when navbar submenu is selected
  setActiveView(submenuItem: string): void {
    // Close all modals first to prevent conflicts
    this.closeAllModals();
    
    switch (submenuItem.toLowerCase()) {
      case 'register user':
        this.activeView = 'register';
        this.showRoleFilter = false;
        // Don't auto-open modal here, let user control it
        break;
      case 'view all users':
        this.activeView = 'view-all';
        this.showRoleFilter = false;
        this.loadUsers();
        break;
      case 'view by role':
        this.activeView = 'view-by-role';
        this.showRoleFilter = true;
        this.loadUsers();
        break;
      case 'update user':
        this.activeView = 'update';
        this.showRoleFilter = false;
        this.loadUsers();
        break;
      case 'delete user':
        this.activeView = 'delete';
        this.showRoleFilter = false;
        this.loadUsers();
        break;
      case 'activate/deactivate user':
        this.activeView = 'toggle-status';
        this.showRoleFilter = false;
        this.loadUsers();
        break;
      default:
        this.activeView = 'view-all';
        this.showRoleFilter = false;
        this.loadUsers();
    }
  }

  // Helper method to close all modals
  private closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showToggleModal = false;
    this.selectedUser = null;
  }

  // Check if a specific view is active
  isViewActive(view: string): boolean {
    return this.activeView === view;
  }

  // Check if current view allows specific actions
  canShowCreateButton(): boolean {
    return this.activeView === 'view-all' || this.activeView === 'view-by-role' || this.activeView === 'register';
  }

  canShowEditButton(): boolean {
    return this.activeView === 'view-all' || this.activeView === 'view-by-role' || this.activeView === 'update';
  }

  canShowDeleteButton(): boolean {
    return this.activeView === 'view-all' || this.activeView === 'view-by-role' || this.activeView === 'delete';
  }

  canShowToggleButton(): boolean {
    return this.activeView === 'view-all' || this.activeView === 'view-by-role' || this.activeView === 'toggle-status';
  }

  // Toggle Status Modal
  openToggleModal(user: AppUser): void {
    this.selectedUser = user;
    this.toggleAction = user.isActive !== false ? 'deactivate' : 'activate';
    this.showToggleModal = true;
    this.clearMessage();
  }

  closeToggleModal(): void {
    this.showToggleModal = false;
    this.selectedUser = null;
  }

  toggleUserStatus(): void {
    if (!this.selectedUser) return;

    const newStatus = this.toggleAction === 'activate';
    this.isLoading = true;
    
    this.profileService.toggleUserStatus(this.selectedUser.email, newStatus).subscribe({
      next: (response: any) => {
        this.showMessage(`User ${this.toggleAction}d successfully!`, 'success');
        this.closeToggleModal();
        this.loadUsers();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error toggling user status:', error);
        let errorMessage = `Failed to ${this.toggleAction} user.`;
        if (error.status === 403) {
          errorMessage = `You do not have permission to ${this.toggleAction} this user.`;
        } else if (error.status === 404) {
          errorMessage = 'User not found.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        this.showMessage(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    
    // Use the new GetAllUsersByAccess endpoint for 'view-all' and most views
    if (this.activeView === 'view-all' || this.activeView === 'update' || this.activeView === 'delete') {
      this.loadAllUsersByAccess();
    } else if (this.activeView === 'view-by-role') {
      this.loadUsersByRole();
    } else {
      this.loadAllUsersByAccess(); // Default behavior
    }
  }

  // Load all users based on current user's access level (server-side filtering)
  loadAllUsersByAccess(): void {
    this.profileService.getAllUsersByAccess().subscribe({
      next: (users) => {
        this.users = users;
        this.filterUsers();
        this.isLoading = false;
        console.log('Loaded users by access:', users.length);
      },
      error: (error) => {
        console.error('Error loading users by access:', error);
        this.showMessage('Failed to load users.', 'error');
        this.isLoading = false;
      }
    });
  }

  // Load users by specific role (client-side filtering)
  loadUsersByRole(): void {
    if (!this.profileService.canManageRole(this.selectedRole)) {
      this.showMessage('You are not authorized to view users of this role.', 'error');
      this.isLoading = false;
      return;
    }

    this.profileService.getUsersByRole(this.selectedRole).subscribe({
      next: (users) => {
        this.users = users;
        this.filterUsers();
        this.isLoading = false;
        console.log('Loaded users by role:', this.selectedRole, users.length);
      },
      error: (error) => {
        console.error('Error loading users by role:', error);
        this.showMessage('Failed to load users.', 'error');
        this.isLoading = false;
      }
    });
  }

  onRoleChange(): void {
    // Only reload users when in view-by-role mode
    if (this.activeView === 'view-by-role') {
      this.loadUsers();
    }
  }

  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.phoneNumber.includes(term)
      );
    }
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  // Create User Modal
  openCreateModal(): void {
    this.createForm = {
      name: '',
      email: '',
      role: this.availableRoles.length > 0 ? this.availableRoles[0] : UserRole.Learner,
      phoneNumber: '',
      password: ''
    };
    this.showCreateModal = true;
    this.clearMessage();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm = {
      name: '',
      email: '',
      role: UserRole.Learner,
      phoneNumber: '',
      password: ''
    };
  }

  createUser(): void {
    if (!this.validateCreateForm()) {
      return;
    }

    // Ensure role is a string, not an enum object
    const userData = {
      name: this.createForm.name.trim(),
      email: this.createForm.email.trim().toLowerCase(),
      role: this.createForm.role as string, // Cast to string since UserRole enum values are strings
      phoneNumber: this.createForm.phoneNumber.trim(),
      password: this.createForm.password
    };

    console.log('Final user data being sent:', userData);
    console.log('Token exists:', !!sessionStorage.getItem('token'));
    console.log('User role:', sessionStorage.getItem('role'));

    this.isLoading = true;
    
    this.profileService.createUser(userData).subscribe({
      next: (response) => {
        this.showMessage('User created successfully!', 'success');
        this.closeCreateModal();
        this.loadUsers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating user:', error);
        console.error('Error details:', error.error);
        
        // Extract detailed validation errors
        let errorMessage = 'Failed to create user.';
        if (error.error?.errors) {
          const validationErrors = [];
          for (const field in error.error.errors) {
            const fieldErrors = error.error.errors[field];
            if (Array.isArray(fieldErrors)) {
              validationErrors.push(`${field}: ${fieldErrors.join(', ')}`);
            }
          }
          if (validationErrors.length > 0) {
            errorMessage = `Validation errors: ${validationErrors.join('; ')}`;
          }
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.title) {
          errorMessage = error.error.title;
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to create users.';
        }
        
        this.showMessage(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  // Edit User Modal
  openEditModal(user: AppUser): void {
    this.selectedUser = user;
    this.editForm = {
      email: user.email,
      name: user.name,
      phonenumber: user.phoneNumber
    };
    this.showEditModal = true;
    this.clearMessage();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
    this.editForm = {
      email: '',
      name: '',
      phonenumber: ''
    };
  }

  updateUser(): void {
    if (!this.validateEditForm()) {
      return;
    }

    this.isLoading = true;
    console.log('Updating user with data:', this.editForm);
    
    this.profileService.updateUser(this.editForm).subscribe({
      next: () => {
        this.showMessage('User updated successfully!', 'success');
        this.closeEditModal();
        this.loadUsers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating user:', error);
        console.error('Error details:', error.error);
        
        // Extract detailed validation errors
        let errorMessage = 'Failed to update user.';
        if (error.error?.errors) {
          const validationErrors = [];
          for (const field in error.error.errors) {
            const fieldErrors = error.error.errors[field];
            if (Array.isArray(fieldErrors)) {
              validationErrors.push(`${field}: ${fieldErrors.join(', ')}`);
            }
          }
          if (validationErrors.length > 0) {
            errorMessage = `Validation errors: ${validationErrors.join('; ')}`;
          }
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Unauthorized. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to update this user.';
        }
        
        this.showMessage(errorMessage, 'error');
        this.isLoading = false;
      }
    });
  }

  // Delete User Modal
  openDeleteModal(user: AppUser): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
    this.clearMessage();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  deleteUser(): void {
    if (!this.selectedUser) return;

    this.isLoading = true;
    this.profileService.deleteUser(this.selectedUser.email).subscribe({
      next: () => {
        this.showMessage('User deleted successfully!', 'success');
        this.closeDeleteModal();
        this.loadUsers();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.showMessage(error.error?.message || 'Failed to delete user.', 'error');
        this.isLoading = false;
      }
    });
  }

  // Utility methods
  getRoleDisplayName(role: UserRole | number): string {
    if (typeof role === 'number') {
      const convertedRole = NumericRoleMapping[role as keyof typeof NumericRoleMapping];
      return convertedRole || 'Unknown';
    }
    
    switch (role) {
      case UserRole.SuperAdmin:
        return 'Super Administrator';
      case UserRole.Admin:
        return 'Administrator';
      case UserRole.Instructor:
        return 'Instructor';
      case UserRole.Learner:
        return 'Learner';
      default:
        return role || 'Unknown';
    }
  }

  getRoleColor(role: UserRole | number): string {
    if (typeof role === 'number') {
      const convertedRole = NumericRoleMapping[role as keyof typeof NumericRoleMapping];
      role = convertedRole || UserRole.Learner;
    }
    
    switch (role) {
      case UserRole.SuperAdmin:
        return 'role-superadmin';
      case UserRole.Admin:
        return 'role-admin';
      case UserRole.Instructor:
        return 'role-instructor';
      case UserRole.Learner:
        return 'role-learner';
      default:
        return 'role-default';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  getUserId(user: AppUser): number | string {
    return user.id || user.userId || 'N/A';
  }

  // Validation methods
  validateCreateForm(): boolean {
    if (!this.createForm.name.trim()) {
      this.showMessage('Name is required.', 'error');
      return false;
    }
    
    if (!this.createForm.email.trim() || !this.isValidEmail(this.createForm.email)) {
      this.showMessage('Valid email is required.', 'error');
      return false;
    }
    
    if (!this.createForm.phoneNumber.trim()) {
      this.showMessage('Phone number is required.', 'error');
      return false;
    }
    
    if (!this.createForm.password.trim() || this.createForm.password.length < 6) {
      this.showMessage('Password must be at least 6 characters.', 'error');
      return false;
    }
    
    if (!this.createForm.role) {
      this.showMessage('Role is required.', 'error');
      return false;
    }
    
    console.log('Form validation passed. Role:', this.createForm.role, 'Type:', typeof this.createForm.role);
    return true;
  }

  validateEditForm(): boolean {
    if (!this.editForm.name.trim()) {
      this.showMessage('Name is required.', 'error');
      return false;
    }
    
    if (!this.editForm.phonenumber.trim()) {
      this.showMessage('Phone number is required.', 'error');
      return false;
    }
    
    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generatePassword(): void {
    const length = 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    this.createForm.password = password;
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
  trackByUserId(index: number, user: AppUser): any {
    return user.id || user.userId || user.email;
  }
} 