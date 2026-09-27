import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataStoreService } from './data-store.service';
import { nextId } from './format';
import { Listing, ListingStatus, User } from './models';

@Injectable({ providedIn: 'root' })
export class ListingService {
  private readonly store = inject(DataStoreService);
  private readonly seenViews = new Set<string>();

  readonly listings$: Observable<Listing[]> = this.store.state$.pipe(map((state) => state.listings));

  publish(propertyId: string, actor: User): Listing | null {
    let listing: Listing | null = null;
    this.store.update((state) => {
      const property = state.properties.find((item) => item.id === propertyId);
      if (!property) return;
      property.status = 'approved';
      const existing = state.listings.find((item) => item.propertyId === propertyId && item.status !== 'expired');
      if (existing && existing.status !== 'sold') {
        existing.status = 'active';
        existing.price = property.askingPrice;
        existing.listedById = property.submittedById;
        existing.listedByRole = property.submittedByRole;
        property.status = 'listed';
        property.updatedAt = new Date().toISOString();
        listing = existing;
        return;
      }
      listing = {
        id: nextId(state.listings.map((item) => item.id), 'L'),
        propertyId,
        listedById: property.submittedById || actor.id,
        listedByRole: property.submittedByRole || actor.role,
        price: property.askingPrice,
        status: 'active',
        featured: false,
        createdAt: new Date().toISOString(),
        views: 0,
      };
      state.listings.unshift(listing);
      property.status = 'listed';
      property.updatedAt = listing.createdAt;
    });
    return listing;
  }

  setStatus(id: string, status: ListingStatus): void {
    this.store.update((state) => {
      const listing = state.listings.find((item) => item.id === id);
      if (listing) listing.status = status;
    });
  }

  setPrice(id: string, price: number): void {
    this.store.update((state) => {
      const listing = state.listings.find((item) => item.id === id);
      if (!listing) return;
      listing.price = price;
      const property = state.properties.find((item) => item.id === listing.propertyId);
      if (property) property.askingPrice = price;
    });
  }

  toggleFeatured(id: string): void {
    this.store.update((state) => {
      const listing = state.listings.find((item) => item.id === id);
      if (listing) listing.featured = !listing.featured;
    });
  }

  incrementView(propertyId: string): void {
    if (this.seenViews.has(propertyId)) return;
    this.seenViews.add(propertyId);
    this.store.update((state) => {
      const listing = state.listings.find((item) => item.propertyId === propertyId && item.status === 'active');
      if (listing) listing.views += 1;
    });
  }
}
