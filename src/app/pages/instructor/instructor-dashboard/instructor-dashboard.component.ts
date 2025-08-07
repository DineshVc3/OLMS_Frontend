import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { ProfileComponent } from '../../../shared/profile/profile.component';

import { MyStudentsComponent } from './my-students.component';
import { AssignedCoursesComponent } from './assigned-courses.component';
import { AddContentComponent } from './add-content.component';
import { CreateQuizComponent } from './create-quiz.component';
import { InstructorDashboardHomeComponent } from './instructor-dashboard-home.component';
import { InstructorReportsComponent } from '../../../shared/reports-analytics/instructor-reports.component';
import { SidebarService } from '../../../services/sidebar.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule,
    SidebarComponent, 
    HeaderComponent, 
    ProfileComponent, 
    MyStudentsComponent,
    AssignedCoursesComponent,
    AddContentComponent,
    CreateQuizComponent,
    InstructorDashboardHomeComponent,
    InstructorReportsComponent
  ],
  templateUrl: './instructor-dashboard.component.html',
  styleUrl: './instructor-dashboard.component.css'
})
export class InstructorDashboardComponent {
  role: string = '';
  selectedSidebarItem: string = '';
  isCollapsed: boolean = false;
  showProfile: boolean = false;
  currentSection: string = '';
  showReports: boolean = false;

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.role = localStorage.getItem('role') || '';
    }

    // Subscribe to sidebar collapse state
    this.sidebarService.isCollapsed$.subscribe(collapsed => {
      this.isCollapsed = collapsed;
    });
  }

  onMenuSelect(item: string): void {
    this.selectedSidebarItem = item;
    this.showProfile = false;
    
    // Reset showReports for all menu items first
    this.showReports = false;
    
    // Set the current section based on menu selection
    switch (item.toLowerCase()) {
      case 'home':
        this.currentSection = '';
        break;
      case 'my students':
        this.currentSection = 'my-students';
        break;
      case 'courses':
        this.currentSection = 'assigned-courses';
        break;
      case 'reports':
        this.showReports = true;
        this.currentSection = ''; // Clear currentSection when showing reports
        break;
      default:
        this.currentSection = '';
    }
  }

  onProfileToggle(show: boolean): void {
    this.showProfile = show;
    if (show) {
      this.selectedSidebarItem = '';
      this.showReports = false;
      this.currentSection = '';
    }
  }

  onSubmenuSelect(submenuItem: string): void {
    // Reports functionality removed
  }



  // New navigation methods for dashboard sections
  onSectionChange(section: string): void {
    console.log('📍 Section change requested:', section);
    this.currentSection = section;
    console.log('✅ Current section updated to:', this.currentSection);
  }

  onContentAdded(content: any): void {
    console.log('Content added:', content);
    // Optionally redirect back to dashboard or show success message
    // this.currentSection = 'home';
  }

  onQuizCreated(quiz: any): void {
    console.log('Quiz created:', quiz);
    // Optionally redirect back to dashboard or show success message
    // this.currentSection = 'home';
  }
}
