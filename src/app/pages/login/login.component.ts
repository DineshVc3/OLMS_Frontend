import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        const token = response.accessToken;
        const role = response.role;
        const userId = response.userId || response.id; // Get user ID from response

        // Store token, role, email, and user ID
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('role', role);
        sessionStorage.setItem('email', this.email);
        if (userId) {
          sessionStorage.setItem('userId', userId.toString());
        }

        console.log('Stored data:', {
          token: !!token,
          role: role,
          email: this.email,
          userId: userId
        });

        // Navigate based on role
        if (role === 'Admin') this.router.navigate(['/app-admin-dashboard']);
        else if (role === 'SuperAdmin') this.router.navigate(['/app-superadmin-dashboard']);
        else if (role === 'Instructor') this.router.navigate(['/app-instructor-dashboard']);
        else if (role === 'Learner') this.router.navigate(['/app-learner-dashboard']);
        else this.router.navigate(['/login']); // Default to login if role is unknown
      },
      error: (err) => {
        this.errorMessage = 'Invalid credentials. Please try again.';
      }
    });
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}

