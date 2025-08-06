import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnrollmentService, EnrolledStudent } from '../../../services/enrollment.service';

@Component({
  selector: 'app-my-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-students.component.html',
  styleUrls: ['./my-students.component.css']
})
export class MyStudentsComponent implements OnInit {
  students: EnrolledStudent[] = [];
  filteredStudents: EnrolledStudent[] = [];
  paginatedStudents: EnrolledStudent[] = [];
  
  isLoading = false;
  error: string | null = null;
  searchTerm = '';
  
  // Sorting
  sortField: keyof EnrolledStudent = 'assignedDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Modal
  showProgressModal = false;
  selectedStudent: EnrolledStudent | null = null;

  // Math object for template
  Math = Math;

  constructor(private enrollmentService: EnrollmentService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.error = null;

    this.enrollmentService.getEnrolledStudents().subscribe({
      next: (students) => {
        this.students = students;
        this.filteredStudents = [...students];
        this.sortStudents();
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.error = error.message || 'Failed to load students. Please try again.';
        this.isLoading = false;
      }
    });
  }

  filterStudents(): void {
    if (!this.searchTerm.trim()) {
      this.filteredStudents = [...this.students];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredStudents = this.students.filter(student =>
        student.userEmail.toLowerCase().includes(term) ||
        student.courseTitle.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.sortStudents();
    this.updatePagination();
  }

  sortBy(field: keyof EnrolledStudent): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.sortStudents();
    this.updatePagination();
  }

  private sortStudents(): void {
    this.filteredStudents.sort((a, b) => {
      let aValue = a[this.sortField];
      let bValue = b[this.sortField];

      // Handle date sorting
      if (this.sortField === 'assignedDate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredStudents.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedStudents = this.filteredStudents.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getVisiblePages(): number[] {
    const maxVisible = 5;
    const pages: number[] = [];
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getActiveStudentsCount(): number {
    return this.filteredStudents.filter(student => student.isActive).length;
  }

  getUniqueCourseCount(): number {
    const uniqueCourses = new Set(this.filteredStudents.map(student => student.courseTitle));
    return uniqueCourses.size;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  trackByStudentId(index: number, student: EnrolledStudent): number {
    return student.id;
  }

  viewStudentProgress(student: EnrolledStudent): void {
    this.selectedStudent = student;
    this.showProgressModal = true;
  }

  contactStudent(student: EnrolledStudent): void {
    // Open email client or contact modal
    const emailSubject = `Regarding Course: ${student.courseTitle}`;
    const mailtoLink = `mailto:${student.userEmail}?subject=${encodeURIComponent(emailSubject)}`;
    window.open(mailtoLink, '_blank');
  }

  closeProgressModal(): void {
    this.showProgressModal = false;
    this.selectedStudent = null;
  }
} 