import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  message = '';
  isSuccess = false;
  isError = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.email || !this.isValidEmail(this.email)) {
      this.showError('Please enter a valid email address.');
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showSuccess('Password reset link has been sent to your email address. Please check your inbox.');
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 404) {
          this.showError('Email address not found. Please check and try again.');
        } else {
          this.showError('Something went wrong. Please try again later.');
        }
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  goBackToLogin() {
    this.router.navigate(['']);
  }
} 