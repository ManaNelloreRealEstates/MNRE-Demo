import { Injectable, inject } from '@angular/core';
import { DataStoreService } from './data-store.service';
import { nextId } from './format';
import { Lead, LeadSource, LeadStatus, User } from './models';

@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly store = inject(DataStoreService);

  expressInterest(buyer: User, propertyId: string, message: string): { lead: Lead; created: boolean } {
    const property = this.store.snapshot.properties.find((item) => item.id === propertyId);
    if (!property) throw new Error('Property not found');
    const existing = this.store.snapshot.leads.find(
      (lead) => lead.buyerId === buyer.id && lead.propertyId === propertyId && lead.status !== 'lost',
    );
    if (existing) return { lead: existing, created: false };

    let created!: Lead;
    this.store.update((state) => {
      const listing = state.listings.find((item) => item.propertyId === propertyId && item.status === 'active');
      const now = new Date().toISOString();
      const leadId = nextId(state.leads.map((item) => item.id), 'LD');
      const enquiryId = nextId(state.enquiries.map((item) => item.id), 'E');
      created = {
        id: leadId,
        buyerId: buyer.id,
        propertyId,
        listingId: listing?.id,
        enquiryId,
        source: 'website',
        status: 'new',
        assignedToId: listing?.listedByRole === 'associate' ? listing.listedById : undefined,
        createdAt: now,
        notes: '',
      };
      state.leads.unshift(created);
      state.enquiries.unshift({
        id: enquiryId,
        buyerId: buyer.id,
        propertyId,
        listingId: listing?.id,
        message: message.trim() || 'I am interested in this property.',
        createdAt: now,
        leadId,
      });
    });
    return { lead: created, created: true };
  }

  refer(input: {
    buyerId: string;
    propertyId: string;
    associate: User;
    notes: string;
    source?: LeadSource;
  }): Lead {
    const existing = this.store.snapshot.leads.find(
      (lead) => lead.buyerId === input.buyerId && lead.propertyId === input.propertyId && lead.status !== 'lost',
    );
    if (existing) return existing;
    let created!: Lead;
    this.store.update((state) => {
      const listing = state.listings.find((item) => item.propertyId === input.propertyId);
      created = {
        id: nextId(state.leads.map((item) => item.id), 'LD'),
        buyerId: input.buyerId,
        propertyId: input.propertyId,
        listingId: listing?.id,
        source: input.source ?? 'associate',
        status: 'new',
        assignedToId: input.associate.role === 'associate' ? input.associate.id : undefined,
        referredById: input.associate.role === 'associate' ? input.associate.id : undefined,
        createdAt: new Date().toISOString(),
        notes: input.notes.trim(),
      };
      state.leads.unshift(created);
    });
    return created;
  }

  updateStatus(id: string, status: LeadStatus): void {
    this.store.update((state) => {
      const lead = state.leads.find((item) => item.id === id);
      if (lead) lead.status = status;
    });
  }

  assign(id: string, associateId: string): void {
    this.store.update((state) => {
      const lead = state.leads.find((item) => item.id === id);
      if (lead) lead.assignedToId = associateId || undefined;
    });
  }

  addNote(id: string, note: string): void {
    this.store.update((state) => {
      const lead = state.leads.find((item) => item.id === id);
      if (!lead) return;
      const stamp = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      lead.notes = lead.notes ? `${lead.notes}\n${stamp}: ${note.trim()}` : note.trim();
    });
  }
}
