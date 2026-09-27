import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataStoreService } from './data-store.service';
import { Project, Property } from './models';

@Injectable({ providedIn: 'root' })
export class BuilderService {
  private readonly store = inject(DataStoreService);

  projectsFor(builderId: string): Observable<Project[]> {
    return this.store.state$.pipe(map((state) => state.projects.filter((project) => project.builderId === builderId)));
  }

  unitsFor(builderId: string): Observable<Property[]> {
    return this.store.state$.pipe(
      map((state) => state.properties.filter((property) => property.builderId === builderId)),
    );
  }
}
