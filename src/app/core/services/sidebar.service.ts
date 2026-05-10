import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private currentViewSubject = new BehaviorSubject<string>('dashboard');
  currentView$ = this.currentViewSubject.asObservable();

  setView(view: string) {
    this.currentViewSubject.next(view);
  }
}
