import { Component, effect, input, signal } from '@angular/core';
import { ImgFallbackDirective } from './ui';

@Component({
  selector: 'app-gallery',
  imports: [ImgFallbackDirective],
  template: `
    <div>
      <div class="gallery-main">
        <img appFallback [src]="current()" [alt]="alt() + ' photo ' + (index() + 1)" />
      </div>
      @if (images().length > 1) {
        <div class="thumbs">
          @for (image of images(); track image; let i = $index) {
            <button type="button" [class.on]="i === index()" (click)="index.set(i)">
              <img appFallback [src]="image" [alt]="alt() + ' thumbnail ' + (i + 1)" />
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class Gallery {
  readonly images = input<string[]>(['placeholder.svg']);
  readonly alt = input('Property');
  readonly index = signal(0);

  constructor() {
    effect(() => {
      this.images();
      this.index.set(0);
    });
  }

  current(): string {
    return this.images()[this.index()] || 'placeholder.svg';
  }
}
