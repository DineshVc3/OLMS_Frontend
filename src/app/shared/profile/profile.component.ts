import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { AppUser, UserUpdateDto, UserRole, NumericRoleMapping } from '../../models/user.model';

declare var bootstrap: any;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: AppUser | null = null;
  isEditing = false;
  isLoading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';
  private modal: any;

  editForm = {
    name: '',
    phoneNumber: '',
    email: ''
  };

  constructor(private profileService: ProfileService) {}

  ngOnInit(): void {
    this.loadUserProfile();

    setTimeout(() => {
      const modalElement = document.getElementById('profileModal');
      if (modalElement) {
        this.modal = new bootstrap.Modal(modalElement);
      }
    }, 100);
  }

  openModal(): void {
    this.modal?.show();
  }

  closeModal(): void {
    this.modal?.hide();
  }

  loadUserProfile(): void {
    this.user = this.profileService.getCurrentUserFromStorage();
    if (this.user) {
      this.resetEditForm();
    }

    const email = sessionStorage.getItem('email');
    if (email) {
      this.profileService.fetchAndUpdateCurrentUser(email);
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
    this.isEditing = true;
    this.resetEditForm();
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
      phonenumber: this.editForm.phoneNumber.trim()
    };

    try {
      await this.profileService.updateUser(updateData).toPromise();
    
      this.user.name = updateData.name ?? '';
      this.user.phoneNumber = updateData.phonenumber ?? '';
      this.user.modifiedAt = new Date().toISOString();
      this.profileService.updateCurrentUser(this.user);
    
      this.isEditing = false;
      this.showMessage('Profile updated successfully!', 'success');
    
      setTimeout(() => {
        this.clearMessage();
      }, 3000);
    } catch (error: any) {
      this.showMessage(
        error.error?.message || 'Failed to update profile. Please try again.',
        'error'
      );
    }
     finally {
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

    if (type === 'success') {
      // Message will be cleared after modal closes
    } else {
      setTimeout(() => this.clearMessage(), 3000);
    }
  }

  clearMessage(): void {
    this.message = '';
    this.messageType = '';
  }

  getUserId(): number | null {
    return this.user?.id || this.user?.userId || null;
  }

  private convertRole(role: UserRole | number | undefined): UserRole {
    if (typeof role === 'number') {
      return NumericRoleMapping[role as keyof typeof NumericRoleMapping] || UserRole.Learner;
    }
    return role || UserRole.Learner;
  }

  getRoleDisplayName(role: UserRole | number | undefined): string {
    const convertedRole = this.convertRole(role);
    switch (convertedRole) {
      case UserRole.SuperAdmin: return 'Super Administrator';
      case UserRole.Admin: return 'Administrator';
      case UserRole.Instructor: return 'Instructor';
      case UserRole.Learner: return 'Learner';
      default: return 'Unknown Role';
    }
  }

  getRoleBootstrapColor(role: UserRole | number | undefined): string {
    const convertedRole = this.convertRole(role);
    switch (convertedRole) {
      case UserRole.SuperAdmin: return 'danger';
      case UserRole.Admin: return 'warning';
      case UserRole.Instructor: return 'info';
      case UserRole.Learner: return 'success';
      default: return 'secondary';
    }
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';

    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }
}
