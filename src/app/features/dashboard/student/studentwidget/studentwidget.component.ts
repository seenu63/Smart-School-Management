import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-studentwidget',
  standalone : true,
  imports: [CommonModule],
  templateUrl: './studentwidget.component.html',
  styleUrl: './studentwidget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentwidgetComponent {
  @Input() title: string = 'Stat';
  @Input() value: string = '0';
  @Input() description: string = '';
  @Input() icon: string = 'info';
  @Input() iconColor: string = 'blue';
}
