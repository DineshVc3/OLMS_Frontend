import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  message = '';
  isSuccess = false;
  isError = false;
  isTokenValid = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get token from URL query parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.isTokenValid = true;
      } else {
        this.showError('Invalid or missing reset token.');
      }
    });
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showSuccess('Your password has been reset successfully! You can now login with your new password.');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Reset Password Error:', error);
        console.error('Error Status:', error.status);
        console.error('Error Message:', error.error);
        console.error('Error Details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        
        if (error.status === 400) {
          // Show the actual error message from backend if available
          const backendMessage = error.error?.message || error.error || 'Invalid or expired token. Please request a new password reset.';
          this.showError(backendMessage);
        } else {
          this.showError('Something went wrong. Please try again later.');
        }
      }
    });
  }

  validateForm(): boolean {
    if (!this.password) {
      this.showError('Please enter a new password.');
      return false;
    }

    if (this.password.length < 6) {
      this.showError('Password must be at least 6 characters long.');
      return false;
    }

    if (!this.confirmPassword) {
      this.showError('Please confirm your password.');
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.showError('Passwords do not match.');
      return false;
    }

    return true;
  }

  getPasswordStrength(): string {
    if (!this.password) return '';
    
    if (this.password.length < 6) return 'weak';
    if (this.password.length < 8) return 'medium';
    if (this.password.length >= 8 && /[A-Z]/.test(this.password) && /[0-9]/.test(this.password)) {
      return 'strong';
    }
    return 'medium';
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  showSuccess(message: string) {
    this.message = message;
    this.isSuccess = true;
    this.isError = false;
  }

  showError(message: string) {
    this.message = message;
    this.isError = true;
    this.isSuccess = false;
  }

  clearMessages() {
    this.message = '';
    this.isSuccess = false;
    this.isError = false;
  }

  goToLogin() {
    this.router.navigate(['']);
  }

  requestNewReset() {
    this.router.navigate(['/forgot-password']);
  }
} 