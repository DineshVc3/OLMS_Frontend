import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';
import { ProfileComponent } from "../profile/profile.component";

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, ProfileComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() profileToggle = new EventEmitter<boolean>();
  
  isMenuOpen = false;
  isLoginOpen = false;
  isProfileOpen = false;
  isLogged = false;
  
  private slideshowInterval: any;
  currentSlide = 0;

  // Login form properties
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.startSlideshow();

  }

  ngOnDestroy() {
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  openProfile(): void {
    this.isProfileOpen = !this.isProfileOpen;
    this.isLogged=!this.isLogged; // Toggle logged-in state
    console.log('is toggle:', this.isLogged+"profile open:", this.isProfileOpen);
    this.profileToggle.emit(this.isProfileOpen);
  }

  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleLogin() {
    this.isLoginOpen = !this.isLoginOpen;
    // Clear form when closing
    if (!this.isLoginOpen) {
      this.email = '';
      this.password = '';
      this.errorMessage = '';
    }
  }

  login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        const token = response.accessToken;
        const role = response.role;

        // Store token and role
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);

        // Close login panel
        this.isLoginOpen = false;
        this.email = '';
        this.password = '';
        this.errorMessage = '';

        // Navigate based on role
        if (role === 'Admin') this.router.navigate(['/app-admin-dashboard']);
        else if (role === 'SuperAdmin') this.router.navigate(['/app-superadmin-dashboard']);
        else if (role === 'Instructor') this.router.navigate(['/app-instructor-dashboard']);
        else if (role === 'Learner') this.router.navigate(['/app-learner-dashboard']);
        else this.router.navigate(['/']); // Default to login if role is unknown
      },
      error: (err) => {
        this.errorMessage = 'Invalid credentials. Please try again.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  requestNewReset() {
    this.router.navigate(['/forgot-password']);
  }

  private startSlideshow() {
    this.slideshowInterval = setInterval(() => {
      const slides = document.querySelectorAll('.slide');
      if (slides.length > 0) {
        slides[this.currentSlide].classList.remove('active');
        this.currentSlide = (this.currentSlide + 1) % slides.length;
        slides[this.currentSlide].classList.add('active');
      }
    }, 3000); // Change slide every 3 seconds
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    this.isLogged=false;
    return this.authService.isLoggedIn();
  }

  // Get current user role
  getCurrentRole(): string | null {
    return this.authService.getRole();
  }

  // Logout functionality
  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.isProfileOpen = false; // Close profile dropdown on logout
      this.isLogged = false; // Reset logged-in state
      console.log('User logged out.');
      
    }
  }
}
