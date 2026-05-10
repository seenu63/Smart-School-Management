import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LoadingService } from '../../../../core/services/loading.service';
import { LoadingOverlayComponent } from '../../../../shared/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, MatFormFieldModule, MatInputModule, LoadingOverlayComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.Default
})

export class LoginComponent implements OnDestroy {
    Userid: string = '';
    Password: string = '';
    isLoading: boolean = false;
    toastMessage: string = '';
    toastType: 'success' | 'error' = 'success';
    showToast: boolean = false;
    toastProgress: number = 100;
    private readonly toastDurationMs = 3000;
    private toastRemainingMs = this.toastDurationMs;
    private toastInterval: ReturnType<typeof setInterval> | null = null;
    private destroyed = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private loadingService: LoadingService
  ) {}

  Login() {     
  if (this.isLoading) {
      return;
    }

    if (!this.Userid.trim() || !this.Password.trim()) {
      this.isLoading = false;
      this.showStatusToast('Please enter username and password.', 'error');
      return;
    }

  const data = {
      request: {
        userid: this.Userid.trim(),
        password: this.Password.trim()
      }
    }

    this.isLoading = true;
    this.loadingService.show();

    this.authService.createPost(data).pipe(
      take(1),
      finalize(() => {
        this.isLoading = false;
        this.loadingService.hide();
      })
    ).subscribe({
      next: (res) => {
        const isSuccess = res.status?.Status === '1';
        this.showStatusToast(
          this.getResponseMessage(res, isSuccess ? 'Login successful' : 'Login failed'),
          isSuccess ? 'success' : 'error'
        );

        if (res.status?.Status === '1') {
          const token = this.getAuthToken(res);
          const role = String(
            res?.student?.[0]?.Role ??
            res?.user?.Role ??
            res?.user?.role ??
            res?.role ??
            ''
          );
          if (token) {
            this.authService.setToken(token);
          }
          this.authService.setUserId(this.Userid.trim());
          this.authService.setUserRole(role);
          this.authService.setStudentDashboardData(res);
          console.log('Login response:', res);
          console.log('Resolved token:', token);
          console.log('Stored token:', this.authService.getToken());

          if (this.authService.isTeacherRole()) {
            this.router.navigate(['/teacher-dashboard']);
          } else {
            this.router.navigate(['/student-dashboard']);
          }
        }
      },
      error: (err) => {
        this.showStatusToast(
          this.getResponseMessage(err?.error, 'Unable to login. Please try again.'),
          'error'
        );
        console.error('Error:', err);
      }
    });
  }

  private getResponseMessage(source: any, fallback: string): string {
    return String(
      source?.status?.Message ??
      source?.status?.message ??
      source?.message ??
      fallback
    );
  }

  private getAuthToken(source: any): string {
    return String(
      source?.token ??
      source?.Token ??
      source?.accessToken ??
      source?.access_token ??
      source?.data?.token ??
      source?.data?.Token ??
      source?.response?.token ??
      source?.response?.Token ??
      ''
    ).trim();
  }

  private showStatusToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.toastProgress = 100;
    this.toastRemainingMs = this.toastDurationMs;
    this.startToastProgress();
    this.safeDetectChanges();
  }

  hideToast(): void {
    this.clearToastProgress();
    this.showToast = false;
    this.safeDetectChanges();
  }

  restartToastProgress(): void {
    if (!this.showToast) {
      return;
    }
    this.toastProgress = 100;
    this.toastRemainingMs = this.toastDurationMs;
    this.startToastProgress();
    this.safeDetectChanges();
  }

  private startToastProgress(): void {
    this.clearToastProgress();

    const startRemaining = this.toastRemainingMs;
    const startedAt = Date.now();

    this.toastInterval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      this.toastRemainingMs = Math.max(0, startRemaining - elapsed);
      this.toastProgress = (this.toastRemainingMs / this.toastDurationMs) * 100;
      this.safeDetectChanges();

      if (this.toastRemainingMs <= 0) {
        this.hideToast();
      }
    }, 16);
  }

  private clearToastProgress(): void {
    if (this.toastInterval) {
      clearInterval(this.toastInterval);
      this.toastInterval = null;
    }
  }

  private safeDetectChanges(): void {
    if (!this.destroyed) {
      this.cd.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.hideToast();
  }
}
