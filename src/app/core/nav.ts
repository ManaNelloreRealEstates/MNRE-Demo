import { UserRole } from './models';

export interface NavItem {
  label: string;
  path: string;
  exact?: boolean;
}

export const ROLE_NAV: Record<UserRole, NavItem[]> = {
  buyer: [
    { label: 'Overview', path: '/buyer/dashboard', exact: true },
    { label: 'Enquiries', path: '/buyer/enquiries' },
    { label: 'Leads', path: '/buyer/leads' },
    { label: 'Saved', path: '/buyer/saved' },
    { label: 'Site visits', path: '/buyer/site-visits' },
    { label: 'Negotiations', path: '/buyer/negotiations' },
    { label: 'Profile', path: '/buyer/profile' },
  ],
  owner: [
    { label: 'Overview', path: '/owner/dashboard', exact: true },
    { label: 'My properties', path: '/owner/properties', exact: true },
    { label: 'Add property', path: '/owner/properties/new' },
    { label: 'My listings', path: '/owner/listings' },
    { label: 'Enquiries', path: '/owner/enquiries' },
    { label: 'Site visits', path: '/owner/site-visits' },
    { label: 'Profile', path: '/owner/profile' },
  ],
  associate: [
    { label: 'Overview', path: '/associate/dashboard', exact: true },
    { label: 'Available', path: '/associate/available' },
    { label: 'My properties', path: '/associate/properties' },
    { label: 'My buyers', path: '/associate/buyers' },
    { label: 'My leads', path: '/associate/leads' },
    { label: 'Site visits', path: '/associate/site-visits' },
    { label: 'Deals', path: '/associate/deals' },
    { label: 'Commission', path: '/associate/commission' },
    { label: 'Profile', path: '/associate/profile' },
  ],
  builder: [
    { label: 'Overview', path: '/builder/dashboard', exact: true },
    { label: 'Projects', path: '/builder/projects' },
    { label: 'Units', path: '/builder/units' },
    { label: 'Listings', path: '/builder/listings' },
    { label: 'Enquiries', path: '/builder/enquiries' },
    { label: 'Leads', path: '/builder/leads' },
    { label: 'Site visits', path: '/builder/site-visits' },
    { label: 'Deals', path: '/builder/deals' },
    { label: 'Profile', path: '/builder/profile' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', exact: true },
    { label: 'Users', path: '/admin/users' },
    { label: 'Properties', path: '/admin/properties' },
    { label: 'Listings', path: '/admin/listings' },
    { label: 'Projects', path: '/admin/projects' },
    { label: 'Leads', path: '/admin/leads' },
    { label: 'Site visits', path: '/admin/site-visits' },
    { label: 'Deals', path: '/admin/deals' },
    { label: 'Owners', path: '/admin/owners' },
    { label: 'Associates', path: '/admin/associates' },
    { label: 'Builders', path: '/admin/builders' },
    { label: 'Reports', path: '/admin/reports' },
    { label: 'Settings', path: '/admin/settings' },
  ],
};

export const BOTTOM_NAV: Record<UserRole, NavItem[]> = {
  buyer: [
    { label: 'Home', path: '/buyer/dashboard', exact: true },
    { label: 'Leads', path: '/buyer/leads' },
    { label: 'Visits', path: '/buyer/site-visits' },
    { label: 'Saved', path: '/buyer/saved' },
  ],
  owner: [
    { label: 'Home', path: '/owner/dashboard', exact: true },
    { label: 'Properties', path: '/owner/properties', exact: true },
    { label: 'Listings', path: '/owner/listings' },
    { label: 'Visits', path: '/owner/site-visits' },
  ],
  associate: [
    { label: 'Home', path: '/associate/dashboard', exact: true },
    { label: 'Leads', path: '/associate/leads' },
    { label: 'Buyers', path: '/associate/buyers' },
    { label: 'Deals', path: '/associate/deals' },
  ],
  builder: [
    { label: 'Home', path: '/builder/dashboard', exact: true },
    { label: 'Projects', path: '/builder/projects' },
    { label: 'Units', path: '/builder/units' },
    { label: 'Leads', path: '/builder/leads' },
  ],
  admin: [
    { label: 'Home', path: '/admin/dashboard', exact: true },
    { label: 'Leads', path: '/admin/leads' },
    { label: 'Visits', path: '/admin/site-visits' },
    { label: 'Deals', path: '/admin/deals' },
  ],
};
