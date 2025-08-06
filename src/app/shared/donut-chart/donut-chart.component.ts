import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="donut-chart-container">
      <div class="donut-chart" [style.--progress]="normalizedProgress">
        <div class="donut-progress" 
             [style.--stroke-dasharray]="strokeDasharray"
             [ngClass]="getProgressClass()">
        </div>
        <div class="donut-content">
          <div class="progress-value">{{ displayProgress }}%</div>
          <div class="progress-label">{{ label }}</div>
        </div>
      </div>
      <div class="chart-stats" *ngIf="showStats">
        <div class="stat-item">
          <span class="stat-label">Completed:</span>
          <span class="stat-value">{{ completedQuizzes }}/{{ totalQuizzes }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Passed:</span>
          <span class="stat-value">{{ passedQuizzes }}/{{ totalQuizzes }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .donut-chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .donut-chart {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        var(--progress-color, #667eea) calc(var(--progress, 0) * 3.6deg),
        #e9ecef calc(var(--progress, 0) * 3.6deg)
      );
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.5s ease;
    }

    .donut-chart::before {
      content: '';
      position: absolute;
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 50%;
      z-index: 1;
    }

    .donut-content {
      position: relative;
      z-index: 2;
      text-align: center;
    }

    .progress-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      line-height: 1;
    }

    .progress-label {
      font-size: 0.7rem;
      color: #666;
      margin-top: 0.2rem;
      font-weight: 500;
    }

    .chart-stats {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 120px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
    }

    .stat-label {
      color: #666;
      font-weight: 500;
    }

    .stat-value {
      color: #333;
      font-weight: 600;
    }

    /* Progress color variants */
    .donut-chart.progress-low {
      --progress-color: #dc3545;
    }

    .donut-chart.progress-medium {
      --progress-color: #ffc107;
    }

    .donut-chart.progress-high {
      --progress-color: #28a745;
    }

    .donut-chart.progress-complete {
      --progress-color: #28a745;
    }

    /* Animation */
    .donut-chart {
      animation: progressLoad 1s ease-out;
    }

    @keyframes progressLoad {
      from {
        background: conic-gradient(
          from 0deg,
          var(--progress-color, #667eea) 0deg,
          #e9ecef 0deg
        );
      }
      to {
        background: conic-gradient(
          from 0deg,
          var(--progress-color, #667eea) calc(var(--progress, 0) * 3.6deg),
          #e9ecef calc(var(--progress, 0) * 3.6deg)
        );
      }
    }
  `]
})
export class DonutChartComponent implements OnChanges {
  @Input() progress: number = 0;
  @Input() label: string = 'Progress';
  @Input() totalQuizzes: number = 0;
  @Input() completedQuizzes: number = 0;
  @Input() passedQuizzes: number = 0;
  @Input() showStats: boolean = true;

  displayProgress: number = 0;
  normalizedProgress: number = 0;
  strokeDasharray: string = '0 100';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['progress']) {
      this.animateProgress();
    }
  }

  private animateProgress(): void {
    const targetProgress = Math.max(0, Math.min(100, this.progress || 0));
    this.normalizedProgress = targetProgress;
    
    // Animate the displayed number
    const duration = 500; // ms
    const steps = 30;
    const stepValue = targetProgress / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      this.displayProgress = Math.round(currentStep * stepValue);
      
      if (currentStep >= steps || this.displayProgress >= targetProgress) {
        this.displayProgress = targetProgress;
        clearInterval(timer);
      }
    }, stepDuration);
  }

  getProgressClass(): string {
    const progress = this.progress || 0;
    if (progress === 100) return 'progress-complete';
    if (progress >= 70) return 'progress-high';
    if (progress >= 50) return 'progress-medium';
    return 'progress-low';
  }
} 