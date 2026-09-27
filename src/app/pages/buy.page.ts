import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { DataStoreService } from '../core/data-store.service';
import { matchesCriteria, parseCriteria, sortBundles } from '../core/search';
import { activeBundles } from '../core/views';
import { CatalogActions } from '../shared/catalog-actions';
import { PropertyCard } from '../shared/property-card';
import { SearchPanel } from '../shared/search-panel';
import { Pager } from '../shared/ui';

@Component({
  selector: 'app-buy-page',
  imports: [SearchPanel, PropertyCard, Pager],
  template: `
    <section class="page">
      <div class="container">
        <div class="page-head">
          <div>
            <p class="eyebrow">Buy</p>
            <h1>Properties for you</h1>
            <p class="muted">{{ summary() }}</p>
          </div>
          <button type="button" class="btn btn-dark filters-toggle" (click)="filtersOpen.set(true)">Filters</button>
        </div>
        <div class="buy-layout">
          <aside class="filter-col" [class.open]="filtersOpen()" (click)="filtersOpen.set(false)">
            <div (click)="$event.stopPropagation()">
              <app-search-panel layout="sidebar" (searched)="filtersOpen.set(false)" />
            </div>
          </aside>
          <div>
            <div class="toolbar">
              <strong>{{ filtered().length }} properties</strong>
              <label class="field" style="min-width:180px">
                <span class="muted">Sort</span>
                <select [value]="criteria().sort" (change)="setSort($event)">
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="area">Largest area</option>
                </select>
              </label>
            </div>
            @if (loading()) {
              <div class="card-grid">
                @for (item of [1, 2, 3, 4]; track item) { <div class="skeleton"></div> }
              </div>
            } @else if (!paged().length) {
              <div class="empty">
                <h3>No properties match these filters</h3>
                <p class="muted">Try another location, a wider budget, or switch between Plot, House and Both.</p>
              </div>
            } @else {
              <div class="card-grid">
                @for (item of paged(); track item.property.id) {
                  <app-property-card [bundle]="item" [saved]="actions.isSaved(item.property.id)" (save)="actions.save($event)" (share)="actions.share($event)" />
                }
              </div>
              <app-pager [page]="page()" [pages]="pageCount()" (pageChange)="setPage($event)" />
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class BuyPage {
  private readonly store = inject(DataStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly actions = inject(CatalogActions);
  readonly filtersOpen = signal(false);
  readonly loading = signal(true);
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  private readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly criteria = computed(() => parseCriteria((key) => this.params().get(key)));
  readonly filtered = computed(() =>
    sortBundles(
      activeBundles(this.state()).filter((item) => matchesCriteria(item, this.criteria())),
      this.criteria().sort,
    ),
  );
  readonly page = computed(() => Math.max(1, Number(this.params().get('page') || '1')));
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / 9)));
  readonly paged = computed(() => this.filtered().slice((this.page() - 1) * 9, this.page() * 9));
  readonly summary = computed(() => {
    const criteria = this.criteria();
    const kind = criteria.kind === 'both' ? 'Plots and houses' : criteria.kind === 'plot' ? 'Plots' : 'Houses';
    return criteria.location ? `${kind} in ${criteria.location}` : `${kind} across Nellore`;
  });

  constructor() {
    inject(Title).setTitle('Buy property | ManaNelloreRealEstate');
    setTimeout(() => this.loading.set(false), 280);
  }

  setSort(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { sort, page: 1 }, queryParamsHandling: 'merge' });
  }

  setPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page }, queryParamsHandling: 'merge' });
  }
}
