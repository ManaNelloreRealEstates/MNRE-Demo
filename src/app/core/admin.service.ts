import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataStoreService } from './data-store.service';
import { nextId } from './format';
import { User } from './models';
import { Kpis, buildKpis } from './views';
import { localISODate } from './format';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly store = inject(DataStoreService);

  readonly kpis$: Observable<Kpis> = this.store.state$.pipe(map((state) => buildKpis(state, localISODate())));

  usersByRole(role?: User['role']): Observable<User[]> {
    return this.store.state$.pipe(
      map((state) => state.users.filter((user) => (role && role !== 'admin' ? user.role === role : true))),
    );
  }

  setActive(userId: string, active: boolean): void {
    this.store.update((state) => {
      const user = state.users.find((item) => item.id === userId);
      if (user) user.active = active;
    });
  }

  submitContact(input: { name: string; email: string; phone: string; message: string }): void {
    this.store.update((state) => {
      state.messages.unshift({
        id: nextId(state.messages.map((item) => item.id), 'M'),
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        message: input.message.trim(),
        createdAt: new Date().toISOString(),
      });
    });
  }

  updateSettings(patch: Partial<{ brandName: string; supportEmail: string; supportPhone: string; officeAddress: string; tagline: string }>): void {
    this.store.update((state) => {
      state.settings = { ...state.settings, ...patch };
    });
  }

  resetDemo(): void {
    this.store.reset();
  }
}
