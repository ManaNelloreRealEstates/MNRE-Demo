import { Component, Directive, HostListener, Pipe, PipeTransform, inject, input, output } from '@angular/core';
import { formatInr } from '../core/format';
import { ConfirmService } from '../core/confirm.service';
import { ToastService } from '../core/toast.service';

@Pipe({ name: 'inr' })
export class InrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatInr(value);
  }
}

@Directive({ selector: 'img[appFallback]' })
export class ImgFallbackDirective {
  @HostListener('error', ['$event'])
  onError(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (!image.src.includes('placeholder.svg')) image.src = 'placeholder.svg';
  }
}

@Component({
  selector: 'app-toast-host',
  template: `
    <div class="toast-wrap" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <button type="button" class="toast" [attr.data-type]="toast.type" (click)="toasts.dismiss(toast.id)">
          {{ toast.text }}
        </button>
      }
    </div>
  `,
})
export class ToastHost {
  readonly toasts = inject(ToastService);
}

@Component({
  selector: 'app-confirm-host',
  template: `
    @if (confirm.current(); as current) {
      <div class="modal-back">
        <div class="modal-panel" role="dialog" aria-modal="true">
          <h3>{{ current.title }}</h3>
          <p>{{ current.message }}</p>
          <div class="row-actions">
            <button type="button" class="btn btn-ghost" (click)="confirm.answer(false)">{{ current.cancelLabel }}</button>
            <button type="button" class="btn" [class.btn-primary]="!current.danger" [class.btn-danger]="current.danger" (click)="confirm.answer(true)">
              {{ current.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmHost {
  readonly confirm = inject(ConfirmService);
}

@Component({
  selector: 'app-modal',
  template: `
    @if (open()) {
      <div class="modal-back" (click)="closed.emit()">
        <div class="modal-panel" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h3>{{ title() }}</h3>
            <button type="button" class="icon-btn" style="display:inline-flex;color:#0b0f14" (click)="closed.emit()" aria-label="Close">×</button>
          </div>
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class Modal {
  readonly open = input(false);
  readonly title = input('');
  readonly closed = output<void>();
}

@Component({
  selector: 'app-pager',
  template: `
    @if (pages() > 1) {
      <div class="pager">
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="pageChange.emit(page() - 1)">Previous</button>
        <span>Page {{ page() }} of {{ pages() }}</span>
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() >= pages()" (click)="pageChange.emit(page() + 1)">Next</button>
      </div>
    }
  `,
})
export class Pager {
  readonly page = input(1);
  readonly pages = input(1);
  readonly pageChange = output<number>();
}
