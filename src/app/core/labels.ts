import {
  ApprovalType,
  DealStatus,
  Facing,
  Furnish,
  LeadSource,
  LeadStatus,
  ListingStatus,
  ProjectStatus,
  PropertyStatus,
  PropertyType,
  UserRole,
  VisitStatus,
} from './models';

export const LOCATIONS = [
  'Magunta Layout',
  'Balaji Nagar',
  'Dargamitta',
  'Vedayapalem',
  'Ramalingapuram',
  'Stonehousepet',
  'Pogathota',
  'Kavali',
  'Gudur',
  'Nellore Rural',
] as const;

export const AMENITY_OPTIONS = [
  'Compound wall',
  'Borewell',
  'Street lights',
  'Drainage',
  'Park',
  'Security',
  'Clubhouse',
  'Power backup',
  'Lift',
  'Visitor parking',
  'Water supply',
  'Main road access',
  'Temple nearby',
  'School nearby',
];

export const ROLE_LABEL: Record<UserRole, string> = {
  buyer: 'Buyer',
  owner: 'Owner',
  associate: 'Associate',
  builder: 'Builder',
  admin: 'Admin',
};

export const TYPE_LABEL: Record<PropertyType, string> = {
  plot: 'Plot',
  house: 'House',
  apartment: 'Apartment',
  villa: 'Villa',
  commercial: 'Commercial',
  agricultural: 'Agricultural land',
};

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_verification: 'Under verification',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  rejected: 'Rejected',
  listed: 'Listed',
};

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  sold: 'Sold',
  expired: 'Expired',
};

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  site_visit_scheduled: 'Site visit scheduled',
  site_visit_completed: 'Site visit completed',
  negotiation: 'Negotiation',
  converted: 'Converted',
  lost: 'Lost',
};

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_LABEL) as LeadStatus[];

export const SOURCE_LABEL: Record<LeadSource, string> = {
  website: 'Website',
  associate: 'Associate',
  phone: 'Phone',
  walk_in: 'Walk-in',
  builder: 'Builder',
};

export const VISIT_STATUS_LABEL: Record<VisitStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  rescheduled: 'Rescheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

export const VISIT_STATUSES = Object.keys(VISIT_STATUS_LABEL) as VisitStatus[];

export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  negotiation: 'Negotiation',
  booking: 'Booking',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const DEAL_STATUSES = Object.keys(DEAL_STATUS_LABEL) as DealStatus[];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

export const FACING_LABEL: Record<Facing, string> = {
  east: 'East facing',
  west: 'West facing',
  north: 'North facing',
  south: 'South facing',
  north_east: 'North-east facing',
  north_west: 'North-west facing',
  south_east: 'South-east facing',
  south_west: 'South-west facing',
};

export const FACING_OPTIONS = Object.entries(FACING_LABEL) as [Facing, string][];

export const APPROVAL_LABEL: Record<ApprovalType, string> = {
  dtcp: 'DTCP approved',
  rera: 'RERA',
  other: 'Other',
  not_specified: 'Not specified',
};

export const APPROVAL_OPTIONS = Object.entries(APPROVAL_LABEL) as [ApprovalType, string][];

export const FURNISH_LABEL: Record<Furnish, string> = {
  furnished: 'Furnished',
  semi_furnished: 'Semi furnished',
  unfurnished: 'Unfurnished',
};

export const FURNISH_OPTIONS = Object.entries(FURNISH_LABEL) as [Furnish, string][];

export const PIPELINE: PropertyStatus[] = [
  'draft',
  'submitted',
  'under_verification',
  'approved',
  'listed',
];

export function homeFor(role: UserRole): string {
  return `/${role}/dashboard`;
}
