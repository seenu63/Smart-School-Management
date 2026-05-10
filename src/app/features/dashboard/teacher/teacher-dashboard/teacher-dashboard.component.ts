import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TeacherwidgetComponent } from '../teacherwidget/teacherwidget.component';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [TeacherwidgetComponent],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDashboardComponent implements OnInit {
   controlledClasses: number[] = [];

  readonly cardColors: string[] = ['blue', 'orange', 'green'];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const response = this.authService.getStudentDashboardData();
    this.controlledClasses = response.student[0].AccessRights.split('|');
  }

  getClassCountText(classNo: number): string {
    return `Class ${classNo}`;
  }

  getDescription(classNo: number): string {
    if (classNo >= 10) {
      return 'Track attendance and review board-year student records.';
    }
    return 'Mark attendance and open the student list for this class.';
  }

  openAttendance(classNo: number): void {
    this.router.navigate(['/teacher-attendance', classNo]);
  }

  openStudents(classNo: number): void {
    this.router.navigate(['/teacher-students', classNo]);
  }

}
