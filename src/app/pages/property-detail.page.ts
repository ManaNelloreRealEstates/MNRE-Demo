import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BuyerService } from '../core/buyer.service';
import { DataStoreService } from '../core/data-store.service';
import { LeadService } from '../core/lead.service';
import { ListingService } from '../core/listing.service';
import { AuthService } from '../core/auth.service';
import { localISODate } from '../core/format';
import {
  APPROVAL_LABEL,
  FACING_LABEL,
  FURNISH_LABEL,
  LEAD_STATUS_LABEL,
  LISTING_STATUS_LABEL,
  PROPERTY_STATUS_LABEL,
  ROLE_LABEL,
  TYPE_LABEL,
} from '../core/labels';
import { ToastService } from '../core/toast.service';
import { areaLabel, bundleProperty, canViewProperty } from '../core/views';
import { CatalogActions } from '../shared/catalog-actions';
import { Gallery } from '../shared/gallery';
import { InrPipe, Modal } from '../shared/ui';

@Component({
  selector: 'app-property-detail-page',
  imports: [Gallery, RouterLink, ReactiveFormsModule, InrPipe, Modal],
  template: `
    <section class="page">
      <div class="container">
        @if (!bundle()) {
          <div class="empty">
            <h1>Property not found</h1>
            <p class="muted">That sample record is not in this demo.</p>
            <a class="btn btn-dark" routerLink="/properties">Back to properties</a>
          </div>
        } @else if (!visible()) {
          <div class="empty">
            <h1>This property is not public yet</h1>
            <p class="muted">It is still a draft or waiting for approval. Sign in as the owner, builder or admin to preview it.</p>
            <a class="btn btn-dark" routerLink="/login" [queryParams]="{ returnUrl: '/property/' + id() }">Login</a>
          </div>
        } @else if (bundle(); as item) {
          <div class="detail-grid">
            <div>
              <app-gallery [images]="item.property.images" [alt]="item.property.title" />
              <div class="panel" style="margin-top:16px">
                <p class="eyebrow">{{ typeLabel[item.property.type] }} · {{ statusLabel[item.property.status] }}</p>
                <h1>{{ item.property.title }}</h1>
                <p>{{ item.property.location }}, {{ item.property.city }}</p>
                <p>{{ item.property.description }}</p>
                <div class="fact-grid">
                  <div class="fact"><span>Area</span><strong>{{ area(item.property) }}</strong></div>
                  @if (item.property.facing) { <div class="fact"><span>Facing</span><strong>{{ facing[item.property.facing] }}</strong></div> }
                  @if (item.property.roadWidthFt) { <div class="fact"><span>Road width</span><strong>{{ item.property.roadWidthFt }} ft</strong></div> }
                  @if (item.property.bhk) { <div class="fact"><span>BHK</span><strong>{{ item.property.bhk }}</strong></div> }
                  @if (item.property.builtUpSqFt) { <div class="fact"><span>Built-up</span><strong>{{ item.property.builtUpSqFt }} sq ft</strong></div> }
                  @if (item.property.plotAreaSqYd) { <div class="fact"><span>Plot area</span><strong>{{ item.property.plotAreaSqYd }} sq yards</strong></div> }
                  @if (item.property.approvalType) { <div class="fact"><span>Approval</span><strong>{{ approval[item.property.approvalType] }}</strong></div> }
                  @if (item.property.furnished) { <div class="fact"><span>Furnishing</span><strong>{{ furnish[item.property.furnished] }}</strong></div> }
                  @if (item.property.propertyAgeYears != null) { <div class="fact"><span>Age</span><strong>{{ item.property.propertyAgeYears }} years</strong></div> }
                  @if (item.property.parking != null) { <div class="fact"><span>Parking</span><strong>{{ item.property.parking }}</strong></div> }
                  <div class="fact"><span>Corner plot</span><strong>{{ item.property.cornerPlot ? 'Yes' : 'No' }}</strong></div>
                  <div class="fact"><span>Gated community</span><strong>{{ item.property.gatedCommunity ? 'Yes' : 'No' }}</strong></div>
                </div>
                <h3 style="margin-top:16px">Amenities</h3>
                <div class="chips">
                  @for (amenity of item.property.amenities; track amenity) { <span>{{ amenity }}</span> }
                  @if (!item.property.amenities.length) { <span>No amenities noted</span> }
                </div>
                <h3 style="margin-top:16px">Location</h3>
                <div class="map-placeholder">
                  <div>
                    <strong>{{ item.property.location }}</strong>
                    <p>{{ item.property.address }}</p>
                    <p>Map preview only. A live map is not connected in this demo.</p>
                  </div>
                </div>
              </div>
            </div>
            <aside class="side-card">
              <div class="price" style="font-size:1.8rem">{{ (item.listing?.price ?? item.property.askingPrice) | inr }}</div>
              @if (item.listing) { <p><span class="pill" [attr.data-status]="item.listing.status">{{ listingLabel[item.listing.status] }}</span></p> }
              <p><strong>Listed by</strong><br />{{ item.listedBy?.name || item.submitter?.name }} · {{ roleLabel[item.listedBy?.role || item.submitter!.role] }}</p>
              @if (item.listedBy?.company || item.submitter?.company) { <p class="muted">{{ item.listedBy?.company || item.submitter?.company }}</p> }
              @if (item.owner) { <p><strong>Owner</strong><br />{{ item.owner.name }} · {{ item.owner.phone }}</p> }
              @if (item.builder) { <p><strong>Builder</strong><br />{{ item.builder.name }}@if (item.builder.company) {, {{ item.builder.company }} }</p> }
              @if (item.project) { <p><a [routerLink]="['/project', item.project.id]">Project: {{ item.project.name }}</a></p> }
              @if (myLead(); as lead) {
                <p class="hint">Your lead {{ lead.id }} is {{ leadLabel[lead.status] }}.</p>
              }
              <div class="row-actions" style="margin-top:12px">
                <button type="button" class="btn btn-primary" [disabled]="item.listing?.status === 'sold'" (click)="openInterest()">I'm interested</button>
                <button type="button" class="btn btn-dark" [disabled]="item.listing?.status === 'sold'" (click)="openVisit()">Schedule site visit</button>
                <button type="button" class="btn btn-ghost" (click)="openContact()">Contact agent</button>
                <button type="button" class="btn btn-ghost" (click)="actions.share(item.property.id)">Share</button>
                <button type="button" class="btn btn-ghost" (click)="actions.save(item.property.id)">{{ actions.isSaved(item.property.id) ? 'Saved' : 'Save' }}</button>
              </div>
            </aside>
          </div>
        }
      </div>
    </section>

    <app-modal [open]="interestOpen()" title="I'm interested" (closed)="interestOpen.set(false)">
      <form [formGroup]="interestForm" (ngSubmit)="submitInterest()">
        <div class="field">
          <label for="interest">Message</label>
          <textarea id="interest" formControlName="message"></textarea>
        </div>
        <button class="btn btn-primary" type="submit" [disabled]="busy()">Create lead</button>
      </form>
    </app-modal>
    <app-modal [open]="visitOpen()" title="Schedule a site visit" (closed)="visitOpen.set(false)">
      <form [formGroup]="visitForm" (ngSubmit)="submitVisit()">
        <div class="form-grid">
          <div class="field"><label for="date">Date</label><input id="date" type="date" formControlName="date" [min]="today" /></div>
          <div class="field"><label for="time">Time</label><input id="time" type="time" formControlName="time" /></div>
          <div class="field span-2"><label for="visit-notes">Note</label><textarea id="visit-notes" formControlName="notes"></textarea></div>
        </div>
        @if (visitForm.invalid && visitForm.touched) { <p class="field-error">Choose a date and time.</p> }
        <button class="btn btn-primary" type="submit" [disabled]="busy()">Request visit</button>
      </form>
    </app-modal>
    <app-modal [open]="contactOpen()" title="Contact the agent" (closed)="contactOpen.set(false)">
      <form [formGroup]="contactForm" (ngSubmit)="submitContact()">
        <div class="field">
          <label for="contact-message">Message</label>
          <textarea id="contact-message" formControlName="message"></textarea>
          @if (contactForm.controls.message.touched && contactForm.controls.message.invalid) { <p class="field-error">Write a short message.</p> }
        </div>
        <button class="btn btn-primary" type="submit">Send</button>
      </form>
    </app-modal>
  `,
})
export class PropertyDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly buyer = inject(BuyerService);
  private readonly leadService = inject(LeadService);
  private readonly listings = inject(ListingService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly actions = inject(CatalogActions);
  readonly id = signal('');
  readonly interestOpen = signal(false);
  readonly visitOpen = signal(false);
  readonly contactOpen = signal(false);
  readonly busy = signal(false);
  readonly today = localISODate();
  readonly typeLabel = TYPE_LABEL;
  readonly statusLabel = PROPERTY_STATUS_LABEL;
  readonly listingLabel = LISTING_STATUS_LABEL;
  readonly facing = FACING_LABEL;
  readonly approval = APPROVAL_LABEL;
  readonly furnish = FURNISH_LABEL;
  readonly roleLabel = ROLE_LABEL;
  readonly leadLabel = LEAD_STATUS_LABEL;
  readonly area = areaLabel;
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly bundle = computed(() => {
    const property = this.state().properties.find((item) => item.id === this.id());
    return property ? bundleProperty(this.state(), property) : null;
  });
  readonly visible = computed(() => {
    const item = this.bundle();
    return !!item && canViewProperty(this.state(), item.property, this.user());
  });
  readonly myLead = computed(() => {
    const user = this.user();
    if (!user) return undefined;
    return this.state().leads.find((lead) => lead.buyerId === user.id && lead.propertyId === this.id() && lead.status !== 'lost');
  });
  readonly interestForm = this.fb.nonNullable.group({
    message: ['I am interested in this property. Please contact me.'],
  });
  readonly visitForm = this.fb.nonNullable.group({
    date: ['', Validators.required],
    time: ['10:30', Validators.required],
    notes: ['Please confirm the visit.'],
  });
  readonly contactForm = this.fb.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id') ?? '';
      this.id.set(id);
      this.listings.incrementView(id);
      const property = this.store.snapshot.properties.find((item) => item.id === id);
      inject(Title).setTitle(property ? `${property.title} | ManaNelloreRealEstate` : 'Property | ManaNelloreRealEstate');
    });
  }

  openInterest(): void {
    if (this.requireBuyer()) this.interestOpen.set(true);
  }

  openVisit(): void {
    if (this.requireBuyer()) this.visitOpen.set(true);
  }

  openContact(): void {
    if (this.requireBuyer()) this.contactOpen.set(true);
  }

  submitInterest(): void {
    const user = this.user();
    const id = this.id();
    if (!user || user.role !== 'buyer') return;
    this.busy.set(true);
    const result = this.buyer.expressInterest(user, id, this.interestForm.controls.message.value);
    this.busy.set(false);
    this.interestOpen.set(false);
    this.toast.show(
      result.created ? `Lead ${result.lead.id} created. Admin can see it now.` : `You already have lead ${result.lead.id} for this property.`,
      result.created ? 'success' : 'info',
    );
  }

  submitVisit(): void {
    this.visitForm.markAllAsTouched();
    const user = this.user();
    if (!user || user.role !== 'buyer' || this.visitForm.invalid) return;
    const raw = this.visitForm.getRawValue();
    const result = this.buyer.scheduleVisit({
      buyer: user,
      propertyId: this.id(),
      date: raw.date,
      time: raw.time,
      notes: raw.notes,
    });
    this.visitOpen.set(false);
    this.toast.show(
      result.alreadyOpen ? `Visit ${result.visit.id} is already open for this property.` : `Visit ${result.visit.id} requested. Admin can confirm it.`,
      result.alreadyOpen ? 'info' : 'success',
    );
  }

  submitContact(): void {
    this.contactForm.markAllAsTouched();
    const user = this.user();
    if (!user || user.role !== 'buyer' || this.contactForm.invalid) return;
    const message = this.contactForm.controls.message.value.trim();
    const result = this.buyer.expressInterest(user, this.id(), message);
    this.leadService.addNote(result.lead.id, `Agent contact: ${message}`);
    this.contactOpen.set(false);
    this.contactForm.reset({ message: '' });
    this.toast.show('Message saved on the lead. No real SMS or email is sent in this demo.');
  }

  private requireBuyer(): boolean {
    const user = this.user();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: `/property/${this.id()}` } });
      return false;
    }
    if (user.role !== 'buyer') {
      this.toast.show('Use a buyer account to enquire, save a visit, or contact the agent.', 'info');
      return false;
    }
    return true;
  }
}
