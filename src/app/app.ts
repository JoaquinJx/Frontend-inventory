import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  protected readonly cart = inject(CartService);
  protected readonly toast = inject(ToastService);
  protected readonly theme = inject(ThemeService);
  protected readonly menuOpen = signal(false);

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
