import { Component, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { formatInr } from '../core/format';
import { APPROVAL_OPTIONS, FACING_OPTIONS, FURNISH_OPTIONS, LOCATIONS } from '../core/labels';
import { SearchKind } from '../core/models';
import { criteriaToParams, emptyCriteria, parseCriteria } from '../core/search';

@Component({
  selector: 'app-search-panel',
  imports: [ReactiveFormsModule],
  template: `
    <form class="search-card" [formGroup]="form" (ngSubmit)="search()">
      @if (layout() === 'hero') {
        <p class="eyebrow">Search Nellore</p>
        <h2>What are you looking for?</h2>
      } @else {
        <h3>Filters</h3>
      }
      <div class="type-toggle">
        <button type="button" [class.active]="kind() === 'plot'" (click)="setKind('plot')"><strong>Plot</strong><span>Land and layouts</span></button>
        <button type="button" [class.active]="kind() === 'house'" (click)="setKind('house')"><strong>House</strong><span>Independent houses</span></button>
        <button type="button" [class.active]="kind() === 'both'" (click)="setKind('both')"><strong>Both</strong><span>Plots and houses</span></button>
      </div>
      <div class="form-grid">
        <div class="field">
          <label for="location">Location</label>
          <select id="location" formControlName="location">
            <option value="">All Nellore areas</option>
            @for (location of locations; track location) {
              <option [value]="location">{{ location }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="q">Keyword</label>
          <input id="q" formControlName="q" placeholder="Layout, facing, road" />
        </div>
        <div class="field">
          <label for="minPrice">Minimum price (₹)</label>
          <input id="minPrice" type="number" min="0" formControlName="minPrice" placeholder="2000000" />
          @if (moneyHint(form.controls.minPrice.value); as hint) { <span class="muted">{{ hint }}</span> }
        </div>
        <div class="field">
          <label for="maxPrice">Maximum price (₹)</label>
          <input id="maxPrice" type="number" min="0" formControlName="maxPrice" placeholder="8000000" />
          @if (moneyHint(form.controls.maxPrice.value); as hint) { <span class="muted">{{ hint }}</span> }
        </div>
        <div class="field">
          <label for="facing">Facing</label>
          <select id="facing" formControlName="facing">
            <option value="">Any facing</option>
            @for (option of facings; track option[0]) {
              <option [value]="option[0]">{{ option[1] }}</option>
            }
          </select>
        </div>
        <label class="check-row"><input type="checkbox" formControlName="gated" /> Gated community</label>

        @if (kind() === 'plot' || kind() === 'both') {
          <p class="group-label">Plot filters</p>
          <div class="field">
            <label for="minPlot">Minimum plot size (sq yards)</label>
            <input id="minPlot" type="number" min="0" formControlName="minPlot" />
          </div>
          <div class="field">
            <label for="maxPlot">Maximum plot size (sq yards)</label>
            <input id="maxPlot" type="number" min="0" formControlName="maxPlot" />
          </div>
          <div class="field">
            <label for="minRoad">Road width (ft, minimum)</label>
            <input id="minRoad" type="number" min="0" formControlName="minRoad" />
          </div>
          <div class="field">
            <label for="approval">Approval type</label>
            <select id="approval" formControlName="approval">
              <option value="">Any approval</option>
              @for (option of approvals; track option[0]) {
                <option [value]="option[0]">{{ option[1] }}</option>
              }
            </select>
          </div>
          <label class="check-row"><input type="checkbox" formControlName="corner" /> Corner plot</label>
        }

        @if (kind() === 'house' || kind() === 'both') {
          <p class="group-label">House filters</p>
          <div class="field">
            <label for="bhk">BHK</label>
            <select id="bhk" formControlName="bhk">
              <option value="">Any</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
              <option value="5">5+ BHK</option>
            </select>
          </div>
          <div class="field">
            <label for="minBuilt">Minimum built-up (sq ft)</label>
            <input id="minBuilt" type="number" min="0" formControlName="minBuilt" />
          </div>
          <div class="field">
            <label for="maxBuilt">Maximum built-up (sq ft)</label>
            <input id="maxBuilt" type="number" min="0" formControlName="maxBuilt" />
          </div>
          <div class="field">
            <label for="maxAge">Maximum property age (years)</label>
            <input id="maxAge" type="number" min="0" formControlName="maxAge" />
          </div>
          <div class="field">
            <label for="furnished">Furnished</label>
            <select id="furnished" formControlName="furnished">
              <option value="">Any</option>
              @for (option of furnishes; track option[0]) {
                <option [value]="option[0]">{{ option[1] }}</option>
              }
            </select>
          </div>
          <label class="check-row"><input type="checkbox" formControlName="parking" /> Parking available</label>
        }
      </div>
      @if (error()) { <p class="field-error">{{ error() }}</p> }
      <div class="search-actions">
        <button class="btn btn-primary" type="submit">Search</button>
        <button class="btn btn-ghost" type="button" (click)="reset()">Clear</button>
      </div>
    </form>
  `,
})
export class SearchPanel {
  readonly layout = input<'hero' | 'sidebar'>('sidebar');
  readonly searched = output<void>();
  readonly locations = LOCATIONS;
  readonly facings = FACING_OPTIONS;
  readonly approvals = APPROVAL_OPTIONS;
  readonly furnishes = FURNISH_OPTIONS;
  readonly error = signal('');
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    kind: ['both' as SearchKind],
    location: [''],
    q: [''],
    minPrice: [''],
    maxPrice: [''],
    facing: [''],
    gated: [false],
    minPlot: [''],
    maxPlot: [''],
    minRoad: [''],
    approval: [''],
    corner: [false],
    bhk: [''],
    minBuilt: [''],
    maxBuilt: [''],
    maxAge: [''],
    furnished: [''],
    parking: [false],
  });

  readonly kind = computed(() => this.kindSignal());
  private readonly kindSignal = signal<SearchKind>(this.form.controls.kind.value);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const criteria = parseCriteria((key) => params.get(key));
      this.form.patchValue(
        {
          kind: criteria.kind,
          location: criteria.location,
          q: criteria.q,
          minPrice: criteria.minPrice?.toString() ?? '',
          maxPrice: criteria.maxPrice?.toString() ?? '',
          facing: criteria.facing,
          gated: criteria.gated,
          minPlot: criteria.minPlot?.toString() ?? '',
          maxPlot: criteria.maxPlot?.toString() ?? '',
          minRoad: criteria.minRoad?.toString() ?? '',
          approval: criteria.approval,
          corner: criteria.corner,
          bhk: criteria.bhk?.toString() ?? '',
          minBuilt: criteria.minBuilt?.toString() ?? '',
          maxBuilt: criteria.maxBuilt?.toString() ?? '',
          maxAge: criteria.maxAge?.toString() ?? '',
          furnished: criteria.furnished,
          parking: criteria.parking,
        },
        { emitEvent: false },
      );
      this.kindSignal.set(criteria.kind);
    });
  }

  setKind(kind: SearchKind): void {
    this.form.controls.kind.setValue(kind);
    this.kindSignal.set(kind);
  }

  moneyHint(value: string): string {
    const amount = Number(value);
    return value && Number.isFinite(amount) && amount > 0 ? formatInr(amount) : '';
  }

  search(): void {
    const raw = this.form.getRawValue();
    const criteria = emptyCriteria(raw.kind);
    criteria.location = raw.location;
    criteria.q = raw.q.trim();
    criteria.minPrice = numberOrNull(raw.minPrice);
    criteria.maxPrice = numberOrNull(raw.maxPrice);
    criteria.facing = raw.facing;
    criteria.gated = raw.gated;
    criteria.sort = parseCriteria((key) => this.route.snapshot.queryParamMap.get(key)).sort;
    if (raw.kind === 'plot' || raw.kind === 'both') {
      criteria.minPlot = numberOrNull(raw.minPlot);
      criteria.maxPlot = numberOrNull(raw.maxPlot);
      criteria.minRoad = numberOrNull(raw.minRoad);
      criteria.approval = raw.approval;
      criteria.corner = raw.corner;
    }
    if (raw.kind === 'house' || raw.kind === 'both') {
      criteria.bhk = numberOrNull(raw.bhk);
      criteria.minBuilt = numberOrNull(raw.minBuilt);
      criteria.maxBuilt = numberOrNull(raw.maxBuilt);
      criteria.maxAge = numberOrNull(raw.maxAge);
      criteria.furnished = raw.furnished;
      criteria.parking = raw.parking;
    }
    if (criteria.minPrice != null && criteria.maxPrice != null && criteria.minPrice > criteria.maxPrice) {
      this.error.set('Minimum price cannot be higher than maximum price.');
      return;
    }
    if (criteria.minPlot != null && criteria.maxPlot != null && criteria.minPlot > criteria.maxPlot) {
      this.error.set('Minimum plot size cannot be higher than maximum plot size.');
      return;
    }
    this.error.set('');
    void this.router.navigate(['/buy'], { queryParams: criteriaToParams(criteria) });
    this.searched.emit();
  }

  reset(): void {
    this.form.reset({ kind: 'both', location: '', q: '', minPrice: '', maxPrice: '', facing: '', gated: false, minPlot: '', maxPlot: '', minRoad: '', approval: '', corner: false, bhk: '', minBuilt: '', maxBuilt: '', maxAge: '', furnished: '', parking: false });
    this.kindSignal.set('both');
    this.error.set('');
    void this.router.navigate(['/buy'], { queryParams: { kind: 'both' } });
    this.searched.emit();
  }
}

function numberOrNull(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
