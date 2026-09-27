import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { DataStoreService } from '../core/data-store.service';
import { LOCATIONS } from '../core/labels';
import { activeBundles } from '../core/views';
import { CatalogActions } from '../shared/catalog-actions';
import { PropertyCard } from '../shared/property-card';
import { SearchPanel } from '../shared/search-panel';

@Component({
  selector: 'app-home-page',
  imports: [SearchPanel, PropertyCard, RouterLink],
  template: `
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <p class="eyebrow">Nellore · Buy · Sell · Invest · Grow</p>
          <h1>Find a plot or house in Nellore.</h1>
          <hr class="gold-line" />
          <p class="lede">ManaNelloreRealEstate brings owners, associates and builders onto one local desk, from the first search to the signed deal.</p>
          <p><a class="btn btn-primary btn-sm" routerLink="/guide">See each actor’s flow</a></p>
        </div>
        <app-search-panel layout="hero" />
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Featured</p>
            <h2>Properties people open first</h2>
          </div>
          <a class="btn btn-ghost" routerLink="/properties">All properties</a>
        </div>
        @if (loading()) {
          <div class="card-grid">
            @for (item of skeletons; track item) { <div class="skeleton"></div> }
          </div>
        } @else {
          <div class="card-grid">
            @for (item of featured(); track item.property.id) {
              <app-property-card [bundle]="item" [saved]="actions.isSaved(item.property.id)" (save)="actions.save($event)" (share)="actions.share($event)" />
            }
          </div>
        }
      </div>
    </section>

    <section class="section" style="background:#f6f4ef">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Just listed</p>
            <h2>Latest properties</h2>
          </div>
          <a class="btn btn-dark" routerLink="/buy" [queryParams]="{ kind: 'both', sort: 'newest' }">Search</a>
        </div>
        <div class="card-grid">
          @for (item of latest(); track item.property.id) {
            <app-property-card [bundle]="item" [saved]="actions.isSaved(item.property.id)" (save)="actions.save($event)" (share)="actions.share($event)" />
          }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">Neighbourhoods</p>
            <h2>Popular locations</h2>
          </div>
        </div>
        <div class="loc-grid">
          @for (location of locationCards(); track location.name) {
            <a class="loc-card" routerLink="/buy" [queryParams]="{ kind: 'both', location: location.name }">
              <strong>{{ location.name }}</strong>
              <span class="muted">{{ location.count }} active listings</span>
            </a>
          }
        </div>
      </div>
    </section>

    <section class="section" style="background:#0b0f14;color:white">
      <div class="container">
        <div class="section-head">
          <div>
            <p class="eyebrow">How a deal happens</p>
            <h2>From property to possession</h2>
          </div>
        </div>
        <div class="steps">
          @for (step of steps; track step.title) {
            <article class="step"><em>{{ step.no }}</em><h3>{{ step.title }}</h3><p>{{ step.text }}</p></article>
          }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head"><div><p class="eyebrow">Why ManaNellore</p><h2>A local desk, not a generic portal</h2></div></div>
        <div class="why-grid">
          <article class="why-card"><strong>Verified before it is listed</strong><p class="muted">Owners, associates and builders submit properties. Admin approves them before buyers see a listing.</p></article>
          <article class="why-card"><strong>Search that matches the land</strong><p class="muted">Plot search asks about facing, road width and approval. House search asks about BHK, area and age.</p></article>
          <article class="why-card"><strong>A lead is a record, not a login</strong><p class="muted">When a buyer is interested, the platform opens a lead that can move through a visit, negotiation and deal.</p></article>
          <article class="why-card"><strong>People who actually work the file</strong><p class="muted">Associates refer buyers, builders release project units, and admin assigns the site visit.</p></article>
        </div>
        <div class="cta-band" style="margin-top:28px">
          <div>
            <h2>Have a plot or house in Nellore?</h2>
            <p>List it with ManaNellore. Admin will verify the sample submission in this demo.</p>
          </div>
          <a class="btn btn-primary" routerLink="/sell">Sell / List property</a>
        </div>
      </div>
    </section>
  `,
})
export class HomePage {
  private readonly store = inject(DataStoreService);
  readonly actions = inject(CatalogActions);
  readonly loading = signal(true);
  readonly skeletons = [1, 2, 3];
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly featured = computed(() =>
    activeBundles(this.state())
      .filter((item) => item.listing?.featured)
      .slice(0, 6),
  );
  readonly latest = computed(() =>
    [...activeBundles(this.state())].sort((a, b) => (b.listing?.createdAt ?? '').localeCompare(a.listing?.createdAt ?? '')).slice(0, 6),
  );
  readonly locationCards = computed(() => {
    const bundles = activeBundles(this.state());
    return LOCATIONS.map((name) => ({
      name,
      count: bundles.filter((item) => item.property.location === name).length,
    }));
  });
  readonly steps = [
    { no: '01', title: 'Property', text: 'The real plot or house, with one owner or builder.' },
    { no: '02', title: 'Listing', text: 'The offer buyers see: price, status and who listed it.' },
    { no: '03', title: 'Search', text: 'Buyers filter plots and houses differently.' },
    { no: '04', title: 'Enquiry', text: 'Interest from the website becomes a message.' },
    { no: '05', title: 'Lead', text: 'The CRM record shared by admin and associate.' },
    { no: '06', title: 'Site visit', text: 'A date, a time, and someone assigned to attend.' },
    { no: '07', title: 'Negotiation', text: 'Price and terms while the lead stays open.' },
    { no: '08', title: 'Deal', text: 'Booking, confirmation and commission.' },
  ];

  constructor() {
    inject(Title).setTitle('ManaNelloreRealEstate');
    setTimeout(() => this.loading.set(false), 350);
  }
}
