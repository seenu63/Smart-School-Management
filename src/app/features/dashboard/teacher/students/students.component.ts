import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TeacherBackButtonComponent } from '../shared/teacher-back-button.component';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface StudentListItem {
  name: string;
  guid: string;
  class: string;
}

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [CommonModule, TeacherBackButtonComponent, MatSnackBarModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsComponent implements OnInit {
  readonly classNo: string;
  students: StudentListItem[] = [];

  private readonly studentByClass: Record<string, string[]> = {
    '7': ['Arun', 'Kavin', 'Mohan', 'Nila', 'Pavi', 'Rahul', 'Kumar', 'Priya', 'Manoj', 'Aarthi'],
    '8': ['Saran', 'Vicky', 'Anu', 'Harini', 'Sathish', 'Ramesh', 'Keerthi', 'Bala', 'Akila', 'Surya'],
    '10': ['Ravi', 'Karthik', 'Divya', 'Deepa', 'Sanjay', 'Meena', 'Ajith', 'Naveen', 'Ritika', 'Gokul']
  };

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {
    this.classNo = this.route.snapshot.paramMap.get('classNo') ?? '';
  }


  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    const payload = {
      request: {
        id: '',
        class: this.classNo,
        type: 'studentlist'
      }
    };

    this.authService.getStudentDetails(payload,'User/student').subscribe({
      next: (res) => {
        const apiStudents = this.extractStudents(res);
        this.students = apiStudents.length > 0 ? apiStudents : this.buildFallbackStudents();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToast('Unable to load students. Please try again.');
        this.students = this.buildFallbackStudents();
        this.cdr.markForCheck();
      }
    });
  }

  openStudentDashboard(student: StudentListItem): void {  
    const payload = {
      request: {
        id: student.guid || 'E366D9BA-757E-4002-A684-C1AE12381FBC',
        class: student.class || this.classNo || '6',
        type: 'student'
      }
    };

    this.authService.getStudentDetails(payload,'User/student').subscribe({
      next: (res) => {
         const normalized = this.normalizeDashboardPayload(res);
         this.authService.setSelectedStudentData(normalized);
         this.router.navigate(['/student-dashboard'], { queryParams: { from: 'teacher' } });
      },
      error: () => {
        this.showToast('Unable to open student dashboard. Please try again.');
      }
    }); 
  }

  private normalizeDashboardPayload(res: any): any {
    // Expected shape from API: [studentArray, marksArray, attendanceArray]
    if (Array.isArray(res.status)) {
      const student = Array.isArray(res.status[0]) ? res.status[0] : [];
      const marks = Array.isArray(res.status[1]) ? res.status[1] : [];
      const attendance = Array.isArray(res.status[2]) ? res.status[2] : [];
      return { student, marks, attendance };
    }

    // If already an object, pass through unchanged.
    return res;
  }

  private extractStudents(res: any): StudentListItem[] {
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
        class: String(item.Class ?? item.class ?? this.classNo ?? '').trim()
      }))
      .filter((item) => item.name !== '');
  }

  private buildFallbackStudents(): StudentListItem[] {
    const names = this.studentByClass[this.classNo ?? ''] ?? [];
    return names.map((name, index) => ({
      name,
      guid: `fallback-${index}`,
      class: this.classNo ?? ''
    }));
  }

  private showToast(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }
}
