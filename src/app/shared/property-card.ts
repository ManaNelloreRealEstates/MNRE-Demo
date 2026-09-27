import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LISTING_STATUS_LABEL, TYPE_LABEL } from '../core/labels';
import { clip } from '../core/format';
import { areaLabel, chips, PropertyBundle } from '../core/views';
import { ImgFallbackDirective, InrPipe } from './ui';

@Component({
  selector: 'app-property-card',
  imports: [RouterLink, InrPipe, ImgFallbackDirective],
  template: `
    @if (bundle(); as item) {
      <article class="property-card">
        <a class="media" [routerLink]="['/property', item.property.id]">
          <img appFallback [src]="item.property.images[0] || 'placeholder.svg'" [alt]="item.property.title" loading="lazy" />
          <span class="badge">{{ typeLabel[item.property.type] }}</span>
          @if (item.listing?.status === 'sold') {
            <span class="badge sold">Sold</span>
          } @else if (item.listing?.featured) {
            <span class="badge gold">Featured</span>
          }
        </a>
        <div class="card-body">
          <div class="price">{{ (item.listing?.price ?? item.property.askingPrice) | inr }}</div>
          <strong>{{ item.property.title }}</strong>
          <div class="card-meta">
            <span>{{ item.property.location }}, {{ item.property.city }}</span>
            <span>{{ area(item.property) }}</span>
          </div>
          <div class="chips">
            @for (chip of chipList(item.property); track chip) {
              <span>{{ chip }}</span>
            }
          </div>
          <p class="muted">{{ clip(item.property.description) }}</p>
          <div class="card-meta">
            <span>Listed by {{ item.listedBy?.name || item.submitter?.name || 'Platform' }}</span>
            @if (item.listing) {
              <span>{{ listingLabel[item.listing.status] }}</span>
            }
          </div>
          <div class="card-actions">
            @if (showSave()) {
              <button type="button" class="btn btn-ghost btn-sm" (click)="save.emit(item.property.id)">{{ saved() ? 'Saved' : 'Save' }}</button>
            }
            <button type="button" class="btn btn-ghost btn-sm" (click)="share.emit(item.property.id)">Share</button>
            <a class="btn btn-dark btn-sm" [routerLink]="['/property', item.property.id]">View details</a>
          </div>
        </div>
      </article>
    }
  `,
})
export class PropertyCard {
  readonly bundle = input.required<PropertyBundle>();
  readonly saved = input(false);
  readonly showSave = input(true);
  readonly save = output<string>();
  readonly share = output<string>();
  readonly typeLabel = TYPE_LABEL;
  readonly listingLabel = LISTING_STATUS_LABEL;
  readonly area = areaLabel;
  readonly chipList = chips;
  readonly clip = clip;
}
