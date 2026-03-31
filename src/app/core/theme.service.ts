import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeName = 'sunset-pop' | 'ocean-glow' | 'mint-fizz';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'mercat_theme_v1';

  readonly currentTheme = signal<ThemeName>('sunset-pop');
  readonly themes: ThemeName[] = ['sunset-pop', 'ocean-glow', 'mint-fizz'];

  constructor() {
    this.hydrateTheme();
  }

  setTheme(theme: ThemeName): void {
    this.currentTheme.set(theme);
    this.document.body.setAttribute('data-theme', theme);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, theme);
    }
  }

  private hydrateTheme(): void {
    if (typeof localStorage === 'undefined') {
      this.setTheme('sunset-pop');
      return;
    }

    const saved = localStorage.getItem(this.storageKey) as ThemeName | null;
    if (saved && this.themes.includes(saved)) {
      this.setTheme(saved);
      return;
    }

    this.setTheme('sunset-pop');
  }
}
