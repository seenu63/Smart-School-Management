import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed: boolean = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  private currentPath = '';
  private currentQuery: Record<string, string> = {};
  private navSub?: Subscription;

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateCurrentPath(this.router.url);
    this.navSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEnd = event as NavigationEnd;
        this.updateCurrentPath(navEnd.urlAfterRedirects);
        this.cd.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  get showTeacherMenu(): boolean {
    return this.currentPath.startsWith('/teacher');
  }

  get showStudentMenu(): boolean {
    return this.currentPath.startsWith('/student');
  }

  get studentQueryParams(): Record<string, string> | null {
    if (this.currentQuery['from'] !== 'teacher') {
      return null;
    }

    const query: Record<string, string> = { from: 'teacher' };
    const classNo = this.currentQuery['classNo'];
    if (classNo) {
      query['classNo'] = classNo;
    }
    return query;
  }

  private updateCurrentPath(url: string): void {
    const [path, queryString] = (url || '').split('?');
    this.currentPath = path;
    this.currentQuery = {};

    if (!queryString) {
      return;
    }

    const params = new URLSearchParams(queryString);
    params.forEach((value, key) => {
      this.currentQuery[key] = value;
    });
  }
}
