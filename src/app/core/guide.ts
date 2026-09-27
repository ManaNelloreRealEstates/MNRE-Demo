import { DEMO_PASSWORD } from './format';
import { UserRole } from './models';

export interface ActorGuide {
  role: UserRole;
  title: string;
  person: string;
  email: string;
  password: string;
  summary: string;
  steps: string[];
}

export const ACTOR_GUIDES: ActorGuide[] = [
  {
    role: 'buyer',
    title: 'Buyer',
    person: 'Ravi Kumar',
    email: 'buyer@mananellore.com',
    password: DEMO_PASSWORD,
    summary: 'Searches plots and houses, then turns interest into a lead, a visit, and a negotiation.',
    steps: [
      'On the home page, choose Plot, House, or Both. The filters change with that choice.',
      'Search, open a card, and read the property. Save it if you want it on the shortlist.',
      'Sign in, then tap I’m interested. That creates an enquiry and a lead.',
      'Schedule a site visit with a date and time.',
      'Open the buyer dashboard: Enquiries, Leads, Saved, Site visits, and Negotiations.',
    ],
  },
  {
    role: 'owner',
    title: 'Owner',
    person: 'Venkata Subba Rao',
    email: 'owner@mananellore.com',
    password: DEMO_PASSWORD,
    summary: 'Submits a plot or house. Admin verifies it before buyers can see a listing.',
    steps: [
      'Open My properties. You already have a draft, submitted files, and live listings.',
      'Add a property and choose Plot or House. The form asks only for that type.',
      'Save a draft or submit it for verification.',
      'After admin approves and publishes, it becomes a listing.',
      'Enquiries and site visits on your properties show on this desk.',
    ],
  },
  {
    role: 'associate',
    title: 'Associate',
    person: 'Suresh Kumar, Nellore Property Associates',
    email: 'associate@mananellore.com',
    password: DEMO_PASSWORD,
    summary: 'Brings properties and buyers, attends visits, and tracks commission.',
    steps: [
      'Available properties are the live listings you can show a client.',
      'Refer a buyer against a property. A new buyer can sign in with the same demo password.',
      'My properties are the ones you submitted for an owner.',
      'My leads and Site visits are the files assigned to you.',
      'Deals and Commission show value and the 2% sample commission.',
    ],
  },
  {
    role: 'builder',
    title: 'Builder',
    person: 'Arun Reddy, Green Valley Developers',
    email: 'builder@mananellore.com',
    password: DEMO_PASSWORD,
    summary: 'Runs projects. Units inside a project are separate properties.',
    steps: [
      'Projects lists Green Valley Residency and Penna Riverside.',
      'Units shows the villas and apartments inside those projects.',
      'Create a project, then add a unit and submit it.',
      'Admin publishes the unit before it appears in public search.',
      'Enquiries, leads, visits, and deals for your units stay on this desk.',
    ],
  },
  {
    role: 'admin',
    title: 'Admin',
    person: 'MNRE Admin',
    email: 'admin@mananellore.com',
    password: DEMO_PASSWORD,
    summary: 'Runs approvals, the lead desk, site visits, and deals for every actor.',
    steps: [
      'The dashboard counts properties, listings, new leads, approvals, today’s visits, and deals.',
      'Properties: approve, request changes, reject, or approve and publish.',
      'Leads: move New to Contacted, Interested, Site visit, Negotiation, Converted, or Lost. Assign an associate and open a deal.',
      'Site visits: filter the calendar, confirm, reschedule, assign, complete, or cancel.',
      'Deals, Owners, Associates, Builders, and Reports cover the rest of the platform. Log out before you sign in as someone else.',
    ],
  },
];
