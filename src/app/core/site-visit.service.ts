import { Injectable, inject } from '@angular/core';
import { DataStoreService } from './data-store.service';
import { nextId } from './format';
import { LeadStatus, SiteVisit, VisitStatus } from './models';

@Injectable({ providedIn: 'root' })
export class SiteVisitService {
  private readonly store = inject(DataStoreService);

  request(input: {
    buyerId: string;
    propertyId: string;
    date: string;
    time: string;
    notes: string;
    requestedById: string;
    associateId?: string;
  }): SiteVisit {
    const open = this.store.snapshot.siteVisits.find(
      (visit) =>
        visit.buyerId === input.buyerId &&
        visit.propertyId === input.propertyId &&
        ['requested', 'confirmed', 'rescheduled'].includes(visit.status),
    );
    if (open) return open;

    let created!: SiteVisit;
    this.store.update((state) => {
      let lead = state.leads.find(
        (item) => item.buyerId === input.buyerId && item.propertyId === input.propertyId && item.status !== 'lost',
      );
      if (!lead) {
        const listing = state.listings.find((item) => item.propertyId === input.propertyId && item.status === 'active');
        lead = {
          id: nextId(state.leads.map((item) => item.id), 'LD'),
          buyerId: input.buyerId,
          propertyId: input.propertyId,
          listingId: listing?.id,
          source: 'website',
          status: 'site_visit_scheduled',
          assignedToId: input.associateId || (listing?.listedByRole === 'associate' ? listing.listedById : undefined),
          createdAt: new Date().toISOString(),
          notes: input.notes.trim(),
        };
        state.leads.unshift(lead);
      } else {
        advance(lead, 'site_visit_scheduled');
        if (!lead.assignedToId && input.associateId) lead.assignedToId = input.associateId;
      }
      created = {
        id: nextId(state.siteVisits.map((item) => item.id), 'SV'),
        leadId: lead.id,
        buyerId: input.buyerId,
        propertyId: input.propertyId,
        associateId: input.associateId || lead.assignedToId,
        date: input.date,
        time: input.time,
        status: 'requested',
        notes: input.notes.trim(),
        requestedById: input.requestedById,
        createdAt: new Date().toISOString(),
      };
      state.siteVisits.unshift(created);
    });
    return created;
  }

  update(id: string, patch: Partial<Pick<SiteVisit, 'date' | 'time' | 'status' | 'associateId' | 'notes'>>): void {
    this.store.update((state) => {
      const visit = state.siteVisits.find((item) => item.id === id);
      if (!visit) return;
      if (patch.date) visit.date = patch.date;
      if (patch.time) visit.time = patch.time;
      if (patch.notes !== undefined) visit.notes = patch.notes;
      if (patch.associateId !== undefined) visit.associateId = patch.associateId || undefined;
      if (patch.status) {
        visit.status = patch.status;
        const lead = state.leads.find((item) => item.id === visit.leadId);
        if (lead) {
          if (patch.status === 'completed') advance(lead, 'site_visit_completed');
          if (patch.status === 'confirmed' || patch.status === 'rescheduled' || patch.status === 'requested') {
            advance(lead, 'site_visit_scheduled');
          }
          if (patch.associateId && !lead.assignedToId) lead.assignedToId = patch.associateId;
        }
      }
    });
  }
}

const ORDER: LeadStatus[] = [
  'new',
  'contacted',
  'interested',
  'site_visit_scheduled',
  'site_visit_completed',
  'negotiation',
  'converted',
];

function advance(lead: { status: LeadStatus }, next: LeadStatus): void {
  if (lead.status === 'converted' || lead.status === 'lost') return;
  if (ORDER.indexOf(next) > ORDER.indexOf(lead.status)) lead.status = next;
}

export type { VisitStatus };
