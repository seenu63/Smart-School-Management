import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-teacher-back-button',
  standalone: true,
  templateUrl: './teacher-back-button.component.html',
  styleUrl: './teacher-back-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherBackButtonComponent {
  constructor(
    private location: Location,
    private router: Router
  ) {}

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/teacher-dashboard']);
  }
}
