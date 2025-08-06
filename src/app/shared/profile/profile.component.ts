import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { AppUser, UserUpdateDto, UserRole, NumericRoleMapping } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: AppUser | null = null;
  isEditing: boolean = false;
  isLoading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' | '' = '';

  // Edit form data
  editForm = {
    name: '',
    phoneNumber: '',
    email: ''
  };

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    // Load from localStorage first for immediate display
    this.user = this.profileService.getCurrentUserFromStorage();
    if (this.user) {
      this.resetEditForm();
    }
    
    // Then fetch fresh data from API
    const email = localStorage.getItem('email');
    if (email) {
      this.profileService.fetchAndUpdateCurrentUser(email);
      
      // Subscribe to updates
      this.profileService.currentUser$.subscribe(user => {
        if (user) {
          this.user = user;
          this.resetEditForm();
        }
      });
    }
  }

  resetEditForm(): void {
    if (this.user) {
      this.editForm = {
        name: this.user.name || '',
        phoneNumber: this.user.phoneNumber || '',
        email: this.user.email || ''
      };
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.resetEditForm();
    }
    this.clearMessage();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.resetEditForm();
    this.clearMessage();
  }

  async saveProfile(): Promise<void> {
    if (!this.user || !this.isValidForm()) {
      this.showMessage('Please fill in all required fields.', 'error');
      return;
    }

    this.isLoading = true;
    this.clearMessage();

    const updateData: UserUpdateDto = {
      email: this.user.email,
      name: this.editForm.name.trim(),
      phonenumber: this.editForm.phoneNumber.trim() // Use phonenumber to match backend API
    };

    try {
      await this.profileService.updateUser(updateData).toPromise();
      
      // Update local user data
      if (this.user) {
        this.user.name = this.editForm.name.trim();
        this.user.phoneNumber = this.editForm.phoneNumber.trim();
        this.user.modifiedAt = new Date().toISOString();
        
        // Update in localStorage and service
        this.profileService.updateCurrentUser(this.user);
      }

      this.isEditing = false;
      this.showMessage('Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.showMessage(
        error.error?.message || 'Failed to update profile. Please try again.',
        'error'
      );
    } finally {
      this.isLoading = false;
    }
  }

  isValidForm(): boolean {
    return this.editForm.name.trim().length > 0 && 
           this.editForm.phoneNumber.trim().length > 0;
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    
    // Auto-clear success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => this.clearMessage(), 3000);
    }
  }

  clearMessage(): void {
    this.message = '';
    this.messageType = '';
  }

  // Helper method to get user ID (handles both id and userId)
  getUserId(): number | null {
    if (!this.user) return null;
    return this.user.id || this.user.userId || null;
  }

  // Helper method to convert numeric role to UserRole enum
  private convertRole(role: UserRole | number): UserRole {
    if (typeof role === 'number') {
      return NumericRoleMapping[role as keyof typeof NumericRoleMapping] || UserRole.Learner;
    }
    return role;
  }

  getRoleDisplayName(role: UserRole | number): string {
    const convertedRole = this.convertRole(role);
    switch (convertedRole) {
      case UserRole.SuperAdmin:
        return 'Super Administrator';
      case UserRole.Admin:
        return 'Administrator';
      case UserRole.Instructor:
        return 'Instructor';
      case UserRole.Learner:
        return 'Learner';
      default:
        return convertedRole || 'Unknown Role';
    }
  }

  getRoleColor(role: UserRole | number): string {
    const convertedRole = this.convertRole(role);
    switch (convertedRole) {
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

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }
} 