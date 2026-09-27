import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { DataStoreService } from '../core/data-store.service';
import { PropertyType } from '../core/models';
import { TYPE_LABEL } from '../core/labels';
import { activeBundles } from '../core/views';
import { CatalogActions } from '../shared/catalog-actions';
import { PropertyCard } from '../shared/property-card';
import { Pager } from '../shared/ui';

@Component({
  selector: 'app-browse-page',
  imports: [PropertyCard, Pager],
  template: `
    <section class="page">
      <div class="container">
        <div class="page-head">
          <div>
            <p class="eyebrow">Catalogue</p>
            <h1>Properties</h1>
            <p class="muted">Active sample listings, including villas and apartments from builder projects.</p>
          </div>
        </div>
        <div class="toolbar">
          <div class="chips">
            <button type="button" class="btn btn-sm" [class.btn-dark]="type() === 'all'" [class.btn-ghost]="type() !== 'all'" (click)="choose('all')">All</button>
            @for (option of types; track option) {
              <button type="button" class="btn btn-sm" [class.btn-dark]="type() === option" [class.btn-ghost]="type() !== option" (click)="choose(option)">{{ labels[option] }}</button>
            }
          </div>
          <label class="field" style="min-width:220px">
            <span class="muted">Search</span>
            <input [value]="query()" (input)="onQuery($event)" placeholder="Title or location" />
          </label>
        </div>
        @if (!paged().length) {
          <div class="empty"><h3>Nothing in this view</h3><p class="muted">Clear the search or pick another type.</p></div>
        } @else {
          <div class="card-grid">
            @for (item of paged(); track item.property.id) {
              <app-property-card [bundle]="item" [saved]="actions.isSaved(item.property.id)" (save)="actions.save($event)" (share)="actions.share($event)" />
            }
          </div>
          <app-pager [page]="page()" [pages]="pageCount()" (pageChange)="page.set($event)" />
        }
      </div>
    </section>
  `,
})
export class BrowsePage {
  private readonly store = inject(DataStoreService);
  readonly actions = inject(CatalogActions);
  readonly labels = TYPE_LABEL;
  readonly types: PropertyType[] = ['plot', 'house', 'villa', 'apartment'];
  readonly type = signal<'all' | PropertyType>('all');
  readonly query = signal('');
  readonly page = signal(1);
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return activeBundles(this.state())
      .filter((item) => this.type() === 'all' || item.property.type === this.type())
      .filter((item) => !query || `${item.property.title} ${item.property.location}`.toLowerCase().includes(query))
      .sort((a, b) => (b.listing?.createdAt ?? '').localeCompare(a.listing?.createdAt ?? ''));
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / 9)));
  readonly paged = computed(() => this.filtered().slice((this.page() - 1) * 9, this.page() * 9));

  constructor() {
    inject(Title).setTitle('Properties | ManaNelloreRealEstate');
  }

  choose(type: 'all' | PropertyType): void {
    this.type.set(type);
    this.page.set(1);
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }
}
