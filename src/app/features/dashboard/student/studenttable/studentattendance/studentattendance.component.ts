import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { TableModule } from 'primeng/table';
import { SortEvent } from 'primeng/api';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AttendanceRow {
  attendanceStatus: number;
  attendanceDate: string;
  attendanceDay: string;
  dayOrder: number;
}

@Component({
  selector: 'app-studentattendance',
  standalone: true,
  imports: [CommonModule, TableModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './studentattendance.component.html',
  styleUrl: './studentattendance.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentattendanceComponent implements OnInit {
  readonly monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  selectedMonth = this.getCurrentMonthValue();
  attendanceRows: AttendanceRow[] = [];
  isLoading = false;

  constructor(
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAttendance(this.selectedMonth);
  }

  onMonthChange(month: string): void {
    this.selectedMonth = month;
  }

  onSearch(): void {
    this.loadAttendance(this.selectedMonth);
  }


  private loadAttendance(month: string): void {
    const payload = this.buildAttendancePayload(month);

    if (!payload) {
      this.attendanceRows = [];
      this.cd.markForCheck();
      return;
    }

    this.isLoading = true;

    this.authService
      .getStudentDetails(payload, 'User/student')
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cd.markForCheck();
      }))
      .subscribe({
        next: (res) => {
          const source = this.extractAttendanceSource(res);
          this.attendanceRows = this.mapAttendanceRows(source);
        },
        error: () => {
          this.attendanceRows = [];
        }
      });
  }

  private buildAttendancePayload(month: string): { request: { id: string; class: string; type: string; month: string; year: string; period: string } } | null {
    const dashboardData = this.authService.getSelectedStudentData?.() ?? this.authService.getStudentDashboardData() ?? {};
    const sources = this.getPayloadSources(dashboardData);

    const studentId = this.getFirstFieldValue(sources, [
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

    const classValue = this.getFirstFieldValue(sources, [
      'Class',
      'class',
      'ClassNo',
      'classNo',
      'classno',
      'Standard',
      'standard'
    ]);

    if (!studentId || !classValue) {
      return null;
    }

    const normalizedMonth = String(Number(month));

    return {
      request: {
        id: studentId,
        class: classValue,
        type: 'attendance',
        month: normalizedMonth,
        year: String(new Date().getFullYear()),
        period: ''
      }
    };
  }

  private getPayloadSources(response: any): any[] {
    const sources: any[] = [];
    const pushIfObject = (value: any) => {
      if (value && typeof value === 'object') {
        sources.push(value);
      }
    };

    pushIfObject(response);
    pushIfObject(response?.status?.[0]?.[0]);
    pushIfObject(response?.status?.[0]);
    pushIfObject(response?.data?.[0]);
    pushIfObject(response?.data);
    pushIfObject(response?.student?.[0]);
    pushIfObject(response?.student);
    pushIfObject(response?.user?.[0]);
    pushIfObject(response?.user);
    pushIfObject(response?.response?.data?.[0]);
    pushIfObject(response?.response?.data);

    return sources;
  }

  private getFirstFieldValue(sources: any[], fieldNames: string[]): string {
    for (const source of sources) {
      for (const fieldName of fieldNames) {
        const value = source?.[fieldName];
        if (value != null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
    }

    return '';
  }

  private extractAttendanceSource(res: any): any {
    if (Array.isArray(res?.status?.[0])) {
      return res.status[0];
    }

    if (Array.isArray(res?.status)) {
      return res.status[0];
    }

    if (Array.isArray(res?.data)) {
      return res.data;
    }

    if (res?.data && typeof res.data === 'object') {
      return res.data;
    }

    return res;
  }

  private mapAttendanceRows(response: any): AttendanceRow[] {
    const rows = Array.isArray(response)
      ? response
      : response && typeof response === 'object'
        ? [response]
        : [];

    return rows
      .filter((row) => row && typeof row === 'object')
      .map((row: any) => ({
        attendanceStatus: Number(row.AttendanceStatus ?? row.attendanceStatus ?? row.status ?? 0),
        attendanceDate: this.formatDate(row.AttendanceDate ?? row.attendanceDate ?? row.date ?? ''),
        attendanceDay: String(row.AttendanceDay ?? row.attendanceDay ?? row.day ?? ''),
        dayOrder: Number(row.DayOrder ?? row.dayOrder ?? 0)
      }));
  }

  private getCurrentMonthValue(): string {
    const month = new Date().getMonth() + 1;
    return String(month).padStart(2, '0');
  }

  private getMonthLabel(monthValue: string): string {
    return this.monthOptions.find((option) => option.value === monthValue)?.label ?? monthValue;
  }

  private formatDate(value: any): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString('en-GB');
  }

  sortTableData(event: SortEvent): void {
    (event.data as AttendanceRow[]).sort((data1: AttendanceRow, data2: AttendanceRow) => {
      const field = event.field as keyof AttendanceRow;
      const value1 = data1[field] ?? '';
      const value2 = data2[field] ?? '';

      let result = 0;
      if (value1 == null && value2 != null) {
        result = -1;
      } else if (value1 != null && value2 == null) {
        result = 1;
      } else if (value1 == null && value2 == null) {
        result = 0;
      } else if (typeof value1 === 'string' && typeof value2 === 'string') {
        result = value1.localeCompare(value2);
      } else {
        result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
      }

      return (event.order ?? 1) * result;
    });
  }
}
