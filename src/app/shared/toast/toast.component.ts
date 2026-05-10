import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ToastService, ToastState } from '../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: ToastState = { message: '', type: 'success', visible: false };
  toastProgress = 100;
  private readonly toastDurationMs = 3000;
  private toastRemainingMs = this.toastDurationMs;
  private toastInterval: ReturnType<typeof setInterval> | null = null;
  private sub?: Subscription;

  constructor(
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.toastService.toast$().subscribe((toast) => {
      this.toast = toast;
      if (toast.visible) {
        this.resetTimer();
      } else {
        this.clearTimer();
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.clearTimer();
  }

  hide(): void {
    this.toastService.hide();
  }

  restart(): void {
    if (!this.toast.visible) {
      return;
    }
    this.resetTimer();
  }

  private resetTimer(): void {
    this.clearTimer();
    this.toastRemainingMs = this.toastDurationMs;
    this.toastProgress = 100;
    const startedAt = Date.now();
    const startRemaining = this.toastRemainingMs;

    this.toastInterval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      this.toastRemainingMs = Math.max(0, startRemaining - elapsed);
      this.toastProgress = (this.toastRemainingMs / this.toastDurationMs) * 100;
      // Trigger view update for progress bar under OnPush change detection
      this.cdr.markForCheck();
      if (this.toastRemainingMs <= 0) {
        this.hide();
      }
    }, 16);
  }

  private clearTimer(): void {
    if (this.toastInterval) {
      clearInterval(this.toastInterval);
      this.toastInterval = null;
    }
  }
}
