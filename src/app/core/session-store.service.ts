import { computed, Injectable, signal } from '@angular/core';

interface SessionSnapshot {
  token: string;
  refreshToken: string;
  role: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class SessionStoreService {
  private readonly storageKey = 'mercat_session_v1';

  readonly token = signal('');
  readonly refreshToken = signal('');
  readonly role = signal('');
  readonly username = signal('');

  readonly isAuthenticated = computed(() => this.token().length > 0);
  readonly isAdmin = computed(() => this.role().toLowerCase().includes('admin'));

  constructor() {
    this.hydrate();
  }

  setSession(snapshot: Partial<SessionSnapshot>): void {
    this.token.set(snapshot.token ?? '');
    this.refreshToken.set(snapshot.refreshToken ?? '');
    this.role.set(snapshot.role ?? '');
    this.username.set(snapshot.username ?? '');
    this.persist();
  }

  clearSession(): void {
    this.token.set('');
    this.refreshToken.set('');
    this.role.set('');
    this.username.set('');

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  private hydrate(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SessionSnapshot>;
      this.token.set(parsed.token ?? '');
      this.refreshToken.set(parsed.refreshToken ?? '');
      this.role.set(parsed.role ?? '');
      this.username.set(parsed.username ?? '');
    } catch {
      this.clearSession();
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const snapshot: SessionSnapshot = {
      token: this.token(),
      refreshToken: this.refreshToken(),
      role: this.role(),
      username: this.username(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
  }
}