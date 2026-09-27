import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppState } from './models';
import { createSeed } from './seed';

const STORAGE_KEY = 'mnre-demo-state-v1';

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  private readonly stateSubject = new BehaviorSubject<AppState>(this.read());
  readonly state$ = this.stateSubject.asObservable();

  get snapshot(): AppState {
    return this.stateSubject.value;
  }

  update(mutator: (state: AppState) => void): void {
    const next = structuredClone(this.snapshot);
    mutator(next);
    this.commit(next);
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.commit(createSeed());
  }

  private commit(state: AppState): void {
    this.stateSubject.next(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private read(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed?.users && parsed.properties && parsed.listings && parsed.leads && parsed.settings) {
          return parsed;
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    const seed = createSeed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}
