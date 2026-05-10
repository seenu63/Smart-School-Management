import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  imports: [],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  isUserMenuOpen = false;

  get userName(): string {
    return this.authService.getUserId()?.trim() || 'User';
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.isUserMenuOpen = false;
    }
  }

  logout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
