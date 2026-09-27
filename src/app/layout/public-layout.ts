import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { homeFor } from '../core/labels';
import { LOCATIONS } from '../core/labels';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="demo-bar">Demonstration prototype with sample data. These properties are not live listings.</div>
    <header class="site-header">
      <div class="container header-row">
        <a class="brand" routerLink="/">
          <img src="logo.jpg" alt="ManaNelloreRealEstate logo" />
          <span class="brand-text"><strong>ManaNellore</strong><span>Real Estate</span></span>
        </a>
        <button type="button" class="nav-toggle" [attr.aria-expanded]="open()" aria-label="Open menu" (click)="open.set(!open())">Menu</button>
        <nav class="site-nav" [class.open]="open()">
          <a routerLink="/buy" routerLinkActive="active" [queryParams]="{ kind: 'both' }">Buy</a>
          <a routerLink="/properties" routerLinkActive="active">Properties</a>
          <a routerLink="/projects" routerLinkActive="active">Projects</a>
          <a routerLink="/sell" routerLinkActive="active">Sell / List</a>
          <a routerLink="/about" routerLinkActive="active">About</a>
          <a routerLink="/contact" routerLinkActive="active">Contact</a>
        </nav>
        <div class="header-actions">
          @if (user(); as current) {
            <a class="btn btn-ghost btn-sm" [routerLink]="homeFor(current.role)">Dashboard</a>
            <button type="button" class="btn btn-primary btn-sm" (click)="logout()">Logout</button>
          } @else {
            <a class="btn btn-ghost btn-sm" routerLink="/login">Login</a>
            <a class="btn btn-primary btn-sm" routerLink="/register">Register</a>
          }
        </div>
      </div>
    </header>
    <main>
      <router-outlet />
    </main>
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <a class="brand" routerLink="/">
            <img src="logo.jpg" alt="" />
            <span class="brand-text"><strong>ManaNellore</strong><span>Real Estate</span></span>
          </a>
          <p>Buy, sell, invest and grow across Nellore. Building trust, creating futures.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <a routerLink="/buy" [queryParams]="{ kind: 'plot' }">Plots</a>
          <a routerLink="/buy" [queryParams]="{ kind: 'house' }">Houses</a>
          <a routerLink="/projects">Projects</a>
          <a routerLink="/sell">List a property</a>
        </div>
        <div>
          <h3>Locations</h3>
          @for (location of locations.slice(0, 6); track location) {
            <a routerLink="/buy" [queryParams]="{ kind: 'both', location }">{{ location }}</a>
          }
        </div>
        <div>
          <h3>Demo office</h3>
          <p>Trunk Road, Nellore, Andhra Pradesh</p>
          <p>9000000000</p>
          <p>hello&#64;mananellore.com</p>
        </div>
      </div>
      <div class="container legal">Sample data only. ManaNelloreRealEstate demo accounts use the password 12345678. Nothing here is a real offer.</div>
    </footer>
  `,
})
export class PublicLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly open = signal(false);
  readonly homeFor = homeFor;
  readonly locations = LOCATIONS;

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.open.set(false));
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
