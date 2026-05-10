import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherBackButtonComponent } from '../shared/teacher-back-button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoadingService } from '../../../../core/services/loading.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoadingOverlayComponent } from '../../../../shared/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, TeacherBackButtonComponent, MatSnackBarModule, LoadingOverlayComponent],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceComponent implements OnInit {
  readonly classNo: string | null;
  students: { guid: string; name: string; email: string; class: string; present: boolean }[] = [];

  private readonly studentByClass: Record<string, string[]> = {};

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    private toastService: ToastService,
    private loadingService: LoadingService
  ) {
    this.classNo = this.route.snapshot.paramMap.get('classNo');
  }

  ngOnInit(): void {
    this.loadStudents();
  }

  get presentCount(): number {
    return this.students.filter((student) => student.present).length;
  }

  saveAttendance(): void {
    const payload = this.buildAttendancePayload();

    this.loadingService.show();
    this.authService.getStudentDetails(payload, 'User/addstudent').subscribe({
      next: (res) => {
        const processStatus = res?.status?.[0]?.[0]?.ProcessStatus?.toLowerCase?.() ?? '';
        const message = res?.status?.[0]?.[0]?.Mgs ?? 'Attendance saved.';

        if (processStatus === 'success') {
          this.toastService.show(message || 'Attendance saved successfully.', 'success');
        } else {
          const msg = res?.status?.[0]?.[0]?.Mgs || 'Unable to save attendance.';
          this.toastService.show(msg, 'error');
        }
        this.loadingService.hide();
      },
      error: () => {
        this.toastService.show('Failed to save attendance. Please try again.', 'error');
        this.loadingService.hide();
      }
    });
  }

  
  loadStudents(): void {
    const payload = {
      request: {
        id: '',
        class: this.classNo ?? '',
        type: 'studentlist'
      }
    };

    this.loadingService.show();
    this.authService.getStudentDetails(payload, 'User/student').subscribe({
      next: (res) => {
        const apiStudents = this.extractStudents(res);
        this.students = apiStudents.length > 0 ? apiStudents : this.buildFallbackStudents();
        this.loadingService.hide();
        this.cdr.markForCheck();
      },
      error: () => {
        this.showToast('Unable to load students. Please try again.');
        this.students = this.buildFallbackStudents();
        this.loadingService.hide();
        this.cdr.markForCheck();
      }
    });
  }

  private buildStudentList(classNo: string): { guid: string; name: string; email: string; class: string; present: boolean }[] {
    const names = this.studentByClass[classNo] ?? [];
    return names.map((name, index) => ({
      guid: `fallback-${index}`,
      name,
      email: '',
      class: classNo,
      present: true
    }));
  }

  private extractStudents(res: any): { guid: string; name: string; email: string; class: string; present: boolean }[] {
    const list =
      (Array.isArray(res?.status?.[0]) && res.status[0]) ||
      (Array.isArray(res?.status) ? res.status : []) ||
      (Array.isArray(res) ? res : []);

    if (!Array.isArray(list)) {
      return [];
    }

    return list
      .filter((item) => item && typeof item === 'object')
      .map((item, index) => ({
        name: String(item.StudentName ?? item.name ?? '').trim(),
        guid: String(item.StudentGUID ?? item.guid ?? item.id ?? `fallback-${index}`).trim(),
        email: String(
          item.StudentEmail ??
          item.Email ??
          item.email ??
          item.EmailId ??
          item.emailId ??
          ''
        ).trim(),
        class: String(item.Class ?? item.class ?? this.classNo ?? '').trim(),
        present: true
      }))
      .filter((item) => item.name !== '');
  }

  private buildFallbackStudents(): { guid: string; name: string; email: string; class: string; present: boolean }[] {
    return this.buildStudentList(this.classNo ?? '');
  }

  private buildAttendancePayload(): any {
    const today = new Date();
    const isoDate = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const day = this.getDayName(today);
    const dayOrder = this.getDayOrder(today);
    const month = today.getMonth() + 1; // 1-12
    const year = today.getFullYear();

    return {
      request: {
        student: this.students.map((student) => ({
          StudentName: student.name,
          StudentGUID: student.guid,
          Email: student.email,
          Present: student.present == true ? 1 : 0,
          Class: student.class,
          day,
          date: isoDate,
          dayOrder,
          month,
          year,
          createdBy: this.authService.getUserId?.() ?? ''
        })),      
        operation: 'insert',
        type: 'attendance'
      }
    };
  }

  private getDayName(date: Date): string {
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return names[date.getDay()];
  }

  private getDayOrder(date: Date): number {
    // Monday = 1, Tuesday = 2, ..., Friday = 5, Saturday = 6, Sunday = 7
    const day = date.getDay();
    return day === 0 ? 7 : day;
  }

  private showToast(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }
}
