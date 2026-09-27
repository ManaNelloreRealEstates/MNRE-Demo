import { Facing, Furnish, Property, SearchKind } from './models';
import { PropertyBundle } from './views';

export interface SearchCriteria {
  kind: SearchKind;
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
  minPlot: number | null;
  maxPlot: number | null;
  facing: string;
  minRoad: number | null;
  corner: boolean;
  gated: boolean;
  approval: string;
  bhk: number | null;
  minBuilt: number | null;
  maxBuilt: number | null;
  maxAge: number | null;
  parking: boolean;
  furnished: string;
  q: string;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'area';
}

export function emptyCriteria(kind: SearchKind = 'both'): SearchCriteria {
  return {
    kind,
    location: '',
    minPrice: null,
    maxPrice: null,
    minPlot: null,
    maxPlot: null,
    facing: '',
    minRoad: null,
    corner: false,
    gated: false,
    approval: '',
    bhk: null,
    minBuilt: null,
    maxBuilt: null,
    maxAge: null,
    parking: false,
    furnished: '',
    q: '',
    sort: 'newest',
  };
}

export function parseCriteria(get: (key: string) => string | null): SearchCriteria {
  const kindValue = get('kind');
  const kind: SearchKind = kindValue === 'plot' || kindValue === 'house' || kindValue === 'both' ? kindValue : 'both';
  const sortValue = get('sort');
  const sort =
    sortValue === 'price_asc' || sortValue === 'price_desc' || sortValue === 'area' || sortValue === 'newest'
      ? sortValue
      : 'newest';
  return {
    kind,
    location: get('location') ?? '',
    minPrice: num(get('minPrice')),
    maxPrice: num(get('maxPrice')),
    minPlot: num(get('minPlot')),
    maxPlot: num(get('maxPlot')),
    facing: get('facing') ?? '',
    minRoad: num(get('minRoad')),
    corner: get('corner') === '1',
    gated: get('gated') === '1',
    approval: get('approval') ?? '',
    bhk: num(get('bhk')),
    minBuilt: num(get('minBuilt')),
    maxBuilt: num(get('maxBuilt')),
    maxAge: num(get('maxAge')),
    parking: get('parking') === '1',
    furnished: get('furnished') ?? '',
    q: get('q') ?? '',
    sort,
  };
}

export function criteriaToParams(criteria: SearchCriteria): Record<string, string> {
  const params: Record<string, string> = { kind: criteria.kind };
  const set = (key: string, value: string | number | null | boolean) => {
    if (value === null || value === '' || value === false) return;
    params[key] = String(value === true ? '1' : value);
  };
  set('location', criteria.location);
  set('minPrice', criteria.minPrice);
  set('maxPrice', criteria.maxPrice);
  set('minPlot', criteria.minPlot);
  set('maxPlot', criteria.maxPlot);
  set('facing', criteria.facing);
  set('minRoad', criteria.minRoad);
  set('corner', criteria.corner);
  set('gated', criteria.gated);
  set('approval', criteria.approval);
  set('bhk', criteria.bhk);
  set('minBuilt', criteria.minBuilt);
  set('maxBuilt', criteria.maxBuilt);
  set('maxAge', criteria.maxAge);
  set('parking', criteria.parking);
  set('furnished', criteria.furnished);
  set('q', criteria.q);
  if (criteria.sort !== 'newest') params['sort'] = criteria.sort;
  return params;
}

export function matchesCriteria(bundle: PropertyBundle, criteria: SearchCriteria): boolean {
  const property = bundle.property;
  const price = bundle.listing?.price ?? property.askingPrice;
  if (criteria.kind === 'plot' && property.type !== 'plot') return false;
  if (criteria.kind === 'house' && property.type !== 'house') return false;
  if (criteria.kind === 'both' && property.type !== 'plot' && property.type !== 'house') return false;
  if (criteria.location && property.location !== criteria.location) return false;
  if (criteria.minPrice != null && price < criteria.minPrice) return false;
  if (criteria.maxPrice != null && price > criteria.maxPrice) return false;
  if (criteria.facing && property.facing !== criteria.facing) return false;
  if (criteria.gated && !property.gatedCommunity) return false;
  if (criteria.q) {
    const haystack = `${property.title} ${property.location} ${property.address} ${property.description}`.toLowerCase();
    if (!haystack.includes(criteria.q.toLowerCase())) return false;
  }
  if ((criteria.kind === 'plot' || criteria.kind === 'both') && property.type === 'plot') {
    if (criteria.minPlot != null && (property.plotSizeSqYd ?? 0) < criteria.minPlot) return false;
    if (criteria.maxPlot != null && (property.plotSizeSqYd ?? 0) > criteria.maxPlot) return false;
    if (criteria.minRoad != null && (property.roadWidthFt ?? 0) < criteria.minRoad) return false;
    if (criteria.corner && !property.cornerPlot) return false;
    if (criteria.approval && property.approvalType !== criteria.approval) return false;
  }
  if ((criteria.kind === 'house' || criteria.kind === 'both') && property.type === 'house') {
    if (criteria.bhk != null && !matchesBhk(property, criteria.bhk)) return false;
    if (criteria.minBuilt != null && (property.builtUpSqFt ?? 0) < criteria.minBuilt) return false;
    if (criteria.maxBuilt != null && (property.builtUpSqFt ?? 0) > criteria.maxBuilt) return false;
    if (criteria.maxAge != null && (property.propertyAgeYears ?? 0) > criteria.maxAge) return false;
    if (criteria.parking && !(property.parking && property.parking > 0)) return false;
    if (criteria.furnished && property.furnished !== (criteria.furnished as Furnish)) return false;
  }
  return true;
}

function matchesBhk(property: Property, bhk: number): boolean {
  if (bhk >= 5) return (property.bhk ?? 0) >= 5;
  return property.bhk === bhk;
}

export function sortBundles(items: PropertyBundle[], sort: SearchCriteria['sort']): PropertyBundle[] {
  const copy = [...items];
  copy.sort((a, b) => {
    const priceA = a.listing?.price ?? a.property.askingPrice;
    const priceB = b.listing?.price ?? b.property.askingPrice;
    if (sort === 'price_asc') return priceA - priceB;
    if (sort === 'price_desc') return priceB - priceA;
    if (sort === 'area') return areaOf(b.property) - areaOf(a.property);
    return (b.listing?.createdAt ?? '').localeCompare(a.listing?.createdAt ?? '');
  });
  return copy;
}

function areaOf(property: Property): number {
  if (property.type === 'plot' || property.type === 'agricultural') return property.plotSizeSqYd ?? 0;
  return property.builtUpSqFt ?? 0;
}

function num(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isFacing(value: string): value is Facing {
  return [
    'east',
    'west',
    'north',
    'south',
    'north_east',
    'north_west',
    'south_east',
    'south_west',
  ].includes(value);
}
