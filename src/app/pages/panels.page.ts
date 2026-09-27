import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';
import { ConfirmService } from '../core/confirm.service';
import { DataStoreService } from '../core/data-store.service';
import { DealService } from '../core/deal.service';
import { LeadService } from '../core/lead.service';
import {
  DEAL_STATUSES,
  DEAL_STATUS_LABEL,
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  ROLE_LABEL,
  SOURCE_LABEL,
  VISIT_STATUSES,
  VISIT_STATUS_LABEL,
} from '../core/labels';
import { DealStatus, LeadStatus, UserRole, VisitStatus } from '../core/models';
import { SiteVisitService } from '../core/site-visit.service';
import { ToastService } from '../core/toast.service';
import { AdminService } from '../core/admin.service';
import { dealRows, enquiryRows, leadRows, visitRows } from '../core/views';
import { InrPipe, Pager } from '../shared/ui';

@Component({
  selector: 'app-leads-panel',
  imports: [DatePipe, RouterLink, Pager],
  template: `
    <section class="dash-page">
      <div class="dash-head">
        <div>
          <p class="eyebrow">CRM</p>
          <h1>{{ mode() === 'buyer' ? 'My leads' : 'Leads' }}</h1>
          <p class="muted">A lead is the business record created when a buyer is interested. It is not a user role.</p>
        </div>
      </div>
      <div class="toolbar">
        <label class="field"><span class="muted">Search</span><input [value]="query()" (input)="setQuery($event)" placeholder="Buyer, property, id" /></label>
        <label class="field"><span class="muted">Status</span>
          <select [value]="status()" (change)="setStatus($event)">
            <option value="">All</option>
            @for (item of statuses; track item) { <option [value]="item">{{ statusLabel[item] }}</option> }
          </select>
        </label>
      </div>
      @if (!pageRows().length) {
        <div class="empty"><h3>No leads in this view</h3><p class="muted">Buyer interest from the website will show up here.</p></div>
      } @else {
        <div class="table-wrap">
          <table class="responsive">
            <thead><tr><th>Lead</th><th>Buyer</th><th>Property</th><th>Source</th><th>Assigned to</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              @for (row of pageRows(); track row.lead.id) {
                <tr>
                  <td data-label="Lead">{{ row.lead.id }}</td>
                  <td data-label="Buyer">{{ row.buyer?.name }}<br /><span class="muted">{{ row.buyer?.phone }}</span></td>
                  <td data-label="Property">@if (row.property) { <a [routerLink]="['/property', row.property.id]">{{ row.property.title }}</a> }</td>
                  <td data-label="Source">{{ sourceLabel[row.lead.source] }}</td>
                  <td data-label="Assigned">
                    @if (mode() === 'admin') {
                      <select [value]="row.lead.assignedToId || ''" (change)="assign(row.lead.id, $event)">
                        <option value="">Unassigned</option>
                        @for (person of associates(); track person.id) { <option [value]="person.id">{{ person.name }}</option> }
                      </select>
                    } @else { {{ row.assignee?.name || 'Unassigned' }} }
                  </td>
                  <td data-label="Status">
                    @if (mode() === 'admin') {
                      <select [value]="row.lead.status" (change)="setLeadStatus(row.lead.id, $event)">
                        @for (item of statuses; track item) { <option [value]="item">{{ statusLabel[item] }}</option> }
                      </select>
                    } @else { <span class="pill" [attr.data-status]="row.lead.status">{{ statusLabel[row.lead.status] }}</span> }
                  </td>
                  <td data-label="Created">{{ row.lead.createdAt | date: 'mediumDate' }}</td>
                  <td data-label="Actions">
                    @if (mode() === 'admin') {
                      <button type="button" class="btn btn-dark btn-sm" (click)="negotiate(row.lead.id)">Open deal</button>
                    }
                    @if (row.lead.notes) { <p class="muted">{{ row.lead.notes }}</p> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-pager [page]="page()" [pages]="pageCount()" (pageChange)="page.set($event)" />
      }
    </section>
  `,
})
export class LeadsPanel {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly leads = inject(LeadService);
  private readonly deals = inject(DealService);
  private readonly toast = inject(ToastService);
  readonly statuses = LEAD_STATUSES;
  readonly statusLabel = LEAD_STATUS_LABEL;
  readonly sourceLabel = SOURCE_LABEL;
  readonly query = signal('');
  readonly status = signal('');
  readonly page = signal(1);
  readonly mode = toSignal(this.route.data.pipe(map((data) => (data['mode'] as string) || 'admin')), { initialValue: 'admin' });
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly associates = computed(() => this.state().users.filter((user) => user.role === 'associate' && user.active));
  readonly rows = computed(() => {
    const state = this.state();
    const user = this.user();
    const mode = this.mode();
    if (!user) return [];
    let items = state.leads;
    if (mode === 'buyer') items = items.filter((lead) => lead.buyerId === user.id);
    if (mode === 'associate') {
      items = items.filter((lead) => lead.assignedToId === user.id || lead.referredById === user.id || state.properties.some((property) => property.id === lead.propertyId && property.submittedById === user.id));
    }
    if (mode === 'builder') {
      const projects = new Set(state.projects.filter((project) => project.builderId === user.id).map((project) => project.id));
      items = items.filter((lead) => {
        const property = state.properties.find((item) => item.id === lead.propertyId);
        return property?.builderId === user.id || (!!property?.projectId && projects.has(property.projectId));
      });
    }
    const query = this.query().toLowerCase();
    return leadRows(state, items)
      .filter((row) => !this.status() || row.lead.status === this.status())
      .filter((row) => !query || `${row.lead.id} ${row.buyer?.name ?? ''} ${row.property?.title ?? ''} ${row.property?.location ?? ''}`.toLowerCase().includes(query))
      .sort((a, b) => b.lead.createdAt.localeCompare(a.lead.createdAt));
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.rows().length / 8)));
  readonly pageRows = computed(() => this.rows().slice((this.page() - 1) * 8, this.page() * 8));

  setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  setStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value);
    this.page.set(1);
  }

  setLeadStatus(id: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as LeadStatus;
    this.leads.updateStatus(id, status);
    this.toast.show(`Lead moved to ${LEAD_STATUS_LABEL[status]}.`);
  }

  assign(id: string, event: Event): void {
    this.leads.assign(id, (event.target as HTMLSelectElement).value);
    this.toast.show('Associate assignment updated.');
  }

  negotiate(id: string): void {
    const deal = this.deals.createFromLead(id, 'negotiation');
    this.toast.show(deal ? `Deal ${deal.id} is open.` : 'Could not open a deal.', deal ? 'success' : 'error');
  }
}

