import { Injectable, inject } from '@angular/core';
import { DataStoreService } from './data-store.service';
import { nextId } from './format';
import { Deal, DealStatus } from './models';

@Injectable({ providedIn: 'root' })
export class DealService {
  private readonly store = inject(DataStoreService);

  createFromLead(leadId: string, status: DealStatus = 'negotiation'): Deal | null {
    const existing = this.store.snapshot.deals.find((deal) => deal.leadId === leadId && deal.status !== 'cancelled');
    if (existing) return existing;
    const lead = this.store.snapshot.leads.find((item) => item.id === leadId);
    const property = this.store.snapshot.properties.find((item) => item.id === lead?.propertyId);
    if (!lead || !property) return null;
    const listing = this.store.snapshot.listings.find((item) => item.propertyId === property.id);
    let created!: Deal;
    this.store.update((state) => {
      const value = listing?.price ?? property.askingPrice;
      created = {
        id: nextId(state.deals.map((item) => item.id), 'DL'),
        buyerId: lead.buyerId,
        propertyId: property.id,
        ownerId: property.ownerId,
        builderId: property.builderId,
        associateId: lead.assignedToId,
        leadId: lead.id,
        value,
        commission: Math.round(value * 0.02),
        status,
        date: new Date().toISOString().slice(0, 10),
        notes: 'Created from the lead in this demo.',
      };
      state.deals.unshift(created);
      const current = state.leads.find((item) => item.id === lead.id);
      if (current && current.status !== 'converted' && current.status !== 'lost') {
        current.status = status === 'completed' || status === 'confirmed' ? 'converted' : 'negotiation';
      }
      if (status === 'completed') {
        const liveListing = state.listings.find((item) => item.propertyId === property.id && item.status === 'active');
        if (liveListing) liveListing.status = 'sold';
      }
    });
    return created;
  }

  updateStatus(id: string, status: DealStatus): void {
    this.store.update((state) => {
      const deal = state.deals.find((item) => item.id === id);
      if (!deal) return;
      deal.status = status;
      const lead = state.leads.find((item) => item.id === deal.leadId);
      if (lead && status === 'completed') lead.status = 'converted';
      if (lead && status === 'cancelled' && lead.status !== 'converted') lead.status = 'lost';
      if (lead && (status === 'negotiation' || status === 'booking' || status === 'confirmed')) {
        if (lead.status !== 'converted' && lead.status !== 'lost') {
          lead.status = status === 'confirmed' ? 'converted' : 'negotiation';
        }
      }
      if (status === 'completed') {
        const listing = state.listings.find((item) => item.propertyId === deal.propertyId && item.status === 'active');
        if (listing) listing.status = 'sold';
      }
    });
  }

  updateValue(id: string, value: number, commission: number): void {
    this.store.update((state) => {
      const deal = state.deals.find((item) => item.id === id);
      if (!deal) return;
      deal.value = value;
      deal.commission = commission;
    });
  }
}
