import { Injectable, inject } from '@angular/core';
import { LeadService } from './lead.service';
import { DataStoreService } from './data-store.service';
import { SiteVisitService } from './site-visit.service';
import { Lead, SiteVisit, User } from './models';

@Injectable({ providedIn: 'root' })
export class BuyerService {
  private readonly store = inject(DataStoreService);
  private readonly leads = inject(LeadService);
  private readonly visits = inject(SiteVisitService);

  isSaved(userId: string, propertyId: string): boolean {
    return this.store.snapshot.favorites.some((item) => item.userId === userId && item.propertyId === propertyId);
  }

  toggleFavorite(userId: string, propertyId: string): boolean {
    let saved = false;
    this.store.update((state) => {
      const index = state.favorites.findIndex((item) => item.userId === userId && item.propertyId === propertyId);
      if (index >= 0) {
        state.favorites.splice(index, 1);
        saved = false;
      } else {
        state.favorites.unshift({ userId, propertyId, createdAt: new Date().toISOString() });
        saved = true;
      }
    });
    return saved;
  }

  expressInterest(buyer: User, propertyId: string, message: string): { lead: Lead; created: boolean } {
    return this.leads.expressInterest(buyer, propertyId, message);
  }

  scheduleVisit(input: {
    buyer: User;
    propertyId: string;
    date: string;
    time: string;
    notes: string;
  }): { visit: SiteVisit; alreadyOpen: boolean } {
    const open = this.store.snapshot.siteVisits.find(
      (visit) =>
        visit.buyerId === input.buyer.id &&
        visit.propertyId === input.propertyId &&
        ['requested', 'confirmed', 'rescheduled'].includes(visit.status),
    );
    if (open) return { visit: open, alreadyOpen: true };
    const visit = this.visits.request({
      buyerId: input.buyer.id,
      propertyId: input.propertyId,
      date: input.date,
      time: input.time,
      notes: input.notes,
      requestedById: input.buyer.id,
    });
    return { visit, alreadyOpen: false };
  }
}