@Component({
  selector: 'app-visits-panel',
  imports: [DatePipe, RouterLink, ReactiveFormsModule],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Visits</p><h1>Site visits</h1></div></div>
      @if (mode() === 'admin') {
        <div class="panel" style="margin-bottom:14px">
          <div class="toolbar">
            <strong>{{ monthLabel() }}</strong>
            <div class="row-actions">
              <button type="button" class="btn btn-ghost btn-sm" (click)="shiftMonth(-1)">Previous</button>
              <button type="button" class="btn btn-ghost btn-sm" (click)="shiftMonth(1)">Next</button>
            </div>
          </div>
          <div class="cal-grid">
            @for (day of calendar(); track day.key) {
              <button type="button" [class.on]="dateFilter() === day.key" (click)="dateFilter.set(dateFilter() === day.key ? '' : day.key)">
                {{ day.date.getDate() }}
                @if (day.count) { <small>{{ day.count }}</small> }
              </button>
            }
          </div>
        </div>
        <div class="toolbar">
          <label class="field"><span class="muted">Buyer</span><input [value]="buyerFilter()" (input)="buyerFilter.set($any($event.target).value)" /></label>
          <label class="field"><span class="muted">Property</span><input [value]="propertyFilter()" (input)="propertyFilter.set($any($event.target).value)" /></label>
          <label class="field"><span class="muted">Status</span>
            <select [value]="statusFilter()" (change)="statusFilter.set($any($event.target).value)">
              <option value="">All</option>
              @for (item of statuses; track item) { <option [value]="item">{{ statusLabel[item] }}</option> }
            </select>
          </label>
        </div>
      }
      @if (!rows().length) {
        <div class="empty"><h3>No site visits</h3><p class="muted">Buyers can request a date from a property page.</p></div>
      } @else {
        <div class="table-wrap">
          <table class="responsive">
            <thead><tr><th>Visit</th><th>When</th><th>Buyer</th><th>Property</th><th>Associate</th><th>Status</th><th></th></tr></thead>
            <tbody>
              @for (row of rows(); track row.visit.id) {
                <tr>
                  <td data-label="Visit">{{ row.visit.id }}</td>
                  <td data-label="When">{{ row.visit.date | date: 'mediumDate' }} · {{ row.visit.time }}</td>
                  <td data-label="Buyer">{{ row.buyer?.name }}</td>
                  <td data-label="Property">@if (row.property) { <a [routerLink]="['/property', row.property.id]">{{ row.property.title }}</a> }</td>
                  <td data-label="Associate">
                    @if (mode() === 'admin') {
                      <select [value]="row.visit.associateId || ''" (change)="assign(row.visit.id, $event)">
                        <option value="">Unassigned</option>
                        @for (person of associates(); track person.id) { <option [value]="person.id">{{ person.name }}</option> }
                      </select>
                    } @else { {{ row.associate?.name || 'Unassigned' }} }
                  </td>
                  <td data-label="Status"><span class="pill" [attr.data-status]="row.visit.status">{{ statusLabel[row.visit.status] }}</span></td>
                  <td data-label="Actions">
                    @if (mode() === 'admin') {
                      <div class="row-actions">
                        <button type="button" class="btn btn-dark btn-sm" (click)="mark(row.visit.id, 'confirmed')">Confirm</button>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="editing.set(row.visit.id)">Reschedule</button>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="mark(row.visit.id, 'completed')">Complete</button>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="mark(row.visit.id, 'no_show')">No show</button>
                        <button type="button" class="btn btn-danger btn-sm" (click)="mark(row.visit.id, 'cancelled')">Cancel</button>
                      </div>
                      @if (editing() === row.visit.id) {
                        <div class="form-grid" style="margin-top:8px">
                          <input type="date" [value]="row.visit.date" #visitDate />
                          <input type="time" [value]="row.visit.time" #visitTime />
                          <button type="button" class="btn btn-primary btn-sm" (click)="reschedule(row.visit.id, visitDate.value, visitTime.value)">Save time</button>
                        </div>
                      }
                    }
                    @if (mode() === 'buyer' && (row.visit.status === 'requested' || row.visit.status === 'confirmed')) {
                      <button type="button" class="btn btn-danger btn-sm" (click)="mark(row.visit.id, 'cancelled')">Cancel request</button>
                    }
                    @if (row.visit.notes) { <p class="muted">{{ row.visit.notes }}</p> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class VisitsPanel {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly visits = inject(SiteVisitService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  readonly statuses = VISIT_STATUSES;
  readonly statusLabel = VISIT_STATUS_LABEL;
  readonly mode = toSignal(this.route.data.pipe(map((data) => (data['mode'] as string) || 'admin')), { initialValue: 'admin' });
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly associates = computed(() => this.state().users.filter((user) => user.role === 'associate'));
  readonly cursor = signal(new Date());
  readonly dateFilter = signal('');
  readonly buyerFilter = signal('');
  readonly propertyFilter = signal('');
  readonly statusFilter = signal('');
  readonly editing = signal<string | null>(null);
  readonly monthLabel = computed(() => this.cursor().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }));
  readonly rows = computed(() => {
    const state = this.state();
    const user = this.user();
    const mode = this.mode();
    if (!user) return [];
    let items = state.siteVisits;
    if (mode === 'buyer') items = items.filter((visit) => visit.buyerId === user.id);
    if (mode === 'owner') items = items.filter((visit) => state.properties.some((property) => property.id === visit.propertyId && property.ownerId === user.id));
    if (mode === 'associate') items = items.filter((visit) => visit.associateId === user.id);
    if (mode === 'builder') items = items.filter((visit) => state.properties.some((property) => property.id === visit.propertyId && property.builderId === user.id));
    return visitRows(state, items)
      .filter((row) => !this.dateFilter() || row.visit.date === this.dateFilter())
      .filter((row) => !this.statusFilter() || row.visit.status === this.statusFilter())
      .filter((row) => !this.buyerFilter() || (row.buyer?.name ?? '').toLowerCase().includes(this.buyerFilter().toLowerCase()))
      .filter((row) => !this.propertyFilter() || `${row.property?.title ?? ''} ${row.property?.location ?? ''}`.toLowerCase().includes(this.propertyFilter().toLowerCase()))
      .sort((a, b) => `${a.visit.date}${a.visit.time}`.localeCompare(`${b.visit.date}${b.visit.time}`));
  });
  readonly calendar = computed(() => {
    const cursor = this.cursor();
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = localISODateFrom(date);
      const count = this.state().siteVisits.filter((visit) => visit.date === key).length;
      return { key, date, count };
    });
  });

  shiftMonth(delta: number): void {
    const next = new Date(this.cursor());
    next.setMonth(next.getMonth() + delta);
    this.cursor.set(next);
  }

  assign(id: string, event: Event): void {
    this.visits.update(id, { associateId: (event.target as HTMLSelectElement).value });
    this.toast.show('Associate assigned to the visit.');
  }

  async mark(id: string, status: VisitStatus): Promise<void> {
    if (status === 'cancelled') {
      const ok = await this.confirm.ask('Cancel this site visit?', 'Cancel visit', 'Cancel visit', 'Keep it', true);
      if (!ok) return;
    }
    this.visits.update(id, { status });
    this.toast.show(`Visit marked ${VISIT_STATUS_LABEL[status]}.`);
  }

  reschedule(id: string, date: string, time: string): void {
    if (!date || !time) return;
    this.visits.update(id, { date, time, status: 'rescheduled' });
    this.editing.set(null);
    this.toast.show('Visit rescheduled.');
  }
}

function localISODateFrom(date: Date): string {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-deals-panel',
  imports: [DatePipe, RouterLink, InrPipe],
  template: `
    <section class="dash-page">
      <div class="dash-head">
        <div>
          <p class="eyebrow">Commercial</p>
          <h1>{{ mode() === 'buyer' ? 'Negotiations' : mode() === 'associate' ? 'Deals and commission' : 'Deals' }}</h1>
        </div>
      </div>
      @if (mode() === 'associate') {
        <div class="stat-grid">
          <article class="stat"><strong>{{ earned() | inr }}</strong><span>Commission on completed deals</span></article>
          <article class="stat"><strong>{{ pending() | inr }}</strong><span>Commission still in progress</span></article>
        </div>
      }
      @if (!rows().length) {
        <div class="empty"><h3>No deals yet</h3><p class="muted">Admin opens a deal from a lead when negotiation starts.</p></div>
      } @else {
        <div class="table-wrap">
          <table class="responsive">
            <thead><tr><th>Deal</th><th>Buyer</th><th>Property</th><th>Owner / builder</th><th>Associate</th><th>Value</th><th>Commission</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              @for (row of rows(); track row.deal.id) {
                <tr>
                  <td data-label="Deal">{{ row.deal.id }}</td>
                  <td data-label="Buyer">{{ row.buyer?.name }}</td>
                  <td data-label="Property">@if (row.property) { <a [routerLink]="['/property', row.property.id]">{{ row.property.title }}</a> }</td>
                  <td data-label="Owner / builder">{{ row.owner?.name || row.builder?.name || '—' }}</td>
                  <td data-label="Associate">{{ row.associate?.name || '—' }}</td>
                  <td data-label="Value">{{ row.deal.value | inr }}</td>
                  <td data-label="Commission">{{ row.deal.commission | inr }}</td>
                  <td data-label="Status">
                    @if (mode() === 'admin') {
                      <select [value]="row.deal.status" (change)="setStatus(row.deal.id, $event)">
                        @for (item of statuses; track item) { <option [value]="item">{{ statusLabel[item] }}</option> }
                      </select>
                    } @else { <span class="pill" [attr.data-status]="row.deal.status">{{ statusLabel[row.deal.status] }}</span> }
                  </td>
                  <td data-label="Date">{{ row.deal.date | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class DealsPanel {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly deals = inject(DealService);
  private readonly toast = inject(ToastService);
  readonly statuses = DEAL_STATUSES;
  readonly statusLabel = DEAL_STATUS_LABEL;
  readonly mode = toSignal(this.route.data.pipe(map((data) => (data['mode'] as string) || 'admin')), { initialValue: 'admin' });
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly rows = computed(() => {
    const state = this.state();
    const user = this.user();
    const mode = this.mode();
    if (!user) return [];
    let items = state.deals;
    if (mode === 'buyer') items = items.filter((deal) => deal.buyerId === user.id);
    if (mode === 'associate') items = items.filter((deal) => deal.associateId === user.id);
    if (mode === 'builder') items = items.filter((deal) => deal.builderId === user.id);
    return dealRows(state, items).sort((a, b) => b.deal.date.localeCompare(a.deal.date));
  });
  readonly earned = computed(() => this.rows().filter((row) => row.deal.status === 'completed').reduce((sum, row) => sum + row.deal.commission, 0));
  readonly pending = computed(() => this.rows().filter((row) => !['completed', 'cancelled'].includes(row.deal.status)).reduce((sum, row) => sum + row.deal.commission, 0));

  setStatus(id: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as DealStatus;
    this.deals.updateStatus(id, status);
    this.toast.show(`Deal marked ${DEAL_STATUS_LABEL[status]}.`);
  }
}

@Component({
  selector: 'app-enquiries-panel',
  imports: [DatePipe, RouterLink],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Inbox</p><h1>Enquiries</h1><p class="muted">An enquiry is the buyer’s message. It creates the lead.</p></div></div>
      @if (!rows().length) {
        <div class="empty"><h3>No enquiries yet</h3></div>
      } @else {
        <div class="table-wrap">
          <table class="responsive">
            <thead><tr><th>Enquiry</th><th>Buyer</th><th>Property</th><th>Message</th><th>Lead</th><th>Date</th></tr></thead>
            <tbody>
              @for (row of rows(); track row.enquiry.id) {
                <tr>
                  <td data-label="Enquiry">{{ row.enquiry.id }}</td>
                  <td data-label="Buyer">{{ row.buyer?.name }}<br /><span class="muted">{{ row.buyer?.phone }}</span></td>
                  <td data-label="Property">@if (row.property) { <a [routerLink]="['/property', row.property.id]">{{ row.property.title }}</a> }</td>
                  <td data-label="Message">{{ row.enquiry.message }}</td>
                  <td data-label="Lead">@if (row.lead) { <span class="pill" [attr.data-status]="row.lead.status">{{ row.lead.id }}</span> }</td>
                  <td data-label="Date">{{ row.enquiry.createdAt | date: 'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class EnquiriesPanel {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  readonly mode = toSignal(this.route.data.pipe(map((data) => (data['mode'] as string) || 'buyer')), { initialValue: 'buyer' });
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly rows = computed(() => {
    const state = this.state();
    const user = this.user();
    const mode = this.mode();
    if (!user) return [];
    let items = state.enquiries;
    if (mode === 'buyer') items = items.filter((enquiry) => enquiry.buyerId === user.id);
    if (mode === 'owner') items = items.filter((enquiry) => state.properties.some((property) => property.id === enquiry.propertyId && (property.ownerId === user.id || property.submittedById === user.id)));
    if (mode === 'builder') items = items.filter((enquiry) => state.properties.some((property) => property.id === enquiry.propertyId && property.builderId === user.id));
    return enquiryRows(state, items).sort((a, b) => b.enquiry.createdAt.localeCompare(a.enquiry.createdAt));
  });
}

@Component({
  selector: 'app-users-panel',
  imports: [DatePipe],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">People</p><h1>{{ title() }}</h1></div></div>
      <div class="toolbar">
        <label class="field"><span class="muted">Search</span><input [value]="query()" (input)="query.set($any($event.target).value)" placeholder="Name, email, phone" /></label>
        @if (lockedRole() === 'all') {
          <label class="field"><span class="muted">Role</span>
            <select [value]="roleFilter()" (change)="roleFilter.set($any($event.target).value)">
              <option value="">All roles</option>
              @for (role of roles; track role) { <option [value]="role">{{ roleLabel[role] }}</option> }
            </select>
          </label>
        }
      </div>
      <div class="table-wrap">
        <table class="responsive">
          <thead><tr><th>Name</th><th>Role</th><th>Contact</th><th>Company</th><th>Location</th><th>Joined</th><th>Status</th></tr></thead>
          <tbody>
            @for (person of filtered(); track person.id) {
              <tr>
                <td data-label="Name">{{ person.name }}</td>
                <td data-label="Role">{{ roleLabel[person.role] }}</td>
                <td data-label="Contact">{{ person.email }}<br />{{ person.phone }}</td>
                <td data-label="Company">{{ person.company || '—' }}</td>
                <td data-label="Location">{{ person.location }}</td>
                <td data-label="Joined">{{ person.createdAt | date: 'mediumDate' }}</td>
                <td data-label="Status">
                  <button type="button" class="btn btn-sm" [class.btn-ghost]="person.active" [class.btn-danger]="!person.active" [disabled]="person.id === user()?.id" (click)="toggle(person.id, !person.active)">
                    {{ person.active ? 'Active' : 'Disabled' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class UsersPanel {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  private readonly admin = inject(AdminService);
  readonly roleLabel = ROLE_LABEL;
  readonly roles: UserRole[] = ['buyer', 'owner', 'associate', 'builder', 'admin'];
  readonly query = signal('');
  readonly roleFilter = signal('');
  readonly lockedRole = toSignal(this.route.data.pipe(map((data) => (data['role'] as string) || 'all')), { initialValue: 'all' });
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly title = computed(() => {
    const role = this.lockedRole();
    if (role === 'owner') return 'Owners';
    if (role === 'associate') return 'Associates';
    if (role === 'builder') return 'Builders';
    return 'Users';
  });
  readonly filtered = computed(() => {
    const query = this.query().toLowerCase();
    const locked = this.lockedRole();
    return this.state().users.filter((user) => (locked === 'all' ? !this.roleFilter() || user.role === this.roleFilter() : user.role === locked)).filter((user) => !query || `${user.name} ${user.email} ${user.phone} ${user.company ?? ''}`.toLowerCase().includes(query));
  });

  toggle(id: string, active: boolean): void {
    this.admin.setActive(id, active);
  }
}
