import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartService } from './core/cart.service';
import { ToastService } from './core/toast.service';
import { ThemeName, ThemeService } from './core/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly router = inject(Router);
  private readonly viewportScroller = inject(ViewportScroller);
  protected readonly cart = inject(CartService);
  protected readonly toast = inject(ToastService);
  protected readonly theme = inject(ThemeService);
  protected readonly menuOpen = signal(false);

  protected goHome(event: Event): void {
    event.preventDefault();
    this.closeMenu();

    const isHomeRoute = this.router.url === '/' || this.router.url.startsWith('/?');

    if (isHomeRoute) {
      this.viewportScroller.scrollToPosition([0, 0]);
      return;
    }

    void this.router.navigate(['/']).then(() => {
      this.viewportScroller.scrollToPosition([0, 0]);
    });
  }

  protected setTheme(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value as ThemeName;
    this.theme.setTheme(selected);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((current) => !current);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
