import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ChartModule } from 'primeng/chart';
@Component({
  selector: 'app-attendancechart',
  standalone : true,
  imports: [ChartModule],
  templateUrl: './attendancechart.component.html',
  styleUrl: './attendancechart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendancechartComponent implements OnInit, OnChanges {
  @Input() labels: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  @Input() values: number[] = [5, 4, 6, 5, 3, 0, 0];
  @Input() chartLabel: string = 'Attendance';

  chartData: any;
  chartOptions: any;

  ngOnInit() {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['labels'] || changes['values'] || changes['chartLabel']) {
      this.initChart();
    }
  }

  private initChart(): void {
    this.chartData = {
      labels: this.labels,
      datasets: [
        {
          label: this.chartLabel,
          data: this.values,
          backgroundColor: '#4CAF50'
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
       scales: {
        y: {
          beginAtZero: true,
          min: 0,
          max: 5,
          suggestedMax: 5,
          ticks: {
            stepSize: 1,
            autoSkip: false
          }
        }
      }
    };
  }
}
