import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DataStoreService } from '../core/data-store.service';
import { formatInr } from '../core/format';
import { poolFor } from '../core/images';
import {
  AMENITY_OPTIONS,
  APPROVAL_OPTIONS,
  FACING_OPTIONS,
  FURNISH_OPTIONS,
  LOCATIONS,
  PROJECT_STATUS_LABEL,
  TYPE_LABEL,
} from '../core/labels';
import { ListingService } from '../core/listing.service';
import { ApprovalType, Facing, Furnish, ProjectStatus, PropertyInput, PropertyType } from '../core/models';
import { ProjectService } from '../core/project.service';
import { PropertyService } from '../core/property.service';
import { ToastService } from '../core/toast.service';
import { ImgFallbackDirective } from '../shared/ui';

@Component({
  selector: 'app-property-form-page',
  imports: [ReactiveFormsModule, RouterLink, ImgFallbackDirective],
  template: `
    <section class="dash-page">
      <div class="dash-head">
        <div>
          <p class="eyebrow">Property</p>
          <h1>{{ editingId() ? 'Edit property' : 'Add property' }}</h1>
        </div>
        <a class="btn btn-ghost" routerLink="..">Back</a>
      </div>
      @if (locked()) {
        <div class="empty">
          <h3>This property cannot be edited right now</h3>
          <p class="muted">Status: {{ existing()?.status }}. Admin owns the next step.</p>
          @if (existing()?.adminNote) { <p class="hint">{{ existing()?.adminNote }}</p> }
        </div>
      } @else {
        <form class="panel" [formGroup]="form" (ngSubmit)="save('submitted')">
          <div class="form-grid">
            <div class="field">
              <label for="type">Property type</label>
              <select id="type" formControlName="type" (change)="onType($event)">
                @for (type of types(); track type) { <option [value]="type">{{ typeLabel[type] }}</option> }
              </select>
            </div>
            <div class="field"><label for="title">Title</label><input id="title" formControlName="title" /></div>
            <div class="field">
              <label for="location">Location</label>
              <select id="location" formControlName="location">
                @for (location of locations; track location) { <option [value]="location">{{ location }}</option> }
              </select>
            </div>
            <div class="field"><label for="price">Asking price (₹)</label><input id="price" type="number" formControlName="price" />@if (priceHint()) { <span class="muted">{{ priceHint() }}</span> }</div>
            <div class="field span-2"><label for="address">Address</label><input id="address" formControlName="address" /></div>
            <div class="field span-2"><label for="description">Description</label><textarea id="description" formControlName="description"></textarea></div>

            @if (user()?.role === 'associate') {
              <div class="field span-2">
                <label for="ownerId">Owner</label>
                <select id="ownerId" formControlName="ownerId">
                  <option value="">Select the owner</option>
                  @for (owner of owners(); track owner.id) { <option [value]="owner.id">{{ owner.name }} · {{ owner.phone }}</option> }
                </select>
              </div>
            }
            @if (user()?.role === 'builder' || (user()?.role === 'admin' && form.controls.source.value === 'builder')) {
              <div class="field span-2">
                <label for="projectId">Project</label>
                <select id="projectId" formControlName="projectId">
                  <option value="">No project</option>
                  @for (project of projects(); track project.id) { <option [value]="project.id">{{ project.name }}</option> }
                </select>
              </div>
            }
            @if (user()?.role === 'admin') {
              <div class="field">
                <label for="source">Provided by</label>
                <select id="source" formControlName="source">
                  <option value="owner">Owner</option>
                  <option value="builder">Builder</option>
                  <option value="admin">Admin directly</option>
                </select>
              </div>
              @if (form.controls.source.value === 'owner') {
                <div class="field">
                  <label for="ownerPick">Owner</label>
                  <select id="ownerPick" formControlName="ownerId">
                    @for (owner of owners(); track owner.id) { <option [value]="owner.id">{{ owner.name }}</option> }
                  </select>
                </div>
              }
              @if (form.controls.source.value === 'builder') {
                <div class="field">
                  <label for="builderPick">Builder</label>
                  <select id="builderPick" formControlName="builderId">
                    @for (builder of builders(); track builder.id) { <option [value]="builder.id">{{ builder.name }}</option> }
                  </select>
                </div>
              }
            }

            @if (isPlot()) {
              <div class="field"><label for="size">Plot size (sq yards)</label><input id="size" type="number" formControlName="plotSizeSqYd" /></div>
              <div class="field"><label for="road">Road width (ft)</label><input id="road" type="number" formControlName="roadWidthFt" /></div>
              <div class="field"><label for="facing">Facing</label><select id="facing" formControlName="facing">@for (option of facings; track option[0]) { <option [value]="option[0]">{{ option[1] }}</option> }</select></div>
              <div class="field"><label for="approval">Approval</label><select id="approval" formControlName="approvalType">@for (option of approvals; track option[0]) { <option [value]="option[0]">{{ option[1] }}</option> }</select></div>
              <label class="check-row"><input type="checkbox" formControlName="cornerPlot" /> Corner plot</label>
              <label class="check-row"><input type="checkbox" formControlName="gatedCommunity" /> Gated community</label>
            } @else {
              <div class="field"><label for="bhk">BHK</label><input id="bhk" type="number" formControlName="bhk" /></div>
              <div class="field"><label for="built">Built-up area (sq ft)</label><input id="built" type="number" formControlName="builtUpSqFt" /></div>
              <div class="field"><label for="plotArea">Plot area (sq yards)</label><input id="plotArea" type="number" formControlName="plotAreaSqYd" /></div>
              <div class="field"><label for="age">Property age (years)</label><input id="age" type="number" formControlName="propertyAgeYears" /></div>
              <div class="field"><label for="parking">Parking slots</label><input id="parking" type="number" formControlName="parking" /></div>
              <div class="field"><label for="furnished">Furnishing</label><select id="furnished" formControlName="furnished">@for (option of furnishes; track option[0]) { <option [value]="option[0]">{{ option[1] }}</option> }</select></div>
              <div class="field"><label for="facing2">Facing</label><select id="facing2" formControlName="facing">@for (option of facings; track option[0]) { <option [value]="option[0]">{{ option[1] }}</option> }</select></div>
              <label class="check-row"><input type="checkbox" formControlName="gatedCommunity" /> Gated community</label>
            }
          </div>
          <h3 style="margin:16px 0 8px">Amenities</h3>
          <div class="chips">
            @for (amenity of amenities; track amenity) {
              <label class="check-row"><input type="checkbox" [checked]="selectedAmenities().includes(amenity)" (change)="toggleAmenity(amenity)" /> {{ amenity }}</label>
            }
          </div>
          <h3 style="margin:16px 0 8px">Images</h3>
          <p class="muted">Choose up to four sample photos. Uploads are not stored in this demo.</p>
          <div class="image-picks">
            @for (image of imageChoices(); track image) {
              <button type="button" [class.on]="selectedImages().includes(image)" (click)="toggleImage(image)">
                <img appFallback [src]="image" alt="Sample property photo" />
              </button>
            }
          </div>
          @if (user()?.role === 'admin' && !editingId()) { <label class="check-row" style="margin-top:12px"><input type="checkbox" formControlName="publishNow" /> Approve and publish immediately</label> }
          @if (error()) { <p class="field-error">{{ error() }}</p> }
          <div class="search-actions">
            <button class="btn btn-ghost" type="button" (click)="save('draft')">Save draft</button>
            <button class="btn btn-primary" type="submit">Submit for verification</button>
          </div>
        </form>
      }
    </section>
  `,
})
export class PropertyFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly store = inject(DataStoreService);
  private readonly properties = inject(PropertyService);
  private readonly listings = inject(ListingService);
  private readonly toast = inject(ToastService);
  readonly locations = [...LOCATIONS];
  readonly amenities = AMENITY_OPTIONS;
  readonly facings = FACING_OPTIONS;
  readonly approvals = APPROVAL_OPTIONS;
  readonly furnishes = FURNISH_OPTIONS;
  readonly typeLabel = TYPE_LABEL;
  readonly editingId = signal<string | null>(null);
  readonly selectedImages = signal<string[]>([]);
  readonly selectedAmenities = signal<string[]>([]);
  readonly error = signal('');
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly owners = computed(() => this.state().users.filter((user) => user.role === 'owner'));
  readonly builders = computed(() => this.state().users.filter((user) => user.role === 'builder'));
  readonly projects = computed(() => {
    const user = this.user();
    return this.state().projects.filter((project) => user?.role !== 'builder' || project.builderId === user.id);
  });
  readonly existing = computed(() => this.state().properties.find((property) => property.id === this.editingId()));
  readonly locked = computed(() => {
    const property = this.existing();
    if (!property || this.user()?.role === 'admin') return false;
    return property.status !== 'draft' && property.status !== 'changes_requested';
  });
  readonly types = computed(() => {
    const role = this.user()?.role;
    const base: PropertyType[] = role === 'builder' || role === 'admin' ? ['plot', 'house', 'villa', 'apartment'] : ['plot', 'house'];
    return base;
  });
  readonly form = this.fb.nonNullable.group({
    type: ['plot' as PropertyType, Validators.required],
    title: ['', Validators.required],
    location: [LOCATIONS[0] as string, Validators.required],
    address: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(20)]],
    price: [2500000, [Validators.required, Validators.min(1)]],
    ownerId: [''],
    builderId: [''],
    projectId: [''],
    source: ['owner' as 'owner' | 'builder' | 'admin'],
    plotSizeSqYd: [200],
    roadWidthFt: [30],
    facing: ['east' as Facing],
    approvalType: ['dtcp' as ApprovalType],
    cornerPlot: [false],
    gatedCommunity: [false],
    bhk: [3],
    builtUpSqFt: [1400],
    plotAreaSqYd: [150],
    propertyAgeYears: [5],
    parking: [1],
    furnished: ['semi_furnished' as Furnish],
    publishNow: [false],
  });
  readonly typeValue = toSignal(this.form.controls.type.valueChanges, { initialValue: this.form.controls.type.value });
  readonly isPlot = computed(() => (this.typeValue() ?? 'plot') === 'plot');
  readonly imageChoices = computed(() => poolFor(this.typeValue() ?? 'plot'));

  constructor() {
    inject(Title).setTitle('Property form | ManaNelloreRealEstate');
    const projectId = this.route.snapshot.queryParamMap.get('projectId');
    if (projectId) this.form.controls.projectId.setValue(projectId);
    if (!this.selectedImages().length) this.selectedImages.set(poolFor('plot').slice(0, 3));
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      this.editingId.set(id);
      if (!id) return;
      const property = this.store.snapshot.properties.find((item) => item.id === id);
      if (!property) return;
      this.form.patchValue({
        type: property.type,
        title: property.title,
        location: property.location,
        address: property.address,
        description: property.description,
        price: property.askingPrice,
        ownerId: property.ownerId ?? '',
        builderId: property.builderId ?? '',
        projectId: property.projectId ?? '',
        plotSizeSqYd: property.plotSizeSqYd ?? 0,
        roadWidthFt: property.roadWidthFt ?? 0,
        facing: property.facing ?? 'east',
        approvalType: property.approvalType ?? 'not_specified',
        cornerPlot: !!property.cornerPlot,
        gatedCommunity: !!property.gatedCommunity,
        bhk: property.bhk ?? 0,
        builtUpSqFt: property.builtUpSqFt ?? 0,
        plotAreaSqYd: property.plotAreaSqYd ?? 0,
        propertyAgeYears: property.propertyAgeYears ?? 0,
        parking: property.parking ?? 0,
        furnished: property.furnished ?? 'unfurnished',
      });
      this.selectedImages.set(property.images);
      this.selectedAmenities.set(property.amenities);
    });
  }

  priceHint(): string {
    return formatInr(this.form.controls.price.value);
  }

  onType(event: Event): void {
    const type = (event.target as HTMLSelectElement).value as PropertyType;
    this.form.controls.type.setValue(type);
    this.selectedImages.set(poolFor(type).slice(0, 3));
  }

  toggleImage(url: string): void {
    this.selectedImages.update((list) => (list.includes(url) ? list.filter((item) => item !== url) : [...list, url].slice(0, 4)));
  }

  toggleAmenity(amenity: string): void {
    this.selectedAmenities.update((list) => (list.includes(amenity) ? list.filter((item) => item !== amenity) : [...list, amenity]));
  }

  save(status: 'draft' | 'submitted'): void {
    const user = this.user();
    if (!user) return;
    this.form.markAllAsTouched();
    const raw = this.form.getRawValue();
    if (!raw.title.trim() || !raw.address.trim() || raw.description.trim().length < 20 || raw.price <= 0) {
      this.error.set('Add a title, address, price and a description of at least 20 characters.');
      return;
    }
    if (!this.selectedImages().length) {
      this.error.set('Choose at least one sample image.');
      return;
    }
    if (user.role === 'associate' && !raw.ownerId) {
      this.error.set('Choose the owner this property belongs to.');
      return;
    }
    if ((raw.type === 'plot' && raw.plotSizeSqYd <= 0) || (raw.type !== 'plot' && (raw.bhk <= 0 || raw.builtUpSqFt <= 0))) {
      this.error.set(raw.type === 'plot' ? 'Enter the plot size.' : 'Enter BHK and built-up area.');
      return;
    }
    const input: PropertyInput = {
      type: raw.type,
      title: raw.title.trim(),
      location: raw.location,
      address: raw.address.trim(),
      description: raw.description.trim(),
      images: this.selectedImages(),
      amenities: this.selectedAmenities(),
      askingPrice: Number(raw.price),
      status,
      facing: raw.facing,
      gatedCommunity: raw.gatedCommunity,
      ownerId: user.role === 'owner' ? user.id : raw.ownerId || undefined,
      builderId: user.role === 'builder' ? user.id : raw.builderId || undefined,
      projectId: raw.projectId || undefined,
    };
    if (raw.type === 'plot') {
      input.plotSizeSqYd = Number(raw.plotSizeSqYd);
      input.roadWidthFt = Number(raw.roadWidthFt);
      input.cornerPlot = raw.cornerPlot;
      input.approvalType = raw.approvalType;
    } else {
      input.bhk = Number(raw.bhk);
      input.builtUpSqFt = Number(raw.builtUpSqFt);
      input.plotAreaSqYd = Number(raw.plotAreaSqYd);
      input.propertyAgeYears = Number(raw.propertyAgeYears);
      input.parking = Number(raw.parking);
      input.furnished = raw.furnished;
    }
    if (user.role === 'admin' && raw.source === 'admin') {
      input.ownerId = undefined;
      input.builderId = undefined;
    }
    const id = this.editingId();
    const savedId = id ?? this.properties.create(input, user).id;
    if (id) this.properties.update(id, input);
    if (user.role === 'admin' && raw.publishNow && status === 'submitted') this.listings.publish(savedId, user);
    this.error.set('');
    this.toast.show(status === 'draft' ? 'Draft saved in this browser.' : 'Submitted for verification. Admin can approve it.');
    void this.router.navigateByUrl(this.backLink());
  }

  private backLink(): string {
    const role = this.user()?.role;
    if (role === 'associate') return '/associate/properties';
    if (role === 'builder') return '/builder/units';
    if (role === 'admin') return '/admin/properties';
    return '/owner/properties';
  }
}

