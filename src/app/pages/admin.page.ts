import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { DataStoreService } from '../core/data-store.service';
import { ListingService } from '../core/listing.service';
import { AdminService } from '../core/admin.service';
import {
  LISTING_STATUS_LABEL,
  PROJECT_STATUS_LABEL,
  PROPERTY_STATUS_LABEL,
  ROLE_LABEL,
  TYPE_LABEL,
} from '../core/labels';
import { ListingStatus, PropertyStatus } from '../core/models';
import { PropertyService } from '../core/property.service';
import { ToastService } from '../core/toast.service';
import { bundleProperty } from '../core/views';
import { ImgFallbackDirective, InrPipe, Modal } from '../shared/ui';

@Component({
  selector: 'app-admin-properties-page',
  imports: [RouterLink, InrPipe, DatePipe, ImgFallbackDirective, Modal, ReactiveFormsModule],
  template: `
    <section class="dash-page">
      <div class="dash-head">
        <div><p class="eyebrow">Verification</p><h1>Properties</h1></div>
        <a class="btn btn-primary" routerLink="/admin/properties/new">Add property</a>
      </div>
      <div class="chips" style="margin-bottom:12px">
        <button type="button" class="btn btn-sm" [class.btn-dark]="tab() === 'pending'" [class.btn-ghost]="tab() !== 'pending'" (click)="tab.set('pending')">Pending</button>
        <button type="button" class="btn btn-sm" [class.btn-dark]="tab() === 'all'" [class.btn-ghost]="tab() !== 'all'" (click)="tab.set('all')">All</button>
      </div>
      <div class="card-grid">
        @for (item of items(); track item.property.id) {
          <article class="property-card">
            <img appFallback [src]="item.property.images[0]" [alt]="item.property.title" style="height:150px;width:100%;object-fit:cover" />
            <div class="card-body">
              <span class="pill" [attr.data-status]="item.property.status">{{ statusLabel[item.property.status] }}</span>
              <strong>{{ item.property.id }} · {{ item.property.title }}</strong>
              <span>{{ typeLabel[item.property.type] }} · {{ item.property.location }} · {{ item.property.askingPrice | inr }}</span>
              <span class="muted">Submitted by {{ item.submitter?.name }} · {{ roleLabel[item.property.submittedByRole] }} · {{ item.property.submittedAt | date: 'mediumDate' }}</span>
              @if (item.property.adminNote) { <p class="hint">{{ item.property.adminNote }}</p> }
              <a [routerLink]="['/property', item.property.id]">Open details</a>
              <div class="row-actions">
                @if (item.property.status === 'submitted') { <button type="button" class="btn btn-ghost btn-sm" (click)="mark(item.property.id, 'under_verification')">Under verification</button> }
                @if (item.property.status !== 'listed' && item.property.status !== 'rejected') { <button type="button" class="btn btn-ghost btn-sm" (click)="mark(item.property.id, 'approved')">Approve</button> }
                @if (item.property.status === 'approved' || item.property.status === 'submitted' || item.property.status === 'under_verification') {
                  <button type="button" class="btn btn-primary btn-sm" (click)="publish(item.property.id)">Approve and publish</button>
                }
                <button type="button" class="btn btn-ghost btn-sm" (click)="ask(item.property.id, 'changes')">Request changes</button>
                <button type="button" class="btn btn-danger btn-sm" (click)="ask(item.property.id, 'reject')">Reject</button>
              </div>
            </div>
          </article>
        }
      </div>
    </section>
    <app-modal [open]="!!noteFor()" [title]="noteMode() === 'reject' ? 'Reject property' : 'Request changes'" (closed)="noteFor.set(null)">
      <div class="field"><label for="note">Note to the submitter</label><textarea id="note" [value]="note()" (input)="note.set($any($event.target).value)"></textarea></div>
      <button type="button" class="btn btn-primary" (click)="sendNote()">Save decision</button>
    </app-modal>
  `,
})
export class AdminPropertiesPage {
  private readonly store = inject(DataStoreService);
  private readonly properties = inject(PropertyService);
  private readonly listings = inject(ListingService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly statusLabel = PROPERTY_STATUS_LABEL;
  readonly typeLabel = TYPE_LABEL;
  readonly roleLabel = ROLE_LABEL;
  readonly tab = signal<'pending' | 'all'>('pending');
  readonly noteFor = signal<string | null>(null);
  readonly noteMode = signal<'reject' | 'changes'>('changes');
  readonly note = signal('');
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly items = computed(() => {
    const pending: PropertyStatus[] = ['submitted', 'under_verification', 'changes_requested', 'approved'];
    return this.state().properties
      .filter((property) => this.tab() === 'all' || pending.includes(property.status))
      .map((property) => bundleProperty(this.state(), property));
  });

  mark(id: string, status: PropertyStatus): void {
    this.properties.setStatus(id, status);
    this.toast.show(`Property marked ${PROPERTY_STATUS_LABEL[status]}.`);
  }

  publish(id: string): void {
    const user = this.auth.getCurrentUser();
    if (!user) return;
    this.listings.publish(id, user);
    this.toast.show('Approved and published as an active listing.');
  }

  ask(id: string, mode: 'reject' | 'changes'): void {
    this.noteFor.set(id);
    this.noteMode.set(mode);
    this.note.set('');
  }

  sendNote(): void {
    const id = this.noteFor();
    if (!id || this.note().trim().length < 8) {
      this.toast.show('Add a short note first.', 'error');
      return;
    }
    this.properties.setStatus(id, this.noteMode() === 'reject' ? 'rejected' : 'changes_requested', this.note().trim());
    this.noteFor.set(null);
    this.toast.show(this.noteMode() === 'reject' ? 'Property rejected.' : 'Changes requested.');
  }
}

@Component({
  selector: 'app-admin-listings-page',
  imports: [RouterLink, InrPipe],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Catalogue</p><h1>Listings</h1></div></div>
      <div class="table-wrap">
        <table class="responsive">
          <thead><tr><th>Listing</th><th>Property</th><th>Type</th><th>Price</th><th>Listed by</th><th>Status</th><th>Featured</th></tr></thead>
          <tbody>
            @for (row of rows(); track row.listing.id) {
              <tr>
                <td data-label="Listing">{{ row.listing.id }}</td>
                <td data-label="Property"><a [routerLink]="['/property', row.property.id]">{{ row.property.title }}</a></td>
                <td data-label="Type">{{ typeLabel[row.property.type] }}</td>
                <td data-label="Price">
                  <input type="number" [value]="row.listing.price" (change)="price(row.listing.id, $event)" style="width:120px" />
                  <div class="muted">{{ row.listing.price | inr }}</div>
                </td>
                <td data-label="Listed by">{{ row.listedBy?.name }} · {{ roleLabel[row.listing.listedByRole] }}</td>
                <td data-label="Status">
                  <select [value]="row.listing.status" (change)="status(row.listing.id, $event)">
                    @for (item of listingStatuses; track item) { <option [value]="item">{{ listingLabel[item] }}</option> }
                  </select>
                </td>
                <td data-label="Featured"><button type="button" class="btn btn-ghost btn-sm" (click)="feature(row.listing.id)">{{ row.listing.featured ? 'Featured' : 'Feature' }}</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class AdminListingsPage {
  private readonly store = inject(DataStoreService);
  private readonly listings = inject(ListingService);
  private readonly toast = inject(ToastService);
  readonly typeLabel = TYPE_LABEL;
  readonly roleLabel = ROLE_LABEL;
  readonly listingLabel = LISTING_STATUS_LABEL;
  readonly listingStatuses: ListingStatus[] = ['active', 'paused', 'sold', 'expired'];
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly rows = computed(() =>
    this.state().listings
      .map((listing) => {
        const property = this.state().properties.find((item) => item.id === listing.propertyId);
        if (!property) return null;
        return { listing, property, listedBy: this.state().users.find((user) => user.id === listing.listedById) };
      })
      .filter((row): row is NonNullable<typeof row> => !!row),
  );

  price(id: string, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value) || value <= 0) return;
    this.listings.setPrice(id, value);
    this.toast.show('Listing price updated.');
  }

  status(id: string, event: Event): void {
    this.listings.setStatus(id, (event.target as HTMLSelectElement).value as ListingStatus);
    this.toast.show('Listing status updated.');
  }

  feature(id: string): void {
    this.listings.toggleFeatured(id);
  }
}

@Component({
  selector: 'app-admin-projects-page',
  imports: [RouterLink, ImgFallbackDirective],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Developers</p><h1>Projects</h1></div><a class="btn btn-primary" routerLink="/admin/projects/new">Add project</a></div>
      <div class="card-grid">
        @for (project of projects(); track project.id) {
          <article class="project-card" style="overflow:hidden">
            <img appFallback [src]="project.images[0]" [alt]="project.name" style="height:140px;width:100%;object-fit:cover" />
            <div class="card-body">
              <span class="pill" [attr.data-status]="project.status">{{ statusLabel[project.status] }}</span>
              <h3>{{ project.name }}</h3>
              <p class="muted">{{ project.developerName }} · {{ project.location }}</p>
              <p>{{ units(project.id) }} units on the platform</p>
              <a [routerLink]="['/project', project.id]">Open project</a>
            </div>
          </article>
        }
      </div>
    </section>
  `,
})
export class AdminProjectsPage {
  private readonly store = inject(DataStoreService);
  readonly statusLabel = PROJECT_STATUS_LABEL;
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly projects = computed(() => this.state().projects);

  units(projectId: string): number {
    return this.state().properties.filter((property) => property.projectId === projectId).length;
  }
}

@Component({
  selector: 'app-admin-reports-page',
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Insight</p><h1>Reports</h1><p class="muted">Counts from the sample records in this browser.</p></div></div>
      <div class="split">
        <section class="panel"><h3>Properties by type</h3><div class="bars">@for (bar of byType(); track bar.label) { <div class="bar"><span>{{ bar.label }}</span><i [style.width.%]="bar.width"></i><b>{{ bar.count }}</b></div> }</div></section>
        <section class="panel"><h3>Leads by status</h3><div class="bars">@for (bar of byLead(); track bar.label) { <div class="bar"><span>{{ bar.label }}</span><i [style.width.%]="bar.width"></i><b>{{ bar.count }}</b></div> }</div></section>
        <section class="panel"><h3>Listings by location</h3><div class="bars">@for (bar of byLocation(); track bar.label) { <div class="bar"><span>{{ bar.label }}</span><i [style.width.%]="bar.width"></i><b>{{ bar.count }}</b></div> }</div></section>
        <section class="panel"><h3>Deals by status</h3><div class="bars">@for (bar of byDeal(); track bar.label) { <div class="bar"><span>{{ bar.label }}</span><i [style.width.%]="bar.width"></i><b>{{ bar.count }}</b></div> }</div></section>
      </div>
    </section>
  `,
})
export class AdminReportsPage {
  private readonly store = inject(DataStoreService);
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly byType = computed(() => bars(count(this.state().properties.map((property) => TYPE_LABEL[property.type]))));
  readonly byLead = computed(() => bars(count(this.state().leads.map((lead) => lead.status.replaceAll('_', ' ')))));
  readonly byLocation = computed(() => {
    const active = new Set(this.state().listings.filter((listing) => listing.status === 'active').map((listing) => listing.propertyId));
    return bars(count(this.state().properties.filter((property) => active.has(property.id)).map((property) => property.location)));
  });
  readonly byDeal = computed(() => bars(count(this.state().deals.map((deal) => deal.status))));
}

@Component({
  selector: 'app-admin-settings-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Platform</p><h1>Settings</h1></div></div>
      <form class="panel" [formGroup]="form" (ngSubmit)="save()">
        <div class="form-grid">
          <div class="field"><label>Brand</label><input formControlName="brandName" /></div>
          <div class="field"><label>Tagline</label><input formControlName="tagline" /></div>
          <div class="field"><label>Support email</label><input formControlName="supportEmail" /></div>
          <div class="field"><label>Support phone</label><input formControlName="supportPhone" /></div>
          <div class="field span-2"><label>Office</label><input formControlName="officeAddress" /></div>
        </div>
        <div class="row-actions">
          <button class="btn btn-primary" type="submit">Save settings</button>
          <button class="btn btn-danger" type="button" (click)="reset()">Reset demo data</button>
        </div>
      </form>
    </section>
  `,
})
export class AdminSettingsPage {
  private readonly store = inject(DataStoreService);
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly form = this.fb.nonNullable.group({
    brandName: [this.store.snapshot.settings.brandName, Validators.required],
    tagline: [this.store.snapshot.settings.tagline, Validators.required],
    supportEmail: [this.store.snapshot.settings.supportEmail, [Validators.required, Validators.email]],
    supportPhone: [this.store.snapshot.settings.supportPhone, Validators.required],
    officeAddress: [this.store.snapshot.settings.officeAddress, Validators.required],
  });

  save(): void {
    if (this.form.invalid) return;
    this.admin.updateSettings(this.form.getRawValue());
    this.toast.show('Settings saved in this browser.');
  }

  async reset(): Promise<void> {
    const ok = await this.confirm.ask('Restore the original sample properties, leads and visits?', 'Reset demo data', 'Reset', 'Cancel', true);
    if (!ok) return;
    this.admin.resetDemo();
    const settings = this.store.snapshot.settings;
    this.form.reset(settings);
    this.toast.show('Demo data restored.');
  }
}

function count(values: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return map;
}

function bars(map: Map<string, number>): { label: string; count: number; width: number }[] {
  const max = Math.max(1, ...map.values());
  return [...map.entries()].map(([label, itemCount]) => ({ label, count: itemCount, width: Math.round((itemCount / max) * 100) }));
}
