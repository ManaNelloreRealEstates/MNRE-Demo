import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<ToastMessage[]>([]);
  readonly toasts = this.items.asReadonly();
  private next = 1;

  show(text: string, type: ToastMessage['type'] = 'success'): void {
    const id = this.next++;
    this.items.update((list) => [...list, { id, text, type }]);
    setTimeout(() => this.dismiss(id), 3600);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((item) => item.id !== id));
  }
}
