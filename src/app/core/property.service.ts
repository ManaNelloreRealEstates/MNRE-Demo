import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataStoreService } from './data-store.service';
import { cityFor, nextId } from './format';
import { Property, PropertyInput, PropertyStatus, User } from './models';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private readonly store = inject(DataStoreService);

  readonly properties$: Observable<Property[]> = this.store.state$.pipe(map((state) => state.properties));

  create(input: PropertyInput, actor: User): Property {
    let created!: Property;
    this.store.update((state) => {
      const now = new Date().toISOString();
      created = {
        ...blankSpecific(),
        ...input,
        id: nextId(state.properties.map((item) => item.id), 'P'),
        city: cityFor(input.location),
        submittedById: actor.id,
        submittedByRole: actor.role,
        ownerId: input.ownerId ?? (actor.role === 'owner' ? actor.id : undefined),
        builderId: input.builderId ?? (actor.role === 'builder' ? actor.id : undefined),
        submittedAt: now,
        updatedAt: now,
        amenities: input.amenities ?? [],
        images: input.images.length ? input.images : [],
      };
      state.properties.unshift(created);
    });
    return created;
  }

  update(id: string, input: PropertyInput): void {
    this.store.update((state) => {
      const property = state.properties.find((item) => item.id === id);
      if (!property) return;
      const kept = {
        id: property.id,
        submittedById: property.submittedById,
        submittedByRole: property.submittedByRole,
        submittedAt: property.submittedAt,
        adminNote: input.status === 'submitted' ? property.adminNote : property.adminNote,
      };
      Object.assign(property, blankSpecific(), input, kept, {
        city: cityFor(input.location),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  setStatus(id: string, status: PropertyStatus, note?: string): void {
    this.store.update((state) => {
      const property = state.properties.find((item) => item.id === id);
      if (!property) return;
      property.status = status;
      property.updatedAt = new Date().toISOString();
      if (note !== undefined) property.adminNote = note;
      if (status === 'rejected' || status === 'changes_requested') {
        state.listings.forEach((listing) => {
          if (listing.propertyId === id && listing.status === 'active') listing.status = 'paused';
        });
      }
    });
  }

  removeDraft(id: string, userId: string): void {
    this.store.update((state) => {
      const property = state.properties.find((item) => item.id === id);
      if (!property || property.status !== 'draft') return;
      if (property.submittedById !== userId && property.ownerId !== userId) return;
      state.properties = state.properties.filter((item) => item.id !== id);
    });
  }
}

function blankSpecific(): Partial<Property> {
  return {
    plotSizeSqYd: undefined,
    facing: undefined,
    roadWidthFt: undefined,
    cornerPlot: undefined,
    gatedCommunity: undefined,
    approvalType: undefined,
    bhk: undefined,
    builtUpSqFt: undefined,
    plotAreaSqYd: undefined,
    propertyAgeYears: undefined,
    parking: undefined,
    furnished: undefined,
    projectId: undefined,
    ownerId: undefined,
    builderId: undefined,
  };
}
