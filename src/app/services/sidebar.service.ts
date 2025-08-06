import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isCollapsedSubject = new BehaviorSubject<boolean>(false);
  public isCollapsed$ = this.isCollapsedSubject.asObservable();

  constructor() {
    // Load saved state from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        this.isCollapsedSubject.next(JSON.parse(savedState));
      }
    }
  }

  toggleSidebar(): void {
    const newState = !this.isCollapsedSubject.value;
    this.isCollapsedSubject.next(newState);
    
    // Save state to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
    }
  }

  collapseSidebar(): void {
    this.isCollapsedSubject.next(true);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('sidebarCollapsed', 'true');
    }
  }

  expandSidebar(): void {
    this.isCollapsedSubject.next(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('sidebarCollapsed', 'false');
    }
  }

  get isCollapsed(): boolean {
    return this.isCollapsedSubject.value;
  }
} 