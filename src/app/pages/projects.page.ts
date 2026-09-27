import { Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataStoreService } from '../core/data-store.service';
import { AuthService } from '../core/auth.service';
import { PROJECT_STATUS_LABEL } from '../core/labels';
import { bundleProperty } from '../core/views';
import { CatalogActions } from '../shared/catalog-actions';
import { Gallery } from '../shared/gallery';
import { PropertyCard } from '../shared/property-card';
import { ImgFallbackDirective } from '../shared/ui';
import { signal } from '@angular/core';

@Component({
  selector: 'app-projects-page',
  imports: [RouterLink, ImgFallbackDirective],
  template: `
    <section class="page">
      <div class="container">
        <div class="page-head">
          <div>
            <p class="eyebrow">Developers</p>
            <h1>Projects</h1>
            <p class="muted">Sample communities from Nellore builders. Units inside a project are separate properties.</p>
          </div>
        </div>
        <div class="card-grid">
          @for (project of projects(); track project.id) {
            <a class="project-card" [routerLink]="['/project', project.id]" style="text-decoration:none;overflow:hidden">
              <img appFallback [src]="project.images[0]" [alt]="project.name" style="height:180px;width:100%;object-fit:cover" />
              <div class="card-body">
                <span class="pill" [attr.data-status]="project.status">{{ statusLabel[project.status] }}</span>
                <h3>{{ project.name }}</h3>
                <p class="muted">{{ project.location }}, {{ project.city }} · {{ project.developerName }}</p>
                <p>{{ project.availableUnits }} available · {{ project.soldUnits }} sold · {{ project.totalUnits }} total</p>
              </div>
            </a>
          }
        </div>
      </div>
    </section>
  `,
})
export class ProjectsPage {
  private readonly store = inject(DataStoreService);
  readonly statusLabel = PROJECT_STATUS_LABEL;
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  readonly projects = computed(() => this.state().projects);

  constructor() {
    inject(Title).setTitle('Projects | ManaNelloreRealEstate');
  }
}

@Component({
  selector: 'app-project-detail-page',
  imports: [Gallery, PropertyCard, RouterLink],
  template: `
    <section class="page">
      <div class="container">
        @if (!project()) {
          <div class="empty"><h1>Project not found</h1><a class="btn btn-dark" routerLink="/projects">All projects</a></div>
        } @else if (project(); as item) {
          <app-gallery [images]="item.images" [alt]="item.name" />
          <div class="page-head" style="margin-top:16px">
            <div>
              <p class="eyebrow">{{ item.developerName }}</p>
              <h1>{{ item.name }}</h1>
              <p>{{ item.location }}, {{ item.city }}</p>
            </div>
            <span class="pill" [attr.data-status]="item.status">{{ statusLabel[item.status] }}</span>
          </div>
          <p>{{ item.description }}</p>
          <div class="stat-grid">
            <article class="stat"><strong>{{ item.totalUnits }}</strong><span>Total units</span></article>
            <article class="stat"><strong>{{ item.availableUnits }}</strong><span>Available</span></article>
            <article class="stat"><strong>{{ item.soldUnits }}</strong><span>Sold</span></article>
            <article class="stat"><strong>{{ units().length }}</strong><span>On this demo</span></article>
          </div>
          <h2 style="margin:22px 0 12px">Amenities</h2>
          <div class="chips">@for (amenity of item.amenities; track amenity) { <span>{{ amenity }}</span> }</div>
          <h2 style="margin:22px 0 12px">Units</h2>
          @if (!units().length) {
            <div class="empty">No units are public for this project yet.</div>
          } @else {
            <div class="card-grid">
              @for (unit of units(); track unit.property.id) {
                <app-property-card [bundle]="unit" [saved]="actions.isSaved(unit.property.id)" (save)="actions.save($event)" (share)="actions.share($event)" />
              }
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class ProjectDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private readonly auth = inject(AuthService);
  readonly actions = inject(CatalogActions);
  readonly statusLabel = PROJECT_STATUS_LABEL;
  readonly id = signal('');
  private readonly state = toSignal(this.store.state$, { initialValue: this.store.snapshot });
  private readonly user = toSignal(this.auth.currentUser$, { initialValue: this.auth.getCurrentUser() });
  readonly project = computed(() => this.state().projects.find((item) => item.id === this.id()));
  readonly units = computed(() => {
    const project = this.project();
    const user = this.user();
    if (!project) return [];
    return this.state().properties
      .filter((property) => property.projectId === project.id)
      .filter((property) => property.status === 'listed' || user?.role === 'admin' || user?.id === project.builderId)
      .map((property) => bundleProperty(this.state(), property));
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.id.set(params.get('id') ?? '');
      const project = this.store.snapshot.projects.find((item) => item.id === this.id());
      inject(Title).setTitle(project ? `${project.name} | ManaNelloreRealEstate` : 'Project | ManaNelloreRealEstate');
    });
  }
}
