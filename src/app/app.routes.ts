import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './layout/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'student-dashboard',
      },
      {
        path: 'student-dashboard',
        loadComponent: () =>
          import('./features/dashboard/student/student-dashboard/student-dashboard.component')
            .then((m) => m.StudentDashboardComponent),
      },
      {
        path: 'student-details',
        loadComponent: () =>
          import('./features/dashboard/student/studenttable/studentdetails/studentdetails.component')
            .then((m) => m.StudentdetailsComponent),
      },
      {
        path: 'studentmark',
        loadComponent: () =>
          import('./features/dashboard/student/studenttable/studentmark/studentmark.component')
            .then((m) => m.StudenttablesComponent),
      },
      {
        path: 'student-attendance',
        loadComponent: () =>
          import('./features/dashboard/student/studenttable/studentattendance/studentattendance.component')
            .then((m) => m.StudentattendanceComponent),
      },
      {
        path: 'teacher-dashboard',
        loadComponent: () =>
          import(
            './features/dashboard/teacher/teacher-dashboard/teacher-dashboard.component'
          ).then((m) => m.TeacherDashboardComponent),
      },
      {
        path: 'teacher-add-student',
        loadComponent: () =>
          import('./features/dashboard/teacher/addstudent/addstudent.component')
            .then((m) => m.AddstudentComponent),
      },
      {
        path: 'teacher-add-staff',
        loadComponent: () =>
          import('./features/dashboard/teacher/addstaff/addstaff.component')
            .then((m) => m.AddstaffComponent),
      },
      {
        path: 'teacher-add-mark',
        loadComponent: () =>
          import('./features/dashboard/teacher/addmarks/addmarks.component')
            .then((m) => m.AddmarksComponent),
      },
      {
        path: 'teacher-attendance/:classNo',
        loadComponent: () =>
          import('./features/dashboard/teacher/attendance/attendance.component')
            .then((m) => m.AttendanceComponent),
      },
      {
        path: 'teacher-students/:classNo',
        loadComponent: () =>
          import('./features/dashboard/teacher/students/students.component')
            .then((m) => m.StudentsComponent),
      }
    ]
  },
  // 404 page
  {
    path: '**',
    loadComponent: () =>
      import('./features/auth/pages/page-not-found/page-not-found.component')
        .then((m) => m.PageNotFoundComponent),
  },
];