@Component({
  selector: 'app-project-form-page',
  imports: [ReactiveFormsModule, RouterLink, ImgFallbackDirective],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Project</p><h1>Create project</h1></div><a class="btn btn-ghost" routerLink="..">Back</a></div>
      <form class="panel" [formGroup]="form" (ngSubmit)="save()">
        <div class="form-grid">
          <div class="field"><label for="name">Project name</label><input id="name" formControlName="name" /></div>
          <div class="field"><label for="developer">Developer / builder name</label><input id="developer" formControlName="developerName" /></div>
          <div class="field"><label for="location">Location</label><select id="location" formControlName="location">@for (location of locations; track location) { <option [value]="location">{{ location }}</option> }</select></div>
          <div class="field"><label for="status">Status</label><select id="status" formControlName="status">@for (status of statuses; track status) { <option [value]="status">{{ statusLabel[status] }}</option> }</select></div>
          @if (user()?.role === 'admin') {
            <div class="field span-2"><label for="builder">Builder account</label><select id="builder" formControlName="builderId">@for (builder of builders(); track builder.id) { <option [value]="builder.id">{{ builder.name }} · {{ builder.company }}</option> }</select></div>
          }
          <div class="field"><label for="total">Total units</label><input id="total" type="number" formControlName="totalUnits" /></div>
          <div class="field"><label for="available">Available units</label><input id="available" type="number" formControlName="availableUnits" /></div>
          <div class="field"><label for="sold">Sold units</label><input id="sold" type="number" formControlName="soldUnits" /></div>
          <div class="field span-2"><label for="description">Description</label><textarea id="description" formControlName="description"></textarea></div>
        </div>
        <h3>Amenities</h3>
        <div class="chips">
          @for (amenity of amenities; track amenity) {
            <label class="check-row"><input type="checkbox" [checked]="picked().includes(amenity)" (change)="toggle(amenity)" /> {{ amenity }}</label>
          }
        </div>
        <h3>Project images</h3>
        <div class="image-picks">
          @for (image of images; track image) {
            <button type="button" [class.on]="photos().includes(image)" (click)="togglePhoto(image)"><img appFallback [src]="image" alt="Sample project photo" /></button>
          }
        </div>
        @if (error()) { <p class="field-error">{{ error() }}</p> }
        <button class="btn btn-primary" type="submit">Create project</button>
      </form>
    </section>
  `,
})
export class ProjectFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly store = inject(DataStoreService);
  private readonly projects = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly locations = [...LOCATIONS];
  readonly amenities = AMENITY_OPTIONS;
  readonly images = poolFor('apartment');
  readonly statuses: ProjectStatus[] = ['upcoming', 'ongoing', 'completed'];
  readonly statusLabel = PROJECT_STATUS_LABEL;
  readonly picked = signal<string[]>(['Security', 'Park']);
  readonly photos = signal<string[]>(poolFor('apartment').slice(0, 3));
  readonly error = signal('');
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly builders = computed(() => this.state().users.filter((user) => user.role === 'builder'));
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    developerName: ['', Validators.required],
    location: [LOCATIONS[0] as string, Validators.required],
    status: ['upcoming' as ProjectStatus, Validators.required],
    builderId: [''],
    totalUnits: [20, Validators.min(1)],
    availableUnits: [10, Validators.min(0)],
    soldUnits: [0, Validators.min(0)],
    description: ['', [Validators.required, Validators.minLength(20)]],
  });

  constructor() {
    inject(Title).setTitle('Create project | ManaNelloreRealEstate');
    const builder = this.builders()[0];
    if (builder) this.form.controls.builderId.setValue(builder.id);
    const user = this.user();
    if (user?.company) this.form.controls.developerName.setValue(user.company);
  }

  toggle(amenity: string): void {
    this.picked.update((list) => (list.includes(amenity) ? list.filter((item) => item !== amenity) : [...list, amenity]));
  }

  togglePhoto(url: string): void {
    this.photos.update((list) => (list.includes(url) ? list.filter((item) => item !== url) : [...list, url].slice(0, 4)));
  }

  save(): void {
    const user = this.user();
    if (!user || this.form.invalid || !this.photos().length) {
      this.error.set('Add the project name, developer, description and at least one image.');
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.projects.create(
      {
        ...raw,
        builderId: user.role === 'builder' ? user.id : raw.builderId,
        images: this.photos(),
        amenities: this.picked(),
      },
      user,
    );
    this.toast.show('Project created. Admin can see it immediately.');
    void this.router.navigateByUrl(user.role === 'admin' ? '/admin/projects' : '/builder/projects');
  }
}

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule],
  template: `
    <section class="dash-page">
      <div class="dash-head"><div><p class="eyebrow">Account</p><h1>Profile</h1></div></div>
      @if (user(); as current) {
        <form class="panel" [formGroup]="form" (ngSubmit)="save()">
          <div class="form-grid">
            <div class="field"><label>Role</label><input [value]="current.role" disabled /></div>
            <div class="field"><label>Email</label><input [value]="current.email" disabled /></div>
            <div class="field"><label for="name">Name</label><input id="name" formControlName="name" /></div>
            <div class="field"><label for="phone">Phone</label><input id="phone" formControlName="phone" /></div>
            <div class="field"><label for="location">Location</label><input id="location" formControlName="location" /></div>
            <div class="field"><label for="company">Company</label><input id="company" formControlName="company" /></div>
            <div class="field span-2"><label for="bio">About</label><textarea id="bio" formControlName="bio"></textarea></div>
          </div>
          <button class="btn btn-primary" type="submit">Save profile</button>
        </form>
      }
    </section>
  `,
})
export class ProfilePage {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly form = this.fb.nonNullable.group({
    name: [this.user()?.name ?? '', Validators.required],
    phone: [this.user()?.phone ?? '', Validators.required],
    location: [this.user()?.location ?? ''],
    company: [this.user()?.company ?? ''],
    bio: [this.user()?.bio ?? ''],
  });

  constructor() {
    inject(Title).setTitle('Profile | ManaNelloreRealEstate');
  }

  save(): void {
    if (this.form.invalid) return;
    this.auth.updateProfile(this.form.getRawValue());
    this.toast.show('Profile updated in this browser.');
  }
}
