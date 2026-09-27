export type UserRole = 'buyer' | 'owner' | 'associate' | 'builder' | 'admin';

export type PropertyType =
  | 'plot'
  | 'house'
  | 'apartment'
  | 'villa'
  | 'commercial'
  | 'agricultural';

export type PropertyStatus =
  | 'draft'
  | 'submitted'
  | 'under_verification'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'listed';

export type ApprovalType = 'dtcp' | 'rera' | 'other' | 'not_specified';

export type Facing =
  | 'east'
  | 'west'
  | 'north'
  | 'south'
  | 'north_east'
  | 'north_west'
  | 'south_east'
  | 'south_west';

export type Furnish = 'furnished' | 'semi_furnished' | 'unfurnished';

export type ListingStatus = 'draft' | 'active' | 'paused' | 'sold' | 'expired';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'site_visit_scheduled'
  | 'site_visit_completed'
  | 'negotiation'
  | 'converted'
  | 'lost';

export type LeadSource = 'website' | 'associate' | 'phone' | 'walk_in' | 'builder';

export type VisitStatus =
  | 'requested'
  | 'confirmed'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type DealStatus = 'negotiation' | 'booking' | 'confirmed' | 'completed' | 'cancelled';

export type ProjectStatus = 'upcoming' | 'ongoing' | 'completed';

export type SearchKind = 'plot' | 'house' | 'both';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  password: string;
  company?: string;
  location: string;
  bio?: string;
  active: boolean;
  referredById?: string;
  createdAt: string;
}

export interface Property {
  id: string;
  type: PropertyType;
  title: string;
  location: string;
  city: string;
  address: string;
  description: string;
  images: string[];
  amenities: string[];
  askingPrice: number;
  ownerId?: string;
  builderId?: string;
  projectId?: string;
  submittedById: string;
  submittedByRole: UserRole;
  status: PropertyStatus;
  submittedAt: string;
  updatedAt: string;
  adminNote?: string;
  plotSizeSqYd?: number;
  facing?: Facing;
  roadWidthFt?: number;
  cornerPlot?: boolean;
  gatedCommunity?: boolean;
  approvalType?: ApprovalType;
  bhk?: number;
  builtUpSqFt?: number;
  plotAreaSqYd?: number;
  propertyAgeYears?: number;
  parking?: number;
  furnished?: Furnish;
}

export interface Listing {
  id: string;
  propertyId: string;
  listedById: string;
  listedByRole: UserRole;
  price: number;
  status: ListingStatus;
  featured: boolean;
  createdAt: string;
  views: number;
}

export interface Enquiry {
  id: string;
  buyerId: string;
  propertyId: string;
  listingId?: string;
  message: string;
  createdAt: string;
  leadId: string;
}

export interface Lead {
  id: string;
  buyerId: string;
  propertyId: string;
  listingId?: string;
  enquiryId?: string;
  source: LeadSource;
  status: LeadStatus;
  assignedToId?: string;
  referredById?: string;
  createdAt: string;
  notes: string;
}

export interface SiteVisit {
  id: string;
  leadId?: string;
  buyerId: string;
  propertyId: string;
  associateId?: string;
  date: string;
  time: string;
  status: VisitStatus;
  notes: string;
  requestedById: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  buyerId: string;
  propertyId: string;
  ownerId?: string;
  builderId?: string;
  associateId?: string;
  leadId?: string;
  value: number;
  commission: number;
  status: DealStatus;
  date: string;
  notes: string;
}

export interface Project {
  id: string;
  builderId: string;
  name: string;
  location: string;
  city: string;
  description: string;
  images: string[];
  amenities: string[];
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
  status: ProjectStatus;
  developerName: string;
  createdAt: string;
}

export interface Favorite {
  userId: string;
  propertyId: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

export interface PlatformSettings {
  brandName: string;
  supportEmail: string;
  supportPhone: string;
  city: string;
  tagline: string;
  officeAddress: string;
}

export interface AppState {
  users: User[];
  properties: Property[];
  listings: Listing[];
  enquiries: Enquiry[];
  leads: Lead[];
  siteVisits: SiteVisit[];
  deals: Deal[];
  projects: Project[];
  favorites: Favorite[];
  messages: ContactMessage[];
  settings: PlatformSettings;
}

export interface PropertyInput {
  type: PropertyType;
  title: string;
  location: string;
  address: string;
  description: string;
  images: string[];
  amenities: string[];
  askingPrice: number;
  ownerId?: string;
  builderId?: string;
  projectId?: string;
  status: 'draft' | 'submitted';
  plotSizeSqYd?: number;
  facing?: Facing;
  roadWidthFt?: number;
  cornerPlot?: boolean;
  gatedCommunity?: boolean;
  approvalType?: ApprovalType;
  bhk?: number;
  builtUpSqFt?: number;
  plotAreaSqYd?: number;
  propertyAgeYears?: number;
  parking?: number;
  furnished?: Furnish;
}
