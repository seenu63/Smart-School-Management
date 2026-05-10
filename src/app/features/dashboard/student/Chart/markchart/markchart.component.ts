import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, PLATFORM_ID, SimpleChanges, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartModule } from 'primeng/chart';
@Component({
  selector: 'app-markchart',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './markchart.component.html',
  styleUrl: './markchart.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkchartComponent implements OnInit, OnChanges {
    @Input() labels: string[] = ['Tamil', 'English', 'Maths', 'Science', 'Social Science'];
    @Input() values: number[] = [50, 25, 12, 48, 90];
    @Input() chartLabel: string = 'Marks';

    data: any;
    options: any;
    platformId = inject(PLATFORM_ID);
    cd = inject(ChangeDetectorRef);

    ngOnInit() {
        this.initChart();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['labels'] || changes['values'] || changes['chartLabel']) {
            this.initChart();
        }
    }

    initChart() {
        if (isPlatformBrowser(this.platformId)) {
            const documentStyle = getComputedStyle(document.documentElement);
            const textColor = documentStyle.getPropertyValue('--p-text-color');
            const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
            const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');
        
            this.data = {
                labels: this.labels,
                datasets: [
                    {
                        type: 'bar',
                        label: this.chartLabel,
                        backgroundColor: documentStyle.getPropertyValue('--p-cyan-500'),
                        data: this.values
                    }                   
                ]
            };
        
            this.options = {
                maintainAspectRatio: false,
                aspectRatio: 0.8,
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        labels: {
                            color: textColor
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        ticks: {
                            color: textColorSecondary
                        },
                        grid: {
                            color: surfaceBorder,
                            drawBorder: false
                        }
                    },
                    y: {
                        stacked: false,
                        ticks: {
                            color: textColorSecondary
                        },
                        grid: {
                            color: surfaceBorder,
                            drawBorder: false
                        },
                        min: 0, 
                        max: 100,
                        stepSize: 10    
                    }
                }
            };
            this.cd.markForCheck();
        }
    }
}
