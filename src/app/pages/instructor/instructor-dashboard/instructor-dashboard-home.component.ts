import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';





@Component({
  selector: 'app-instructor-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-dashboard-home.component.html',
  styleUrls: ['./instructor-dashboard-home.component.css']
})
export class InstructorDashboardHomeComponent implements OnInit {
  @Output() sectionChange = new EventEmitter<string>();

  isLoading = false;

  constructor() {}

  ngOnInit(): void {
    // Component initialized - no stats loading needed
  }





  navigateToSection(section: string): void {
    this.sectionChange.emit(section);
  }




} 