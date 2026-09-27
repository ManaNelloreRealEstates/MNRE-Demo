import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminService } from '../core/admin.service';
import { AuthService } from '../core/auth.service';
import { LOCATIONS } from '../core/labels';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-about-page',
  template: `
    <section class="page">
      <div class="container" style="max-width:860px">
        <p class="eyebrow">About</p>
        <h1>A Nellore desk for the whole transaction.</h1>
        <p>ManaNelloreRealEstate is a local platform for plots and houses. This version is a working prototype: every person, price and photo is sample data so the business flow can be walked end to end.</p>
        <h2>Five actors</h2>
        <div class="why-grid">
          <article class="why-card"><strong>Buyer</strong><p class="muted">Searches, saves, enquires, visits and negotiates. A buyer is a person. A lead is the record of their interest.</p></article>
          <article class="why-card"><strong>Owner</strong><p class="muted">Submits a plot or house. Admin verifies it before it becomes a listing.</p></article>
          <article class="why-card"><strong>Associate</strong><p class="muted">A business partner who brings properties and buyers, attends visits and earns commission.</p></article>
          <article class="why-card"><strong>Builder</strong><p class="muted">Publishes projects and the units inside them. A builder is not the same as an owner.</p></article>
        </div>
        <article class="why-card" style="margin-top:14px"><strong>Admin</strong><p class="muted">Approves properties, runs the lead desk, confirms site visits and records deals. Admin can open every other workspace.</p></article>
        <h2>The path</h2>
        <p>Property, then listing, then buyer search, enquiry, lead, site visit, negotiation and deal. The same records appear in each actor’s dashboard.</p>
      </div>
    </section>
  `,
})
export class AboutPage {
  constructor() {
    inject(Title).setTitle('About | ManaNelloreRealEstate');
  }
}

@Component({
  selector: 'app-contact-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="container login-grid">
        <div>
          <p class="eyebrow">Contact</p>
          <h1>Talk to the Nellore desk.</h1>
          <p>Demo office, Trunk Road, Nellore, Andhra Pradesh 524001</p>
          <p>9000000000<br />hello&#64;mananellore.com</p>
          <p class="muted">This form stores a sample message for admin. It does not send email or WhatsApp.</p>
        </div>
        <form class="form-card" style="padding:16px" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">
            <div class="field"><label for="name">Name</label><input id="name" formControlName="name" />@if (invalid('name')) { <p class="field-error">Name is required.</p> }</div>
            <div class="field"><label for="phone">Phone</label><input id="phone" formControlName="phone" />@if (invalid('phone')) { <p class="field-error">Enter a phone number.</p> }</div>
            <div class="field span-2"><label for="email">Email</label><input id="email" type="email" formControlName="email" />@if (invalid('email')) { <p class="field-error">Enter a valid email.</p> }</div>
            <div class="field span-2"><label for="message">Message</label><textarea id="message" formControlName="message"></textarea>@if (invalid('message')) { <p class="field-error">Tell us a little more.</p> }</div>
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid && form.touched">Send message</button>
        </form>
      </div>
    </section>
  `,
})
export class ContactPage {
  private readonly fb = inject(FormBuilder);
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.minLength(10)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor() {
    inject(Title).setTitle('Contact | ManaNelloreRealEstate');
  }

  invalid(name: 'name' | 'phone' | 'email' | 'message'): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.admin.submitContact(this.form.getRawValue());
    this.form.reset();
    this.toast.show('Message saved for the admin demo inbox.');
  }
}

@Component({
  selector: 'app-sell-page',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="container">
        <p class="eyebrow">Sell / List</p>
        <h1>Put a Nellore property on the desk.</h1>
        <p>A property is the place itself. A listing is the offer buyers see after admin approval.</p>
        <div class="why-grid">
          <article class="why-card"><strong>Owner</strong><p class="muted">Submit your own plot or house. It moves from draft to submitted, verification, approval and listed.</p>@if (user()?.role === 'owner' || user()?.role === 'admin') { <a class="btn btn-dark btn-sm" routerLink="/owner/properties/new">Add property</a> }</article>
          <article class="why-card"><strong>Associate</strong><p class="muted">Bring an owner’s property or a buyer. Your name stays on the listing and the lead.</p>@if (user()?.role === 'associate' || user()?.role === 'admin') { <a class="btn btn-dark btn-sm" routerLink="/associate/properties/new">Submit a property</a> }</article>
          <article class="why-card"><strong>Builder</strong><p class="muted">Create a project, then add villas, houses or apartments as units.</p>@if (user()?.role === 'builder' || user()?.role === 'admin') { <a class="btn btn-dark btn-sm" routerLink="/builder/projects/new">Create a project</a> }</article>
          <article class="why-card"><strong>Buyer</strong><p class="muted">Buyers do not list property. They search, enquire and book visits.</p><a class="btn btn-ghost btn-sm" routerLink="/buy" [queryParams]="{ kind: 'both' }">Search instead</a></article>
        </div>
        @if (!user()) {
          <div class="cta-band" style="margin-top:22px">
            <div><h2>Sign in to submit</h2><p>Use an owner, associate, builder or admin demo account.</p></div>
            <a class="btn btn-primary" routerLink="/login" [queryParams]="{ returnUrl: '/sell' }">Login</a>
          </div>
        }
        <p class="muted" style="margin-top:18px">Sample locations: {{ locations.join(', ') }}.</p>
      </div>
    </section>
  `,
})
export class SellPage {
  private readonly auth = inject(AuthService);
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly locations = [...LOCATIONS];

  constructor() {
    inject(Title).setTitle('Sell or list property | ManaNelloreRealEstate');
  }
}

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="container empty">
        <h1>Page not found</h1>
        <p class="muted">That address is not part of this demo.</p>
        <a class="btn btn-dark" routerLink="/">Go home</a>
      </div>
    </section>
  `,
})
export class NotFoundPage {}
