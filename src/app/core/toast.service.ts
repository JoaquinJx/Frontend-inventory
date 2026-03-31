import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<ToastMessage | null>(null);

  private nextId = 1;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  show(text: string, durationMs = 2600): void {
    const id = this.nextId++;
    this.message.set({ id, text });

    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }

    this.timeoutHandle = setTimeout(() => {
      const current = this.message();
      if (current?.id === id) {
        this.message.set(null);
      }
    }, durationMs);
  }

  dismiss(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    this.message.set(null);
  }
}
