import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() selectedMenu: string = '';
  @Input() role: string = '';
  @Output() submenuSelect = new EventEmitter<string>();
  isCollapsed: boolean = false;
  
  // Scroll indicators
  canScrollLeft: boolean = false;
  canScrollRight: boolean = false;

  constructor(private sidebarService: SidebarService, private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to sidebar collapse state
    this.sidebarService.isCollapsed$.subscribe(collapsed => {
      this.isCollapsed = collapsed;
    });
    
    // Check scroll indicators after view init
    setTimeout(() => this.updateScrollIndicators(), 100);
    
    // Add window resize listener to update indicators
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        setTimeout(() => this.updateScrollIndicators(), 100);
      });
    }
  }

  ngAfterViewInit(): void {
    // Update scroll indicators when view is ready
    setTimeout(() => this.updateScrollIndicators(), 300);
    
    // Set up scroll listener
    const navbarItems = document.querySelector('.navbar-items') as HTMLElement;
    if (navbarItems) {
      navbarItems.addEventListener('scroll', () => this.updateScrollIndicators());
    }
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
    // Update scroll indicators after sidebar toggle
    setTimeout(() => this.updateScrollIndicators(), 500);
  }

  selectSubmenu(item: string): void {
    this.submenuSelect.emit(item);
  }

  // Handle navbar scrolling
  scrollNavbar(direction: 'left' | 'right'): void {
    const navbarItems = document.querySelector('.navbar-items') as HTMLElement;
    if (navbarItems) {
      const scrollAmount = 150; // Reduced scroll distance for better control
      const currentScroll = navbarItems.scrollLeft;
      
      if (direction === 'left') {
        navbarItems.scrollTo({
          left: Math.max(0, currentScroll - scrollAmount),
          behavior: 'smooth'
        });
      } else {
        navbarItems.scrollTo({
          left: currentScroll + scrollAmount,
          behavior: 'smooth'
        });
      }
      
      // Update indicators after scroll
      setTimeout(() => this.updateScrollIndicators(), 100);
    }
  }

  // Update scroll indicators
  updateScrollIndicators(): void {
    const navbarItems = document.querySelector('.navbar-items') as HTMLElement;
    if (navbarItems) {
      const scrollLeft = navbarItems.scrollLeft;
      const scrollWidth = navbarItems.scrollWidth;
      const clientWidth = navbarItems.clientWidth;
      
      this.canScrollLeft = scrollLeft > 5; // Add small buffer
      this.canScrollRight = scrollLeft < (scrollWidth - clientWidth - 5); // Add small buffer
      
      // Debug logging
      console.log('Scroll Debug:', {
        scrollLeft,
        scrollWidth,
        clientWidth,
        canScrollLeft: this.canScrollLeft,
        canScrollRight: this.canScrollRight
      });
    }
  }

  // Listen for scroll events
  onNavbarScroll(): void {
    this.updateScrollIndicators();
  }

  // TrackBy function for better performance
  trackSubmenuItem(index: number, item: string): string {
    return item;
  }

  ngOnChanges(): void {
    // Update scroll indicators when inputs change
    setTimeout(() => this.updateScrollIndicators(), 100);
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', () => this.updateScrollIndicators());
    }
  }

  getSubmenuItems(): string[] {
    const lowerRole = this.role.toLowerCase();
    const lowerMenu = this.selectedMenu.toLowerCase();

    const menuMap: Record<string, Record<string, string[]>> = {
      admin: {
        'course management': ['Add Course', 'Delete Course', 'Update Course', 'View All Courses', 'View Course by Name'],
        'user management': ['Register User', 'Delete User', 'Update User', 'View All Users', 'View by Role', 'Activate/Deactivate User'],
        enrollments: ['Enroll Student', 'Assign Instructor', 'View Student Enrollments', 'View Instructor Assignments'],
        reports: ['System Overview', 'Course Statistics', 'Student Progress', 'Completion Reports'],
      },
      superadmin: {
        'course management': ['Add Course', 'Delete Course', 'Update Course', 'View All Courses', 'View Course by Name'],
        'user management': ['Register User', 'Delete User', 'Update User', 'View All Users', 'View by Role', 'Activate/Deactivate User'],
        enrollments: ['Enroll Student', 'Assign Instructor', 'View Student Enrollments', 'View Instructor Assignments'],
        reports: ['System Analytics', 'User Statistics', 'Course Enrollment', 'Overall Metrics'],
      },
      instructor: {
        courses: ['Add Course Data', 'Update Course Data', 'Create Quiz', 'View Assigned Courses', 'View Students'],
        reports: ['Course Analytics', 'Student Progress', 'Quiz Performance', 'Class Statistics'],
      },
      learner: {
        course: ['Quizzes', 'Course Data'],
        reports: ['My Progress', 'Course Status', 'Quiz Results', 'Learning Analytics'],
      },
    };

    return (
      menuMap[lowerRole]?.[lowerMenu] || []
    );
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }
}
