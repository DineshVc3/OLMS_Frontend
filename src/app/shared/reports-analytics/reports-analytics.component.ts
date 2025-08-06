import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsService, SuperAdminReportsDto, AdminReportsDto, InstructorReportsDto, LearnerReportsDto } from '../../services/reports.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reports-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-analytics.component.html',
  styleUrls: ['./reports-analytics.component.css']
})
export class ReportsAnalyticsComponent implements OnInit {
  currentRole: string = '';
  isLoading: boolean = false;
  error: string = '';

  // SuperAdmin Data
  superAdminReports?: SuperAdminReportsDto;

  // Admin Data
  adminReports?: AdminReportsDto;

  // Instructor Data
  instructorReports?: InstructorReportsDto;

  // Learner Data
  learnerReports?: LearnerReportsDto;

  constructor(
    private reportsService: ReportsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentRole = this.authService.getRole()?.toLowerCase() || '';
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading = true;
    this.error = '';

    switch (this.currentRole) {
      case 'superadmin':
        this.loadSuperAdminReports();
        break;
      case 'admin':
        this.loadAdminReports();
        break;
      case 'instructor':
        this.loadInstructorReports();
        break;
      case 'learner':
        this.loadLearnerReports();
        break;
      default:
        this.error = 'Unauthorized access';
        this.isLoading = false;
    }
  }

  private loadSuperAdminReports(): void {
    this.reportsService.getSuperAdminReports().subscribe({
      next: (reports) => {
        this.superAdminReports = reports;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading super admin reports:', error);
        this.error = 'Failed to load reports';
        this.isLoading = false;
      }
    });
  }

  private loadAdminReports(): void {
    // Admin reports are handled by the dedicated admin-reports component
    // which uses existing ProfileService and CourseService APIs
    console.log('Admin reports are loaded by the admin-reports component');
    this.isLoading = false;
  }

  private loadInstructorReports(): void {
    // Instructor reports are handled by the dedicated instructor-reports component
    // which uses existing CourseService APIs
    console.log('Instructor reports are loaded by the instructor-reports component');
    this.isLoading = false;
  }

  private loadLearnerReports(): void {
    // Learner reports are handled by the dedicated learner-reports component
    // which uses existing LearnerService APIs
    console.log('Learner reports are loaded by the learner-reports component');
    this.isLoading = false;
  }

  getProgressStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'in progress': return 'status-in-progress';
      case 'not started': return 'status-not-started';
      default: return 'status-default';
    }
  }

  getCompletionRateClass(rate: number): string {
    if (rate >= 80) return 'completion-high';
    if (rate >= 50) return 'completion-medium';
    return 'completion-low';
  }

  refresh(): void {
    this.loadReports();
  }
} 