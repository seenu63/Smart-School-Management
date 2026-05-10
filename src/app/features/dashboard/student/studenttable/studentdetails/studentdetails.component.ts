import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../core/services/auth.service';

interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  class: string;
  section: string;
  enrollmentDate: string;
  gpa: string;
  status: string;
  fatherName: string;
  motherName: string;
  parentPhone: string;
}

@Component({
  selector: 'app-studentdetails',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './studentdetails.component.html',
  styleUrl: './studentdetails.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentdetailsComponent implements OnInit {
  studentData: any;
  student: Student | null = null;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getStudentDetails();
  }

  getStudentDetails(): void {
    const dashboardData = this.authService.getSelectedStudentData?.() ?? this.authService.getStudentDashboardData() ?? {};
    const id = this.getFirstFieldValue(dashboardData, [
      'StudentGUID',
      'studentGuid',
      'studentGUID',
      'StudentId',
      'studentId',
      'id',
      'UserId',
      'userId',
      'userid',
      'UserID'
    ]);

    const classValue = this.getFirstFieldValue(dashboardData, [
      'Class',
      'class',
      'ClassNo',
      'classNo',
      'classno',
      'Standard',
      'standard'
    ]);

    const payload = {
      request: {
        id: id || '',
        class: classValue || '',
        type: 'details'
      }
    };

    this.authService.getStudentDetails(payload,'User/student').subscribe({
      next: (res) => {
        this.studentData = res;
        this.student = this.mapStudent(res);
        console.log('Student details response:', res);
        console.log('Mapped student:', this.student);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Student details error:', err);
      }
    });
  }

  get initials(): string {
    const [first = '', second = ''] = (this.student?.name ?? '').split(' ');
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  }

  get statusClass(): string {
    return this.student?.status === 'Active' ? 'badge-active' : 'badge-inactive';
  }

  private mapStudent(res: any): Student | null {
    const source = this.extractStudentSource(res);

    if (!source || typeof source !== 'object') {
      return null;
    }

    return {
      id: source.StudentGUID ?? '',
      name: source.StudentName ?? '',
      rollNo: source.RowID ?? '',
      email: source.Email ?? '',
      phone: source.Phone ?? '',
      dateOfBirth: source.Dateofbirth ??  '',
      address: source.Address ?? '',
      class: source.Class ?? '',
      section: source.section ?? 'A',
      enrollmentDate: source.CreatedDate ??'',
      gpa: source.gpa ?? '',
      status: source.status ?? '',
      fatherName: source.FatherName ?? '',
      motherName: source.MotherName ?? '',
      parentPhone: source.Phone ?? ''
    };
  }

  private extractStudentSource(res: any): any {
    if (Array.isArray(res?.status?.[0])) {
      return res.status[0][0];
    }

    if (Array.isArray(res?.status)) {
      return res.status[0];
    }

    if (Array.isArray(res?.data)) {
      return res.data[0];
    }

    if (res?.data && typeof res.data === 'object') {
      return res.data;
    }

    if (res?.student && typeof res.student === 'object') {
      return res.student;
    }

    if (res && typeof res === 'object') {
      return res;
    }

    return null;
  }

  private getFirstFieldValue(sources: any, fieldNames: string[]): string {
    const stack = Array.isArray(sources) ? sources : [sources];
    for (const source of stack) {
      if (!source || typeof source !== 'object') continue;
      for (const fieldName of fieldNames) {
        const value = (source as any)?.[fieldName];
        if (value != null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
      const nestedCandidates = [
        source?.status?.[0]?.[0],
        source?.status?.[0],
        source?.status,
        source?.data?.[0],
        source?.data,
        source?.student?.[0],
        source?.student,
        source?.user?.[0],
        source?.user,
        source?.response?.data?.[0],
        source?.response?.data
      ];
      for (const nested of nestedCandidates) {
        if (nested && typeof nested === 'object') {
          const v = this.getFirstFieldValue(nested, fieldNames);
          if (v) return v;
        }
      }
    }
    return '';
  }
}
