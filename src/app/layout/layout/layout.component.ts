import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { filter, Subscription } from 'rxjs';
import { ToastComponent } from '../../shared/toast/toast.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet,
    TopbarComponent,
    SidebarComponent,
    ToastComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit, OnDestroy {
  collapsed = false;
  showTeacherBackButton = false;
  private navSub?: Subscription;

  constructor(
    private ngZone: NgZone,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateTeacherBackButtonState(this.router.url);
    this.navSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEnd = event as NavigationEnd;
        this.updateTeacherBackButtonState(navEnd.urlAfterRedirects);
        this.cd.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
    });
  }

  goToTeacherDashboard(): void {
    this.router.navigate(['/teacher-dashboard']);
  }

  private updateTeacherBackButtonState(url: string): void {
    const [path, queryString] = (url || '').split('?');
    const isStudentPage = path.startsWith('/student');
    const params = new URLSearchParams(queryString ?? '');
    this.showTeacherBackButton = isStudentPage && params.get('from') === 'teacher';
  }

}
