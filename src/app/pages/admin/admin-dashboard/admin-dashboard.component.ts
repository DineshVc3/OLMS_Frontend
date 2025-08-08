import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { ProfileComponent } from '../../../shared/profile/profile.component';
import { UserManagementComponent } from '../../../shared/user-management/user-management.component';
import { EnrollmentsComponent } from '../../../shared/enrollments/enrollments.component';
import { CourseManagementComponent } from '../../../shared/course-management/course-management.component';
import { AdminReportsComponent } from '../../../shared/reports-analytics/admin-reports.component';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, SidebarComponent,  ProfileComponent, UserManagementComponent, EnrollmentsComponent, CourseManagementComponent, AdminReportsComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  @ViewChild(UserManagementComponent) userManagementComponent!: UserManagementComponent;
  @ViewChild(EnrollmentsComponent) enrollmentsComponent!: EnrollmentsComponent;
  @ViewChild(CourseManagementComponent) courseManagementComponent!: CourseManagementComponent;
  
  role: string = '';
  selectedSidebarItem: string = '';
  isCollapsed: boolean = false;
  showProfile: boolean = false;
  showUserManagement: boolean = false;
  showEnrollments: boolean = false;
  showCourseManagement: boolean = false;
  showReports: boolean = false;

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      this.role = sessionStorage.getItem('role') || '';
    }

    // Subscribe to sidebar collapse state
    this.sidebarService.isCollapsed$.subscribe(collapsed => {
      this.isCollapsed = collapsed;
    });
  }

  onMenuSelect(item: string): void {
    this.selectedSidebarItem = item;
    this.showProfile = false; // Hide profile when selecting menu items
    
    // Show appropriate component for specific menu items
    this.showUserManagement = item.toLowerCase() === 'user management';
    this.showEnrollments = item.toLowerCase() === 'enrollment' || item.toLowerCase() === 'enrollments';
    this.showCourseManagement = item.toLowerCase() === 'course management';
    this.showReports = item.toLowerCase() === 'reports';
  }

  onProfileToggle(show: boolean): void {
    this.showProfile = show;
    if (show) {
      this.selectedSidebarItem = ''; // Clear sidebar selection when showing profile
      this.showUserManagement = false; // Hide user management when showing profile
      this.showEnrollments = false; // Hide enrollments when showing profile
      this.showCourseManagement = false; // Hide course management when showing profile
      this.showReports = false; // Hide reports when showing profile
    }
  }

  onSubmenuSelect(submenuItem: string): void {
    // Handle submenu for user management
    if (this.showUserManagement && this.userManagementComponent) {
      this.userManagementComponent.setActiveView(submenuItem);
    }
    // Handle submenu for enrollments
    else if (this.showEnrollments && this.enrollmentsComponent) {
      this.setEnrollmentView(submenuItem);
    }
    // Handle submenu for course management
    else if (this.showCourseManagement && this.courseManagementComponent) {
      this.setCourseManagementView(submenuItem);
    }
  }

  private setEnrollmentView(submenuItem: string): void {
    switch (submenuItem.toLowerCase()) {
      case 'enroll student':
        this.enrollmentsComponent.setActiveView('enroll student');
        break;
      case 'assign instructor':
        this.enrollmentsComponent.setActiveView('assign instructor');
        break;
      case 'view student enrollments':
        this.enrollmentsComponent.setActiveView('view student enrollments');
        break;
      case 'view instructor assignments':
        this.enrollmentsComponent.setActiveView('view instructor assignments');
        break;
      default:
        this.enrollmentsComponent.setActiveView('enroll student');
    }
  }

  private setCourseManagementView(submenuItem: string): void {
    if (!this.courseManagementComponent) return;

    switch (submenuItem.toLowerCase()) {
      case 'view all courses':
      case 'view course by name':
        this.courseManagementComponent.setActiveView('course-list');
        break;
      case 'add course':
        this.courseManagementComponent.openCreateModal();
        break;
      case 'edit course':
      case 'update course':
        this.courseManagementComponent.setActiveView('course-list');
        break;
      case 'delete course':
        this.courseManagementComponent.setActiveView('course-list');
        break;
      default:
        this.courseManagementComponent.setActiveView('course-list');
    }
  }
}
