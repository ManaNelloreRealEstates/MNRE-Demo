import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';
import { DataStoreService } from '../core/data-store.service';
import { localISODate } from '../core/format';
import { ACTOR_GUIDES } from '../core/guide';
import { LEAD_STATUS_LABEL, ROLE_LABEL } from '../core/labels';
import { UserRole } from '../core/models';
import { ROLE_NAV } from '../core/nav';
import { buildKpis, dealRows, leadRows, visitRows } from '../core/views';
import { InrPipe } from '../shared/ui';

@Component({
  selector: 'app-overview-page',
  imports: [RouterLink, DatePipe, InrPipe],
  template: `
    @if (user(); as current) {
      <section class="dash-page">
        <div class="dash-head">
          <div>
            <p class="eyebrow">{{ roleLabel[workspace()] }}</p>
            <h1>Hello, {{ current.name.split(' ')[0] }}</h1>
            <p class="muted">{{ intro() }}</p>
          </div>
          <a class="btn btn-primary" [routerLink]="primary().path">{{ primary().label }}</a>
        </div>
        <p class="hint">{{ hint() }}</p>
        @if (guide(); as actor) {
          <section class="panel flow-card">
            <h3>Your flow</h3>
            <p class="cred"><span>{{ actor.email }}</span><span>Password {{ actor.password }}</span></p>
            <ol>
              @for (step of actor.steps; track step) {
                <li>{{ step }}</li>
              }
            </ol>
          </section>
        }
        <div class="stat-grid">
          @for (stat of stats(); track stat.label) {
            <article class="stat"><strong>{{ stat.value }}</strong><span>{{ stat.label }}</span></article>
          }
        </div>
        <div class="split" style="margin-top:14px">
          <section class="panel">
            <h3>Recent leads</h3>
            @if (!leads().length) { <p class="muted">No leads in this workspace yet.</p> }
            @for (row of leads(); track row.lead.id) {
              <p><strong>{{ row.lead.id }}</strong> · {{ row.buyer?.name }} · {{ row.property?.title }}<br /><span class="pill" [attr.data-status]="row.lead.status">{{ leadLabel[row.lead.status] }}</span></p>
            }
          </section>
          <section class="panel">
            <h3>Site visits</h3>
            @if (!visits().length) { <p class="muted">No visits on the books.</p> }
            @for (row of visits(); track row.visit.id) {
              <p><strong>{{ row.visit.date | date: 'mediumDate' }}</strong> {{ row.visit.time }}<br />{{ row.property?.title }} · {{ row.buyer?.name }}</p>
            }
          </section>
        </div>
        @if (workspace() === 'admin') {
          <section class="panel" style="margin-top:14px">
            <h3>Messages from the contact form</h3>
            @for (message of messages(); track message.id) {
              <p><strong>{{ message.name }}</strong> · {{ message.email }}<br />{{ message.message }}</p>
            }
          </section>
        }
        @if (workspace() === 'buyer' && deals().length) {
          <section class="panel" style="margin-top:14px">
            <h3>Open commercial records</h3>
            @for (row of deals(); track row.deal.id) {
              <p>{{ row.deal.id }} · {{ row.property?.title }} · {{ row.deal.value | inr }} · {{ row.deal.status }}</p>
            }
          </section>
        }
      </section>
    }
  `,
})
export class OverviewPage {
  private readonly auth = inject(AuthService);
  private readonly store = inject(DataStoreService);
  private readonly router = inject(Router);
  readonly roleLabel = ROLE_LABEL;
  readonly guide = computed(() => ACTOR_GUIDES.find((actor) => actor.role === this.workspace()));
  readonly leadLabel = LEAD_STATUS_LABEL;
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  readonly workspace = computed(() => {
    const segment = this.url().split('?')[0].split('/').filter(Boolean)[0] as UserRole;
    return segment in ROLE_NAV ? segment : (this.user()?.role ?? 'buyer');
  });
  readonly primary = computed(() => {
    const map: Record<UserRole, { path: string; label: string }> = {
      buyer: { path: '/buy', label: 'Search properties' },
      owner: { path: '/owner/properties/new', label: 'Add property' },
      associate: { path: '/associate/buyers', label: 'Refer a buyer' },
      builder: { path: '/builder/projects/new', label: 'Create project' },
      admin: { path: '/admin/leads', label: 'Open leads' },
    };
    return map[this.workspace()];
  });
  readonly intro = computed(() => {
    const lines: Record<UserRole, string> = {
      buyer: 'Your enquiries, visits and negotiations stay attached to your account.',
      owner: 'Track what you submitted and which listings buyers can already see.',
      associate: 'Your desk shows referred buyers, assigned leads and commission.',
      builder: 'Projects group the units buyers discover on the public site.',
      admin: 'The whole platform: approvals, leads, visits and deals.',
    };
    return lines[this.workspace()];
  });
  readonly hint = computed(() => {
    const lines: Record<UserRole, string> = {
      buyer: 'Open a property and choose I’m interested. That creates a lead admin can see after you switch accounts.',
      owner: 'Submit a plot or house. It stays pending until admin approves and publishes the listing.',
      associate: 'Refer a buyer against an available property. Admin will see that lead with you as the source.',
      builder: 'Create a project, then add a unit. Admin’s project list updates in this same browser.',
      admin: 'A new buyer enquiry lands in Leads. Confirm the visit, then open a deal.',
    };
    return lines[this.workspace()];
  });
  readonly stats = computed(() => {
    const state = this.state();
    const user = this.user();
    const role = this.workspace();
    if (!user) return [];
    if (role === 'admin') {
      const kpis = buildKpis(state, localISODate());
      return [
        { label: 'Total properties', value: String(kpis.totalProperties) },
        { label: 'Active listings', value: String(kpis.activeListings) },
        { label: 'New leads', value: String(kpis.newLeads) },
        { label: 'Pending approvals', value: String(kpis.pendingApprovals) },
        { label: 'Today’s site visits', value: String(kpis.todaysVisits) },
        { label: 'Active buyers', value: String(kpis.activeBuyers) },
        { label: 'Owners', value: String(kpis.owners) },
        { label: 'Associates', value: String(kpis.associates) },
        { label: 'Builders', value: String(kpis.builders) },
        { label: 'Deals', value: String(kpis.deals) },
      ];
    }
    if (role === 'buyer') {
      return [
        { label: 'Enquiries', value: String(state.enquiries.filter((item) => item.buyerId === user.id).length) },
        { label: 'Leads', value: String(state.leads.filter((item) => item.buyerId === user.id).length) },
        { label: 'Saved', value: String(state.favorites.filter((item) => item.userId === user.id).length) },
        { label: 'Site visits', value: String(state.siteVisits.filter((item) => item.buyerId === user.id).length) },
      ];
    }
    if (role === 'owner') {
      const mine = state.properties.filter((item) => item.ownerId === user.id || item.submittedById === user.id);
      return [
        { label: 'Properties', value: String(mine.length) },
        { label: 'Listed', value: String(mine.filter((item) => item.status === 'listed').length) },
        { label: 'Waiting on admin', value: String(mine.filter((item) => ['submitted', 'under_verification', 'changes_requested', 'approved'].includes(item.status)).length) },
        { label: 'Enquiries', value: String(state.enquiries.filter((item) => mine.some((property) => property.id === item.propertyId)).length) },
      ];
    }
    if (role === 'associate') {
      const commission = state.deals.filter((deal) => deal.associateId === user.id && deal.status === 'completed').reduce((sum, deal) => sum + deal.commission, 0);
      return [
        { label: 'My leads', value: String(state.leads.filter((lead) => lead.assignedToId === user.id || lead.referredById === user.id).length) },
        { label: 'Referred buyers', value: String(state.users.filter((item) => item.referredById === user.id).length) },
        { label: 'Visits', value: String(state.siteVisits.filter((visit) => visit.associateId === user.id).length) },
        { label: 'Earned commission', value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(commission) },
      ];
    }
    const projects = state.projects.filter((project) => project.builderId === user.id);
    return [
      { label: 'Projects', value: String(projects.length) },
      { label: 'Units', value: String(state.properties.filter((property) => property.builderId === user.id).length) },
      { label: 'Active listings', value: String(state.listings.filter((listing) => state.properties.some((property) => property.id === listing.propertyId && property.builderId === user.id && listing.status === 'active')).length) },
      { label: 'Deals', value: String(state.deals.filter((deal) => deal.builderId === user.id).length) },
    ];
  });
  readonly leads = computed(() => {
    const state = this.state();
    const user = this.user();
    const role = this.workspace();
    if (!user) return [];
    let items = state.leads;
    if (role === 'buyer') items = items.filter((lead) => lead.buyerId === user.id);
    if (role === 'owner') items = items.filter((lead) => state.properties.some((property) => property.id === lead.propertyId && property.ownerId === user.id));
    if (role === 'associate') items = items.filter((lead) => lead.assignedToId === user.id || lead.referredById === user.id);
    if (role === 'builder') items = items.filter((lead) => state.properties.some((property) => property.id === lead.propertyId && property.builderId === user.id));
    return leadRows(state, items).slice(0, 5);
  });
  readonly visits = computed(() => {
    const state = this.state();
    const user = this.user();
    const role = this.workspace();
    if (!user) return [];
    let items = state.siteVisits;
    if (role === 'buyer') items = items.filter((visit) => visit.buyerId === user.id);
    if (role === 'owner') items = items.filter((visit) => state.properties.some((property) => property.id === visit.propertyId && property.ownerId === user.id));
    if (role === 'associate') items = items.filter((visit) => visit.associateId === user.id);
    if (role === 'builder') items = items.filter((visit) => state.properties.some((property) => property.id === visit.propertyId && property.builderId === user.id));
    return visitRows(state, items).slice(0, 5);
  });
  readonly deals = computed(() => dealRows(this.state(), this.state().deals.filter((deal) => deal.buyerId === this.user()?.id)).slice(0, 4));
  readonly messages = computed(() => this.state().messages.slice(0, 4));
}
