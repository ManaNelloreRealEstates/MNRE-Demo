import { APPROVAL_LABEL, FACING_LABEL, FURNISH_LABEL, TYPE_LABEL } from './labels';
import {
  AppState,
  Deal,
  Enquiry,
  Lead,
  Listing,
  Project,
  Property,
  SiteVisit,
  User,
} from './models';

export interface PropertyBundle {
  property: Property;
  listing?: Listing;
  owner?: User;
  builder?: User;
  project?: Project;
  submitter?: User;
  listedBy?: User;
}

export interface LeadRow {
  lead: Lead;
  buyer?: User;
  property?: Property;
  assignee?: User;
  referrer?: User;
}

export interface EnquiryRow {
  enquiry: Enquiry;
  buyer?: User;
  property?: Property;
  lead?: Lead;
}

export interface VisitRow {
  visit: SiteVisit;
  buyer?: User;
  property?: Property;
  associate?: User;
  lead?: Lead;
}

export interface DealRow {
  deal: Deal;
  buyer?: User;
  property?: Property;
  owner?: User;
  builder?: User;
  associate?: User;
}

export function userById(state: AppState, id?: string): User | undefined {
  if (!id) return undefined;
  return state.users.find((user) => user.id === id);
}

export function bundleProperty(state: AppState, property: Property): PropertyBundle {
  const listing = [...state.listings]
    .filter((item) => item.propertyId === property.id)
    .sort((a, b) => (a.status === 'active' ? -1 : 1) - (b.status === 'active' ? -1 : 1))[0];
  return {
    property,
    listing,
    owner: userById(state, property.ownerId),
    builder: userById(state, property.builderId),
    project: state.projects.find((project) => project.id === property.projectId),
    submitter: userById(state, property.submittedById),
    listedBy: listing ? userById(state, listing.listedById) : undefined,
  };
}

export function bundleListing(state: AppState, listing: Listing): PropertyBundle | null {
  const property = state.properties.find((item) => item.id === listing.propertyId);
  if (!property) return null;
  return {
    property,
    listing,
    owner: userById(state, property.ownerId),
    builder: userById(state, property.builderId),
    project: state.projects.find((project) => project.id === property.projectId),
    submitter: userById(state, property.submittedById),
    listedBy: userById(state, listing.listedById),
  };
}

export function activeBundles(state: AppState): PropertyBundle[] {
  return state.listings
    .filter((listing) => listing.status === 'active')
    .map((listing) => bundleListing(state, listing))
    .filter((bundle): bundle is PropertyBundle => !!bundle);
}

export function areaLabel(property: Property): string {
  if (property.type === 'plot' || property.type === 'agricultural') {
    return property.plotSizeSqYd ? `${property.plotSizeSqYd} Sq Yards` : 'Size on request';
  }
  if (property.builtUpSqFt) return `${property.builtUpSqFt.toLocaleString('en-IN')} sq ft`;
  return 'Area on request';
}

export function chips(property: Property): string[] {
  const items: string[] = [];
  if (property.type === 'plot' || property.type === 'agricultural') {
    if (property.plotSizeSqYd) items.push(`${property.plotSizeSqYd} Sq Yards`);
    if (property.facing) items.push(FACING_LABEL[property.facing]);
    if (property.roadWidthFt) items.push(`${property.roadWidthFt} ft road`);
    if (property.approvalType) items.push(APPROVAL_LABEL[property.approvalType]);
    if (property.cornerPlot) items.push('Corner plot');
    if (property.gatedCommunity) items.push('Gated community');
  } else {
    if (property.bhk) items.push(`${property.bhk} BHK`);
    if (property.builtUpSqFt) items.push(`${property.builtUpSqFt.toLocaleString('en-IN')} sq ft`);
    if (property.facing) items.push(FACING_LABEL[property.facing]);
    if (property.furnished) items.push(FURNISH_LABEL[property.furnished]);
    if (property.parking) items.push(`${property.parking} parking`);
    if (property.gatedCommunity) items.push('Gated community');
  }
  return items.slice(0, 4);
}

export function typeLabel(property: Property): string {
  return TYPE_LABEL[property.type];
}

export function leadRows(state: AppState, leads: Lead[]): LeadRow[] {
  return leads.map((lead) => ({
    lead,
    buyer: userById(state, lead.buyerId),
    property: state.properties.find((property) => property.id === lead.propertyId),
    assignee: userById(state, lead.assignedToId),
    referrer: userById(state, lead.referredById),
  }));
}

export function enquiryRows(state: AppState, enquiries: Enquiry[]): EnquiryRow[] {
  return enquiries.map((enquiry) => ({
    enquiry,
    buyer: userById(state, enquiry.buyerId),
    property: state.properties.find((property) => property.id === enquiry.propertyId),
    lead: state.leads.find((lead) => lead.id === enquiry.leadId),
  }));
}

export function visitRows(state: AppState, visits: SiteVisit[]): VisitRow[] {
  return visits.map((visit) => ({
    visit,
    buyer: userById(state, visit.buyerId),
    property: state.properties.find((property) => property.id === visit.propertyId),
    associate: userById(state, visit.associateId),
    lead: state.leads.find((lead) => lead.id === visit.leadId),
  }));
}

export function dealRows(state: AppState, deals: Deal[]): DealRow[] {
  return deals.map((deal) => ({
    deal,
    buyer: userById(state, deal.buyerId),
    property: state.properties.find((property) => property.id === deal.propertyId),
    owner: userById(state, deal.ownerId),
    builder: userById(state, deal.builderId),
    associate: userById(state, deal.associateId),
  }));
}

export function canViewProperty(state: AppState, property: Property, user: User | null): boolean {
  if (property.status === 'listed') return true;
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (property.ownerId === user.id || property.builderId === user.id || property.submittedById === user.id) {
    return true;
  }
  const listing = state.listings.find((item) => item.propertyId === property.id && item.listedById === user.id);
  return !!listing;
}

export interface Kpis {
  totalProperties: number;
  activeListings: number;
  newLeads: number;
  pendingApprovals: number;
  todaysVisits: number;
  activeBuyers: number;
  owners: number;
  associates: number;
  builders: number;
  deals: number;
}

export function buildKpis(state: AppState, today: string): Kpis {
  return {
    totalProperties: state.properties.length,
    activeListings: state.listings.filter((listing) => listing.status === 'active').length,
    newLeads: state.leads.filter((lead) => lead.status === 'new').length,
    pendingApprovals: state.properties.filter((property) =>
      ['submitted', 'under_verification', 'changes_requested', 'approved'].includes(property.status),
    ).length,
    todaysVisits: state.siteVisits.filter(
      (visit) => visit.date === today && !['cancelled', 'no_show'].includes(visit.status),
    ).length,
    activeBuyers: state.users.filter((user) => user.role === 'buyer' && user.active).length,
    owners: state.users.filter((user) => user.role === 'owner').length,
    associates: state.users.filter((user) => user.role === 'associate').length,
    builders: state.users.filter((user) => user.role === 'builder').length,
    deals: state.deals.filter((deal) => deal.status !== 'cancelled').length,
  };
}
