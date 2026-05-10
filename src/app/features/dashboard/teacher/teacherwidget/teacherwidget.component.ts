import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-teacherwidget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacherwidget.component.html',
  styleUrl: './teacherwidget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherwidgetComponent {
  @Input() title: string = 'Class';
  @Input() value: string = '-';
  @Input() description: string = '';
  @Input() iconColor: string = 'blue';
  @Input() actionText: string = '';
  @Input() secondaryActionText: string = '';

  @Output() actionClick = new EventEmitter<void>();
  @Output() secondaryActionClick = new EventEmitter<void>();
}
