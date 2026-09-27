import { Injectable, inject } from '@angular/core';
import { DataStoreService } from './data-store.service';
import { DEMO_PASSWORD, nextId } from './format';
import { LeadService } from './lead.service';
import { Lead, User } from './models';

export interface ReferBuyerInput {
  name: string;
  email: string;
  phone: string;
  location: string;
  propertyId?: string;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class AssociateService {
  private readonly store = inject(DataStoreService);
  private readonly leads = inject(LeadService);

  referBuyer(associate: User, input: ReferBuyerInput): { buyer: User; lead?: Lead; createdUser: boolean } {
    const email = input.email.trim().toLowerCase();
    let createdUser = false;
    let buyer = this.store.snapshot.users.find((user) => user.email.toLowerCase() === email);
    if (buyer && buyer.role !== 'buyer') {
      throw new Error('That email belongs to a non-buyer account.');
    }
    if (!buyer) {
      this.store.update((state) => {
        buyer = {
          id: nextId(state.users.map((user) => user.id), 'U'),
          role: 'buyer',
          name: input.name.trim(),
          email,
          phone: input.phone.trim(),
          password: DEMO_PASSWORD,
          location: input.location,
          active: true,
          referredById: associate.id,
          createdAt: new Date().toISOString(),
          bio: 'Referred buyer created in the demo.',
        };
        state.users.unshift(buyer);
      });
      createdUser = true;
    } else if (!buyer.referredById) {
      this.store.update((state) => {
        const found = state.users.find((user) => user.id === buyer?.id);
        if (found && !found.referredById) found.referredById = associate.id;
      });
    }
    if (!buyer) throw new Error('Could not save the buyer.');
    let lead: Lead | undefined;
    if (input.propertyId) {
      lead = this.leads.refer({
        buyerId: buyer.id,
        propertyId: input.propertyId,
        associate,
        notes: input.notes || `Referred by ${associate.name}.`,
        source: 'associate',
      });
    }
    return { buyer, lead, createdUser };
  }
}
