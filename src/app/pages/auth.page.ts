import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DEMO_PASSWORD } from '../core/format';
import { homeFor, LOCATIONS } from '../core/labels';
import { UserRole } from '../core/models';
import { ToastService } from '../core/toast.service';
import { AdminService } from '../core/admin.service';
import { ConfirmService } from '../core/confirm.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <div class="container">
        <div class="login-grid">
          <div>
            <p class="eyebrow">Demo login</p>
            <h1>Choose an actor and walk the business.</h1>
            <p>Every demo account uses the password <strong>{{ password }}</strong>. There is no OTP or live authentication in this version.</p>
            <div class="actor-grid">
              @for (account of accounts; track account.email) {
                <button type="button" class="actor-card" (click)="quick(account.email)" [disabled]="busy()">
                  <strong>{{ account.role }}</strong>
                  <span class="muted">{{ account.email }}</span>
                  <span>{{ account.text }}</span>
                </button>
              }
            </div>
          </div>
          <form class="form-card" style="padding:18px" [formGroup]="form" (ngSubmit)="submit()">
            <h2>Sign in</h2>
            <div class="field"><label for="email">Email</label><input id="email" type="email" formControlName="email" autocomplete="username" /></div>
            <div class="field" style="margin-top:10px"><label for="password">Password</label><input id="password" type="password" formControlName="password" autocomplete="current-password" /></div>
            @if (error()) { <p class="field-error">{{ error() }}</p> }
            <div class="search-actions">
              <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Checking…' : 'Login' }}</button>
              <a class="btn btn-ghost" routerLink="/register">Create account</a>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" (click)="resetDemo()">Reset demo data</button>
          </form>
        </div>
      </div>
    </section>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly admin = inject(AdminService);
  private readonly confirm = inject(ConfirmService);
  readonly password = DEMO_PASSWORD;
  readonly busy = signal(false);
  readonly error = signal('');
  readonly accounts = [
    { role: 'Buyer', email: 'buyer@mananellore.com', text: 'Search, enquire, visit' },
    { role: 'Owner', email: 'owner@mananellore.com', text: 'Properties and listings' },
    { role: 'Associate', email: 'associate@mananellore.com', text: 'Buyers, leads, commission' },
    { role: 'Builder', email: 'builder@mananellore.com', text: 'Projects and units' },
    { role: 'Admin', email: 'admin@mananellore.com', text: 'The whole platform' },
  ];
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: [DEMO_PASSWORD, [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    inject(Title).setTitle('Login | ManaNelloreRealEstate');
  }

  quick(email: string): void {
    this.form.patchValue({ email, password: DEMO_PASSWORD });
    this.submit();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Enter the email and the demo password.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const raw = this.form.getRawValue();
    this.auth.login(raw.email, raw.password).subscribe({
      next: (user) => {
        this.busy.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const target = returnUrl && this.canUse(returnUrl, user.role) ? returnUrl : homeFor(user.role);
        void this.router.navigateByUrl(target);
      },
      error: (err: Error) => {
        this.busy.set(false);
        this.error.set(err.message);
      },
    });
  }

  async resetDemo(): Promise<void> {
    const ok = await this.confirm.ask('This clears enquiries and edits you made in the browser and restores the original sample data.', 'Reset demo data', 'Reset', 'Keep my data', true);
    if (!ok) return;
    this.admin.resetDemo();
    this.toast.show('Demo data restored.');
  }

  private canUse(url: string, role: UserRole): boolean {
    if (role === 'admin') return true;
    return url.startsWith(`/${role}`);
  }
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="page">
      <div class="container" style="max-width:760px">
        <p class="eyebrow">Register</p>
        <h1>Create a demo account</h1>
        <p class="muted">Admin accounts are not created here. New people are stored only in this browser.</p>
        <form class="form-card" style="padding:16px" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <div class="field"><label for="name">Name</label><input id="name" formControlName="name" /></div>
            <div class="field"><label for="role">I am</label>
              <select id="role" formControlName="role">
                <option value="buyer">Buyer</option>
                <option value="owner">Owner</option>
                <option value="associate">Associate</option>
                <option value="builder">Builder</option>
              </select>
            </div>
            <div class="field"><label for="email">Email</label><input id="email" type="email" formControlName="email" /></div>
            <div class="field"><label for="phone">Phone</label><input id="phone" formControlName="phone" /></div>
            <div class="field"><label for="location">Location</label>
              <select id="location" formControlName="location">
                @for (location of locations; track location) { <option [value]="location">{{ location }}</option> }
              </select>
            </div>
            <div class="field"><label for="company">Company</label><input id="company" formControlName="company" placeholder="Optional" /></div>
            <div class="field span-2"><label for="password">Password</label><input id="password" type="password" formControlName="password" /></div>
          </div>
          @if (error()) { <p class="field-error">{{ error() }}</p> }
          <div class="search-actions">
            <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create and continue' }}</button>
            <a class="btn btn-ghost" routerLink="/login">I already have an account</a>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly locations = [...LOCATIONS];
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    role: ['buyer' as 'buyer' | 'owner' | 'associate' | 'builder', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    location: [LOCATIONS[0], Validators.required],
    company: [''],
    password: [DEMO_PASSWORD, [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    inject(Title).setTitle('Register | ManaNelloreRealEstate');
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set('Complete the required fields.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.busy.set(false);
        void this.router.navigateByUrl(homeFor(user.role));
      },
      error: (err: Error) => {
        this.busy.set(false);
        this.error.set(err.message);
      },
    });
  }
}
