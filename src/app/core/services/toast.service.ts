import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error';

export interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastSubject = new BehaviorSubject<ToastState>({
    message: '',
    type: 'success',
    visible: false
  });

  toast$(): Observable<ToastState> {
    return this.toastSubject.asObservable();
  }

  show(message: string, type: ToastType = 'success'): void {
    this.toastSubject.next({ message, type, visible: true });
  }

  hide(): void {
    const current = this.toastSubject.value;
    this.toastSubject.next({ ...current, visible: false });
  }
}
