import { Injectable, signal } from '@angular/core';

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly current = signal<ConfirmRequest | null>(null);

  ask(message: string, title = 'Please confirm', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false): Promise<boolean> {
    return new Promise((resolve) => {
      this.current.set({ title, message, confirmLabel, cancelLabel, danger, resolve });
    });
  }

  answer(value: boolean): void {
    const current = this.current();
    this.current.set(null);
    current?.resolve(value);
  }
}
