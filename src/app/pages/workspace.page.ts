import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AssociateService } from '../core/associate.service';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { DataStoreService } from '../core/data-store.service';
import { PIPELINE, PROJECT_STATUS_LABEL, PROPERTY_STATUS_LABEL, TYPE_LABEL } from '../core/labels';
import { PropertyService } from '../core/property.service';
import { ToastService } from '../core/toast.service';
import { LOCATIONS } from '../core/labels';
import { activeBundles, bundleProperty } from '../core/views';
import { CatalogActions } from '../shared/catalog-actions';
import { PropertyCard } from '../shared/property-card';
import { ImgFallbackDirective, InrPipe } from '../shared/ui';

@Component({
  selector: 'app-saved-page',
  imports: [PropertyCard, RouterLink],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Shortlist</p><h1>Saved properties</h1></div><a class="btn btn-dark" routerLink="/buy">Find more</a></div>
      @if (!items().length) {
        <div class="empty"><h3>Nothing saved yet</h3><p class="muted">Use Save on a property card.</p></div>
      } @else {
        <div class="card-grid">
          @for (item of items(); track item.property.id) {
            <app-property-card [bundle]="item" [saved]="true" (save)="actions.save($event)" (share)="actions.share($event)" />
          }
        </div>
      }
    </section>
  `,
})
export class SavedPage {
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  readonly actions = inject(CatalogActions);
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly items = computed(() => {
    const user = this.user();
    if (!user) return [];
    const ids = new Set(this.state().favorites.filter((item) => item.userId === user.id).map((item) => item.propertyId));
    return this.state().properties.filter((property) => ids.has(property.id)).map((property) => bundleProperty(this.state(), property));
  });
}

@Component({
  selector: 'app-owner-properties-page',
  imports: [RouterLink, InrPipe, ImgFallbackDirective],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Portfolio</p><h1>My properties</h1></div><a class="btn btn-primary" routerLink="/owner/properties/new">Add property</a></div>
      <div class="card-grid">
        @for (item of items(); track item.property.id) {
          <article class="property-card">
            <img appFallback [src]="item.property.images[0]" [alt]="item.property.title" style="height:160px;width:100%;object-fit:cover" />
            <div class="card-body">
              <span class="pill" [attr.data-status]="item.property.status">{{ statusLabel[item.property.status] }}</span>
              <strong>{{ item.property.title }}</strong>
              <span>{{ item.property.location }} · {{ item.property.askingPrice | inr }}</span>
              <div class="pipeline">
                @for (step of pipeline; track step) {
                  <span [class.done]="reached(item.property.status, step)">{{ statusLabel[step] }}</span>
                }
              </div>
              @if (item.property.adminNote) { <p class="hint">{{ item.property.adminNote }}</p> }
              <div class="row-actions">
                <a class="btn btn-ghost btn-sm" [routerLink]="['/property', item.property.id]">View</a>
                @if (item.property.status === 'draft' || item.property.status === 'changes_requested') {
                  <a class="btn btn-dark btn-sm" [routerLink]="['/owner/properties', item.property.id, 'edit']">Edit</a>
                }
                @if (item.property.status === 'draft') {
                  <button type="button" class="btn btn-primary btn-sm" (click)="submit(item.property.id)">Submit</button>
                  <button type="button" class="btn btn-danger btn-sm" (click)="remove(item.property.id)">Delete</button>
                }
              </div>
            </div>
          </article>
        }
      </div>
    </section>
  `,
})
export class OwnerPropertiesPage {
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly properties = inject(PropertyService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly statusLabel = PROPERTY_STATUS_LABEL;
  readonly pipeline = PIPELINE;
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly items = computed(() => {
    const user = this.user();
    if (!user) return [];
    return this.state().properties
      .filter((property) => property.ownerId === user.id || property.submittedById === user.id)
      .map((property) => bundleProperty(this.state(), property));
  });

  reached(status: string, step: string): boolean {
    if (status === 'rejected' || status === 'changes_requested') return step === 'draft' || step === 'submitted';
    return PIPELINE.indexOf(status as (typeof PIPELINE)[number]) >= PIPELINE.indexOf(step as (typeof PIPELINE)[number]);
  }

  submit(id: string): void {
    this.properties.setStatus(id, 'submitted');
    this.toast.show('Submitted for verification.');
  }

  async remove(id: string): Promise<void> {
    const user = this.user();
    if (!user) return;
    const ok = await this.confirm.ask('Delete this draft?', 'Delete draft', 'Delete', 'Keep', true);
    if (!ok) return;
    this.properties.removeDraft(id, user.id);
    this.toast.show('Draft deleted.');
  }
}

@Component({
  selector: 'app-owner-listings-page',
  imports: [RouterLink, InrPipe, DatePipe],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Offers</p><h1>My listings</h1><p class="muted">A listing is the public offer. It points at your property instead of copying it.</p></div></div>
      <div class="table-wrap">
        <table class="responsive">
          <thead><tr><th>Listing</th><th>Property</th><th>Price</th><th>Listed by</th><th>Status</th><th>Since</th></tr></thead>
          <tbody>
            @for (item of items(); track item.listing.id) {
              <tr>
                <td data-label="Listing">{{ item.listing.id }}</td>
                <td data-label="Property"><a [routerLink]="['/property', item.property.id]">{{ item.property.title }}</a></td>
                <td data-label="Price">{{ item.listing.price | inr }}</td>
                <td data-label="Listed by">{{ item.listedBy?.name }}</td>
                <td data-label="Status"><span class="pill" [attr.data-status]="item.listing.status">{{ item.listing.status }}</span></td>
                <td data-label="Since">{{ item.listing.createdAt | date: 'mediumDate' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class OwnerListingsPage {
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly items = computed(() => {
    const user = this.user();
    if (!user) return [];
    return this.state().listings
      .map((listing) => {
        const property = this.state().properties.find((item) => item.id === listing.propertyId);
        if (!property || (property.ownerId !== user.id && property.submittedById !== user.id)) return null;
        const bundle = bundleProperty(this.state(), property);
        return bundle.listing ? { ...bundle, listing: bundle.listing } : null;
      })
      .filter((item): item is NonNullable<typeof item> => !!item);
  });
}

@Component({
  selector: 'app-associate-available-page',
  imports: [PropertyCard, ReactiveFormsModule],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Inventory</p><h1>Available properties</h1><p class="muted">Show these to a buyer, then refer a lead.</p></div></div>
      <div class="card-grid">
        @for (item of items(); track item.property.id) {
          <div>
            <app-property-card [bundle]="item" [showSave]="false" (share)="actions.share($event)" />
            <button type="button" class="btn btn-dark btn-sm" style="margin-top:8px" (click)="pick(item.property.id)">Refer a lead</button>
          </div>
        }
      </div>
      @if (propertyId()) {
        <form class="panel" style="margin-top:16px" [formGroup]="form" (ngSubmit)="refer()">
          <h3>Refer a buyer to {{ propertyId() }}</h3>
          <div class="form-grid">
            <div class="field"><label>Name</label><input formControlName="name" /></div>
            <div class="field"><label>Email</label><input formControlName="email" /></div>
            <div class="field"><label>Phone</label><input formControlName="phone" /></div>
            <div class="field"><label>Location</label><select formControlName="location">@for (location of locations; track location) { <option [value]="location">{{ location }}</option> }</select></div>
            <div class="field span-2"><label>Note</label><textarea formControlName="notes"></textarea></div>
          </div>
          @if (error()) { <p class="field-error">{{ error() }}</p> }
          <button class="btn btn-primary" type="submit">Create referral</button>
        </form>
      }
    </section>
  `,
})
export class AssociateAvailablePage {
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly associates = inject(AssociateService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly actions = inject(CatalogActions);
  readonly locations = [...LOCATIONS];
  readonly propertyId = signal('');
  readonly error = signal('');
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly items = computed(() => activeBundles(this.state()));
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    location: [LOCATIONS[0]],
    notes: ['Interested after a call with the associate.'],
  });

  pick(id: string): void {
    this.propertyId.set(id);
  }

  refer(): void {
    const user = this.auth.getCurrentUser();
    if (!user || this.form.invalid) {
      this.error.set('Name, email and phone are required.');
      this.form.markAllAsTouched();
      return;
    }
    try {
      const result = this.associates.referBuyer(user, { ...this.form.getRawValue(), propertyId: this.propertyId() });
      this.error.set('');
      this.toast.show(result.createdUser ? `${result.buyer.name} can sign in with password 12345678. Lead ${result.lead?.id} is with admin.` : `Lead ${result.lead?.id} linked to ${result.buyer.name}.`);
      this.propertyId.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not refer the buyer.');
    }
  }
}

@Component({
  selector: 'app-associate-properties-page',
  imports: [RouterLink, InrPipe],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Sourced</p><h1>My properties</h1></div><a class="btn btn-primary" routerLink="/associate/properties/new">Submit property</a></div>
      <div class="table-wrap">
        <table class="responsive">
          <thead><tr><th>Property</th><th>Type</th><th>Owner</th><th>Location</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            @for (item of items(); track item.property.id) {
              <tr>
                <td data-label="Property"><a [routerLink]="['/property', item.property.id]">{{ item.property.title }}</a></td>
                <td data-label="Type">{{ typeLabel[item.property.type] }}</td>
                <td data-label="Owner">{{ item.owner?.name || '—' }}</td>
                <td data-label="Location">{{ item.property.location }}</td>
                <td data-label="Price">{{ item.property.askingPrice | inr }}</td>
                <td data-label="Status"><span class="pill" [attr.data-status]="item.property.status">{{ statusLabel[item.property.status] }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class AssociatePropertiesPage {
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  readonly typeLabel = TYPE_LABEL;
  readonly statusLabel = PROPERTY_STATUS_LABEL;
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly items = computed(() => {
    const user = this.auth.getCurrentUser();
    if (!user) return [];
    return this.state().properties.filter((property) => property.submittedById === user.id).map((property) => bundleProperty(this.state(), property));
  });
}

@Component({
  selector: 'app-associate-buyers-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Network</p><h1>My buyers</h1></div></div>
      <form class="panel" [formGroup]="form" (ngSubmit)="refer()">
        <h3>Refer a buyer</h3>
        <div class="form-grid">
          <div class="field"><label>Name</label><input formControlName="name" /></div>
          <div class="field"><label>Email</label><input formControlName="email" /></div>
          <div class="field"><label>Phone</label><input formControlName="phone" /></div>
          <div class="field"><label>Location</label><select formControlName="location">@for (location of locations; track location) { <option [value]="location">{{ location }}</option> }</select></div>
          <div class="field span-2"><label>Interested property</label>
            <select formControlName="propertyId"><option value="">Decide later</option>@for (item of properties(); track item.property.id) { <option [value]="item.property.id">{{ item.property.title }}</option> }</select>
          </div>
          <div class="field span-2"><label>Note</label><textarea formControlName="notes"></textarea></div>
        </div>
        @if (error()) { <p class="field-error">{{ error() }}</p> }
        <button class="btn btn-primary" type="submit">Save buyer</button>
      </form>
      <div class="table-wrap" style="margin-top:14px">
        <table class="responsive">
          <thead><tr><th>Buyer</th><th>Phone</th><th>Location</th><th>Leads</th></tr></thead>
          <tbody>
            @for (buyer of buyers(); track buyer.id) {
              <tr>
                <td data-label="Buyer">{{ buyer.name }}<br /><span class="muted">{{ buyer.email }}</span></td>
                <td data-label="Phone">{{ buyer.phone }}</td>
                <td data-label="Location">{{ buyer.location }}</td>
                <td data-label="Leads">{{ leadCount(buyer.id) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class AssociateBuyersPage {
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly associates = inject(AssociateService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly locations = [...LOCATIONS];
  readonly error = signal('');
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly properties = computed(() => activeBundles(this.state()));
  readonly buyers = computed(() => {
    const user = this.auth.getCurrentUser();
    if (!user) return [];
    const ids = new Set(this.state().leads.filter((lead) => lead.referredById === user.id || lead.assignedToId === user.id).map((lead) => lead.buyerId));
    return this.state().users.filter((person) => person.role === 'buyer' && (person.referredById === user.id || ids.has(person.id)));
  });
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    location: [LOCATIONS[0]],
    propertyId: [''],
    notes: [''],
  });

  leadCount(buyerId: string): number {
    const user = this.auth.getCurrentUser();
    return this.state().leads.filter((lead) => lead.buyerId === buyerId && (lead.referredById === user?.id || lead.assignedToId === user?.id)).length;
  }

  refer(): void {
    const user = this.auth.getCurrentUser();
    if (!user || this.form.invalid) {
      this.error.set('Name, email and phone are required.');
      return;
    }
    try {
      const raw = this.form.getRawValue();
      const result = this.associates.referBuyer(user, { ...raw, propertyId: raw.propertyId || undefined });
      this.error.set('');
      this.form.reset({ name: '', email: '', phone: '', location: LOCATIONS[0], propertyId: '', notes: '' });
      this.toast.show(result.createdUser ? 'Buyer referred. Demo password is 12345678.' : 'Existing buyer linked to you.');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not save the buyer.');
    }
  }
}

@Component({
  selector: 'app-builder-projects-page',
  imports: [RouterLink, ImgFallbackDirective],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Portfolio</p><h1>Projects</h1></div><a class="btn btn-primary" routerLink="/builder/projects/new">Create project</a></div>
      <div class="card-grid">
        @for (project of projects(); track project.id) {
          <a class="project-card" [routerLink]="['/project', project.id]" style="text-decoration:none;overflow:hidden">
            <img appFallback [src]="project.images[0]" [alt]="project.name" style="height:160px;width:100%;object-fit:cover" />
            <div class="card-body">
              <span class="pill" [attr.data-status]="project.status">{{ statusLabel[project.status] }}</span>
              <h3>{{ project.name }}</h3>
              <p class="muted">{{ project.location }} · {{ project.developerName }}</p>
            </div>
          </a>
        }
      </div>
    </section>
  `,
})
export class BuilderProjectsPage {
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  readonly statusLabel = PROJECT_STATUS_LABEL;
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly projects = computed(() => this.state().projects.filter((project) => project.builderId === this.auth.getCurrentUser()?.id));
}

@Component({
  selector: 'app-builder-units-page',
  imports: [RouterLink, InrPipe],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Inventory</p><h1>Properties / units</h1></div><a class="btn btn-primary" routerLink="/builder/units/new">Add unit</a></div>
      @for (group of groups(); track group.project.id) {
        <h3 style="margin-top:16px">{{ group.project.name }}</h3>
        <div class="table-wrap">
          <table class="responsive">
            <thead><tr><th>Unit</th><th>Type</th><th>Price</th><th>Status</th></tr></thead>
            <tbody>
              @for (property of group.units; track property.id) {
                <tr>
                  <td data-label="Unit"><a [routerLink]="['/property', property.id]">{{ property.title }}</a></td>
                  <td data-label="Type">{{ typeLabel[property.type] }} @if (property.bhk) { · {{ property.bhk }} BHK }</td>
                  <td data-label="Price">{{ property.askingPrice | inr }}</td>
                  <td data-label="Status"><span class="pill" [attr.data-status]="property.status">{{ statusLabel[property.status] }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class BuilderUnitsPage {
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  readonly typeLabel = TYPE_LABEL;
  readonly statusLabel = PROPERTY_STATUS_LABEL;
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly groups = computed(() => {
    const userId = this.auth.getCurrentUser()?.id;
    return this.state().projects
      .filter((project) => project.builderId === userId)
      .map((project) => ({ project, units: this.state().properties.filter((property) => property.projectId === project.id) }));
  });
}

@Component({
  selector: 'app-builder-listings-page',
  imports: [InrPipe, RouterLink],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Offers</p><h1>Listings</h1></div></div>
      <div class="table-wrap">
        <table class="responsive">
          <thead><tr><th>Listing</th><th>Unit</th><th>Project</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            @for (row of rows(); track row.listing.id) {
              <tr>
                <td data-label="Listing">{{ row.listing.id }}</td>
                <td data-label="Unit"><a [routerLink]="['/property', row.property.id]">{{ row.property.title }}</a></td>
                <td data-label="Project">{{ row.project?.name || '—' }}</td>
                <td data-label="Price">{{ row.listing.price | inr }}</td>
                <td data-label="Status"><span class="pill" [attr.data-status]="row.listing.status">{{ row.listing.status }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class BuilderListingsPage {
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly rows = computed(() => {
    const userId = this.auth.getCurrentUser()?.id;
    return this.state().listings
      .map((listing) => {
        const property = this.state().properties.find((item) => item.id === listing.propertyId && item.builderId === userId);
        if (!property) return null;
        return { listing, property, project: this.state().projects.find((project) => project.id === property.projectId) };
      })
      .filter((row): row is NonNullable<typeof row> => !!row);
  });
}
