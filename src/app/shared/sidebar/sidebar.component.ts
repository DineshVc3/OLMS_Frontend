import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  role: string = '';
  menuItems: { label: string; icon: string }[] = [];
  isCollapsed: boolean = false;

  @Output() menuSelect = new EventEmitter<string>();

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.role = localStorage.getItem('role') || '';
      this.setMenuItems();
    } else {
      // Fallback if running in SSR or test environment
      this.role = '';
      this.setMenuItems();
    }

    // Subscribe to sidebar collapse state
    this.sidebarService.isCollapsed$.subscribe(collapsed => {
      this.isCollapsed = collapsed;
    });
  }

  setMenuItems(): void {
    switch (this.role.toLowerCase()) {
      case 'admin':
        this.menuItems = [
          { label: 'Home', icon: 'fa-home' },
          { label: 'Course Management', icon: 'fa-book' },
          { label: 'User Management', icon: 'fa-users' },
          { label: 'Enrollments', icon: 'fa-id-card' },
          { label: 'Reports', icon: 'fa-bar-chart' }
        ];
        break;
      case 'superadmin':
        this.menuItems = [
          { label: 'Home', icon: 'fa-home' },
          { label: 'Course Management', icon: 'fa-book' },
          { label: 'User Management', icon: 'fa-users' },
          { label: 'Enrollments', icon: 'fa-id-card' },
          { label: 'Reports', icon: 'fa-bar-chart' }
        ];
        break;
      case 'instructor':
        this.menuItems = [
          { label: 'Home', icon: 'fa-home' },
          { label: 'My Students', icon: 'fa-graduation-cap' },
          { label: 'Courses', icon: 'fa-book' },
          { label: 'Reports', icon: 'fa-bar-chart' }
        ];
        break;
      case 'learner':
        this.menuItems = [
          { label: 'Home', icon: 'fa-home' },
          { label: 'Course', icon: 'fa-book' },
          { label: 'Reports', icon: 'fa-bar-chart' }
        ];
        break;
      default:
        this.menuItems = [{ label: 'Home', icon: 'fa-home' }];
    }
  }

  selectItem(item: string): void {
    console.log(item);
    this.menuSelect.emit(item);
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }
}
