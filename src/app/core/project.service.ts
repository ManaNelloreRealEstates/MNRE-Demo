import { Injectable, inject } from '@angular/core';
import { DataStoreService } from './data-store.service';
import { cityFor, nextId } from './format';
import { Project, ProjectStatus, User } from './models';

export interface ProjectInput {
  name: string;
  location: string;
  description: string;
  images: string[];
  amenities: string[];
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
  status: ProjectStatus;
  developerName: string;
  builderId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly store = inject(DataStoreService);

  create(input: ProjectInput, actor: User): Project {
    let created!: Project;
    this.store.update((state) => {
      created = {
        id: nextId(state.projects.map((item) => item.id), 'PR'),
        builderId: input.builderId || actor.id,
        name: input.name.trim(),
        location: input.location,
        city: cityFor(input.location),
        description: input.description.trim(),
        images: input.images,
        amenities: input.amenities,
        totalUnits: input.totalUnits,
        availableUnits: input.availableUnits,
        soldUnits: input.soldUnits,
        status: input.status,
        developerName: input.developerName.trim(),
        createdAt: new Date().toISOString(),
      };
      state.projects.unshift(created);
    });
    return created;
  }
}
