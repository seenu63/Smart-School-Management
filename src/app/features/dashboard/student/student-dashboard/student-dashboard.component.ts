import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StudentwidgetComponent } from '../studentwidget/studentwidget.component';
import { AttendancechartComponent } from '../Chart/attendancechart/attendancechart.component';
import { MarkchartComponent } from '../Chart/markchart/markchart.component';

interface DashboardCard {
  title: string;
  value: string;
  description: string;
  icon: string;
  iconColor: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, StudentwidgetComponent, AttendancechartComponent, MarkchartComponent],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardComponent implements OnInit {
  cards: DashboardCard[] = [];
  attendanceChartLabels: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  attendanceChartValues: number[] = [0, 0, 0, 0, 0, 0, 0];
  markChartLabels: string[] = ['Tamil', 'English', 'Maths', 'Science', 'Social Science'];
  markChartValues: number[] = [0, 0, 0, 0, 0];
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const response = this.authService.getSelectedStudentData() ?? this.authService.getStudentDashboardData();
    const selectedStudent = this.route.snapshot.queryParamMap.get('student')?.trim() ?? '';

    if (this.hasValidDashboardData(response)) {
      this.buildDashboard(response);
      return;
    }

    this.buildDashboardFallback(selectedStudent || 'Student');
  }

  private hasValidDashboardData(response: any): boolean {
    return !!response && (Array.isArray(response?.marks) || Array.isArray(response?.attendance));
  }

  private buildDashboard(response: any): void {
    const markRows = Array.isArray(response?.marks) ? response.marks : [];
    const attendanceRows = Array.isArray(response?.attendance) ? response.attendance : [];

    const firstMarkRow = markRows[0] ?? {};
    const firstAttendanceRow = attendanceRows[0] ?? {};
    const markPercent = Number(firstMarkRow?.Marks ?? 0);
    let attendancePercent = Number(
      firstAttendanceRow?.Attendace ??
      firstAttendanceRow?.Attendance ??
      firstAttendanceRow?.Counts ??
      0
    );
    // Fallback: some APIs return Attendace inside the marks payload
    if (!attendancePercent) {
      attendancePercent = Number(firstMarkRow?.Attendace ?? firstMarkRow?.Attendance ?? 0);
    }

    const testsValue = 10;
    const homeworkValue = 12;

    this.cards = [
      {
        title: 'Attendance',
        value: `${attendancePercent || 0}%`,
        description: 'Present this month',
        icon: 'attendance',
        iconColor: 'green'
      },
      {
        title: 'Marks',
        value: `${markPercent || 0}%`,
        description: 'Average from API marks',
        icon: 'marks',
        iconColor: 'blue'
      },
      {
        title: 'Tests',
        value: `${testsValue}%`,
        description: 'Upcoming tests',
        icon: 'tests',
        iconColor: 'orange'
      },
      {
        title: 'Homework',
        value: `${homeworkValue}%`,
        description: 'Pending assignments',
        icon: 'homework',
        iconColor: 'red'
      }
    ];

    if (attendanceRows.length > 0) {
      this.attendanceChartValues = attendanceRows.map((m: any) => Number(m?.Counts ?? 0));
    }

    if (markRows.length > 0) {
      const subjectEntries = Object.entries(firstMarkRow).filter(([key]) => {
        const k = key.toLowerCase();
        return ![
          'marks',
          'attendace',
          'attendance',
          'studentname',
          'student',
          'class',
          'classno',
          'period',
          'grade',
          'percentage',
          'total'
        ].includes(k);
      });

      this.markChartLabels = subjectEntries.map(([key]) => key.replace(/([a-z])([A-Z])/g, '$1 $2'));
      this.markChartValues = subjectEntries.map(([, value]) => Number(value ?? 0));
    }
  }

  private buildDashboardFallback(studentName: string): void {
    this.cards = [
      {
        title: 'Attendance',
        value: '0%',
        description: `${studentName} attendance`,
        icon: 'attendance',
        iconColor: 'green'
      },
      {
        title: 'Marks',
        value: '0%',
        description: `${studentName} marks`,
        icon: 'marks',
        iconColor: 'blue'
      },
      {
        title: 'Tests',
        value: '0',
        description: 'Upcoming tests',
        icon: 'tests',
        iconColor: 'orange'
      },
      {
        title: 'Homework',
        value: '0',
        description: 'Pending assignments',
        icon: 'homework',
        iconColor: 'red'
      }
    ];

    this.attendanceChartValues = [0, 0, 0, 0, 0, 0, 0];
    this.markChartValues = [0, 0, 0, 0, 0];
  }
}
