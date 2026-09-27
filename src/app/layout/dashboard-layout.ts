import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';
import { ROLE_LABEL, homeFor } from '../core/labels';
import { UserRole } from '../core/models';
import { BOTTOM_NAV, ROLE_NAV } from '../core/nav';

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dash">
      <aside class="sidebar" [class.open]="menuOpen()">
        <a class="brand" routerLink="/">
          <img src="logo.jpg" alt="ManaNelloreRealEstate logo" />
          <span class="brand-text"><strong>ManaNellore</strong><span>{{ roleLabel[workspace()] }}</span></span>
        </a>
        @if (user()?.role === 'admin' && workspace() !== 'admin') {
          <a class="side-link" routerLink="/admin/dashboard">Back to admin</a>
        }
        @for (item of nav(); track item.path) {
          <a class="side-link" [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exact }">{{ item.label }}</a>
        }
        @if (user(); as current) {
          <div class="user-chip">
            <strong>{{ current.name }}</strong>
            <div class="muted">{{ current.email }}</div>
            <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px;color:#fff6d5;border-color:rgba(255,246,213,.3)" (click)="logout()">Logout</button>
          </div>
        }
      </aside>
      <section class="dash-main">
        <div class="dash-top">
          <button type="button" class="btn btn-dark btn-sm filters-toggle" (click)="menuOpen.set(true)">Menu</button>
          <a class="btn btn-ghost btn-sm" routerLink="/">View website</a>
        </div>
        <router-outlet />
      </section>
    </div>
    <nav class="bottom-nav">
      @for (item of bottom(); track item.path) {
        <a [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: !!item.exact }">{{ item.label }}</a>
      }
      <button type="button" [class.active]="moreOpen()" (click)="moreOpen.set(!moreOpen())">More</button>
    </nav>
    @if (moreOpen()) {
      <div class="menu-sheet">
        @for (item of more(); track item.path) {
          <a class="side-link" style="color:#14181f" [routerLink]="item.path" (click)="moreOpen.set(false)">{{ item.label }}</a>
        }
        <a class="side-link" style="color:#14181f" routerLink="/" (click)="moreOpen.set(false)">Website</a>
        <button type="button" class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
      </div>
    }
  `,
})
export class DashboardLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly menuOpen = signal(false);
  readonly moreOpen = signal(false);
  readonly roleLabel = ROLE_LABEL;
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly workspace = computed(() => {
    const segment = this.url().split('?')[0].split('/').filter(Boolean)[0] as UserRole;
    if (segment in ROLE_NAV) return segment;
    return this.user()?.role ?? 'buyer';
  });
  readonly nav = computed(() => ROLE_NAV[this.workspace()]);
  readonly bottom = computed(() => BOTTOM_NAV[this.workspace()]);
  readonly more = computed(() => {
    const primary = new Set(this.bottom().map((item) => item.path));
    return this.nav().filter((item) => !primary.has(item.path));
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
        this.moreOpen.set(false);
      });
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
