import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataStoreService } from './data-store.service';
import { Property } from './models';

@Injectable({ providedIn: 'root' })
export class OwnerService {
  private readonly store = inject(DataStoreService);

  propertiesFor(ownerId: string): Observable<Property[]> {
    return this.store.state$.pipe(
      map((state) =>
        state.properties.filter((property) => property.ownerId === ownerId || property.submittedById === ownerId),
      ),
    );
  }
}
