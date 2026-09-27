import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of, throwError } from 'rxjs';
import { delay, map, shareReplay } from 'rxjs/operators';
import { DataStoreService } from './data-store.service';
import { DEMO_PASSWORD, nextId } from './format';
import { User, UserRole } from './models';

const SESSION_KEY = 'mnre-demo-session';

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  role: Exclude<UserRole, 'admin'>;
  location: string;
  company?: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(DataStoreService);
  private readonly session$ = new BehaviorSubject<string | null>(localStorage.getItem(SESSION_KEY));

  readonly currentUser$: Observable<User | null> = combineLatest([this.store.state$, this.session$]).pipe(
    map(([state, id]) => state.users.find((user) => user.id === id && user.active) ?? null),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  login(email: string, password: string): Observable<User> {
    const user = this.store.snapshot.users.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password,
    );
    if (!user) return throwError(() => new Error('Those details do not match a demo account.')).pipe(delay(300));
    if (!user.active) return throwError(() => new Error('This demo account is disabled.')).pipe(delay(300));
    return of(user).pipe(
      delay(300),
      map((found) => {
        localStorage.setItem(SESSION_KEY, found.id);
        this.session$.next(found.id);
        return found;
      }),
    );
  }

  register(input: RegisterInput): Observable<User> {
    const email = input.email.trim().toLowerCase();
    if (this.store.snapshot.users.some((user) => user.email.toLowerCase() === email)) {
      return throwError(() => new Error('That email is already used in the demo.'));
    }
    let created!: User;
    this.store.update((state) => {
      created = {
        id: nextId(state.users.map((user) => user.id), 'U'),
        role: input.role,
        name: input.name.trim(),
        email,
        phone: input.phone.trim(),
        password: input.password || DEMO_PASSWORD,
        company: input.company?.trim() || undefined,
        location: input.location,
        active: true,
        createdAt: new Date().toISOString(),
      };
      state.users.unshift(created);
    });
    return this.login(created.email, created.password);
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.session$.next(null);
  }

  getCurrentUser(): User | null {
    const id = this.session$.value;
    if (!id) return null;
    return this.store.snapshot.users.find((user) => user.id === id && user.active) ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  getRole(): UserRole | null {
    return this.getCurrentUser()?.role ?? null;
  }

  updateProfile(patch: Partial<Pick<User, 'name' | 'phone' | 'company' | 'location' | 'bio'>>): void {
    const current = this.getCurrentUser();
    if (!current) return;
    this.store.update((state) => {
      const user = state.users.find((item) => item.id === current.id);
      if (!user) return;
      user.name = patch.name?.trim() || user.name;
      user.phone = patch.phone?.trim() || user.phone;
      user.location = patch.location?.trim() || user.location;
      user.company = patch.company?.trim() || undefined;
      user.bio = patch.bio?.trim() || undefined;
    });
  }

  demoLogin(email: string): Observable<User> {
    return this.login(email, DEMO_PASSWORD);
  }
}
