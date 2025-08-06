import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-learner-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="learner-progress">
      <div class="section-header">
        <h2><i class="fas fa-chart-line"></i> Learning Progress</h2>
      </div>
      
      <div class="progress-content">
        <div class="content-placeholder">
          <i class="fas fa-chart-bar"></i>
          <h3>Progress Analytics</h3>
          <p>This section will display detailed progress reports, learning analytics, and performance metrics.</p>
          <div class="features-list">
            <div class="feature-item">
              <i class="fas fa-trophy"></i>
              <span>Achievements</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-clock"></i>
              <span>Time Tracking</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-star"></i>
              <span>Performance Metrics</span>
            </div>
            <div class="feature-item">
              <i class="fas fa-calendar"></i>
              <span>Learning Schedule</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .learner-progress {
      padding: 2rem;
      background: #f8f9fa;
      min-height: calc(100vh - 140px);
    }

    .section-header {
      margin-bottom: 2rem;
    }

    .section-header h2 {
      color: #2c3e50;
      font-size: 1.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .content-placeholder {
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .content-placeholder i {
      font-size: 4rem;
      color: #e74c3c;
      margin-bottom: 1rem;
    }

    .content-placeholder h3 {
      color: #2c3e50;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }

    .content-placeholder p {
      color: #7f8c8d;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    .features-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #ecf0f1;
      border-radius: 8px;
      font-weight: 500;
      color: #2c3e50;
    }

    .feature-item i {
      color: #e74c3c;
      font-size: 1.2rem;
    }
  `]
})
export class LearnerProgressComponent { } 