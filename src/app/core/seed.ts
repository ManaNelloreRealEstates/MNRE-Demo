import { HOUSE_IMAGES, PLOT_IMAGES, PROJECT_IMAGES, shots, VILLA_IMAGES } from './images';
import { cityFor, DEMO_PASSWORD, localISODate, localISODateTime } from './format';
import {
  AppState,
  ApprovalType,
  Deal,
  DealStatus,
  Enquiry,
  Facing,
  Furnish,
  Lead,
  LeadSource,
  LeadStatus,
  Listing,
  ListingStatus,
  Project,
  Property,
  PropertyStatus,
  PropertyType,
  SiteVisit,
  User,
  UserRole,
  VisitStatus,
} from './models';

interface PropSeed {
  id: string;
  type: PropertyType;
  title: string;
  location: string;
  address: string;
  description: string;
  price: number;
  ownerId?: string;
  builderId?: string;
  projectId?: string;
  by: string;
  role: UserRole;
  status: PropertyStatus;
  days: number;
  img: number;
  pool: 'plot' | 'house' | 'villa' | 'project';
  note?: string;
  size?: number;
  facing?: Facing;
  road?: number;
  corner?: boolean;
  gated?: boolean;
  approval?: ApprovalType;
  bhk?: number;
  built?: number;
  plotArea?: number;
  age?: number;
  parking?: number;
  furnished?: Furnish;
}

function imagePool(name: PropSeed['pool']): string[] {
  if (name === 'plot') return PLOT_IMAGES;
  if (name === 'villa') return VILLA_IMAGES;
  if (name === 'project') return PROJECT_IMAGES;
  return HOUSE_IMAGES;
}

function amenitiesFor(item: PropSeed): string[] {
  if (item.type === 'plot') {
    return item.gated
      ? ['Compound wall', 'Street lights', 'Security', 'Park', 'Drainage']
      : ['Compound wall', 'Drainage', 'Main road access'];
  }
  if (item.type === 'apartment') return ['Lift', 'Security', 'Power backup', 'Visitor parking', 'Water supply'];
  if (item.type === 'villa') return ['Clubhouse', 'Security', 'Park', 'Power backup', 'Visitor parking'];
  return item.gated
    ? ['Security', 'Park', 'Power backup', 'Water supply', 'Visitor parking']
    : ['Water supply', 'Main road access', 'Street lights'];
}

function makeProperty(item: PropSeed): Property {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    location: item.location,
    city: cityFor(item.location),
    address: item.address,
    description: item.description,
    images: shots(imagePool(item.pool), item.img, 4),
    amenities: amenitiesFor(item),
    askingPrice: item.price,
    ownerId: item.ownerId,
    builderId: item.builderId,
    projectId: item.projectId,
    submittedById: item.by,
    submittedByRole: item.role,
    status: item.status,
    submittedAt: localISODateTime(item.days, '09:30:00'),
    updatedAt: localISODateTime(item.days, '09:30:00'),
    adminNote: item.note,
    plotSizeSqYd: item.size,
    facing: item.facing,
    roadWidthFt: item.road,
    cornerPlot: item.corner,
    gatedCommunity: item.gated,
    approvalType: item.approval,
    bhk: item.bhk,
    builtUpSqFt: item.built,
    plotAreaSqYd: item.plotArea,
    propertyAgeYears: item.age,
    parking: item.parking,
    furnished: item.furnished,
  };
}

export function createSeed(): AppState {
  const users: User[] = [
    user('B001', 'buyer', 'Ravi Kumar', 'buyer@mananellore.com', '9000010001', 'Magunta Layout'),
    user('B002', 'buyer', 'Anitha Reddy', 'anitha.reddy@example.com', '9000010002', 'Balaji Nagar'),
    user('B003', 'buyer', 'Karthik Naidu', 'karthik.naidu@example.com', '9000010003', 'Vedayapalem'),
    user('B004', 'buyer', 'Meena Chowdary', 'meena.chowdary@example.com', '9000010004', 'Dargamitta'),
    user('B005', 'buyer', 'Srinivas B', 'srinivas.b@example.com', '9000010005', 'Stonehousepet'),
    user('B006', 'buyer', 'Lakshmi P', 'lakshmi.p@example.com', '9000010006', 'Kavali'),
    user('B007', 'buyer', 'Venkat Rao', 'venkat.rao@example.com', '9000010007', 'Gudur'),
    user('B008', 'buyer', 'Divya S', 'divya.s@example.com', '9000010008', 'Ramalingapuram'),
    user('B009', 'buyer', 'Harish K', 'harish.k@example.com', '9000010009', 'Pogathota'),
    user('B010', 'buyer', 'Padma V', 'padma.v@example.com', '9000010010', 'Nellore Rural'),
    user('O001', 'owner', 'Venkata Subba Rao', 'owner@mananellore.com', '9000020001', 'Magunta Layout'),
    user('O002', 'owner', 'Ramesh G', 'ramesh.g@example.com', '9000020002', 'Pogathota'),
    user('O003', 'owner', 'Sujatha M', 'sujatha.m@example.com', '9000020003', 'Dargamitta'),
    user('O004', 'owner', 'Prasad K', 'prasad.k@example.com', '9000020004', 'Gudur'),
    user('O005', 'owner', 'Kavitha N', 'kavitha.n@example.com', '9000020005', 'Stonehousepet'),
    user('A001', 'associate', 'Suresh Kumar', 'associate@mananellore.com', '9000030001', 'Magunta Layout', 'Nellore Property Associates'),
    user('A002', 'associate', 'Priya N', 'priya.n@example.com', '9000030002', 'Balaji Nagar', 'Magunta Realty Desk'),
    user('A003', 'associate', 'Naresh T', 'naresh.t@example.com', '9000030003', 'Vedayapalem', 'Balaji Homes Connect'),
    user('A004', 'associate', 'Deepa R', 'deepa.r@example.com', '9000030004', 'Ramalingapuram', 'Penna Property Partners'),
    user('A005', 'associate', 'Mohan S', 'mohan.s@example.com', '9000030005', 'Gudur', 'Gudur Land Desk'),
    user('D001', 'builder', 'Arun Reddy', 'builder@mananellore.com', '9000040001', 'Vedayapalem', 'Green Valley Developers'),
    user('D002', 'builder', 'Kiran Babu', 'coastal.builder@example.com', '9000040002', 'Balaji Nagar', 'Coastal Homes'),
    user('D003', 'builder', 'Naveen P', 'southgate.builder@example.com', '9000040003', 'Kavali', 'South Gate Infra'),
    user('AD001', 'admin', 'MNRE Admin', 'admin@mananellore.com', '9000050001', 'Nellore', 'ManaNelloreRealEstate'),
  ];

  const bios: Record<string, string> = {
    B001: 'Sample buyer looking for an east-facing plot in Magunta Layout and a family house near schools.',
    O001: 'Sample owner with plots and a house moving through verification and listing.',
    A001: 'Sample associate at Nellore Property Associates. Refers buyers and brings owner properties.',
    D001: 'Sample builder leading Green Valley Residency and Penna Riverside.',
    AD001: 'Sample platform administrator for approvals, leads, visits and deals.',
  };
  const referred: Record<string, string> = { B003: 'A001', B006: 'A001', B008: 'A002', B009: 'A004' };
  users.forEach((person, index) => {
    person.createdAt = localISODateTime(-180 + index * 3, '08:00:00');
    person.bio = bios[person.id];
    person.referredById = referred[person.id];
  });

  const projects: Project[] = [
    {
      id: 'PR1001',
      builderId: 'D001',
      name: 'Green Valley Residency',
      location: 'Vedayapalem',
      city: 'Nellore',
      description:
        'A gated villa community beside the Vedayapalem main road, with parks, a clubhouse and wide internal roads. Sample project for this demo.',
      images: shots(VILLA_IMAGES, 0, 4),
      amenities: ['Clubhouse', 'Park', 'Security', 'Power backup', 'Visitor parking'],
      totalUnits: 48,
      availableUnits: 12,
      soldUnits: 20,
      status: 'ongoing',
      developerName: 'Green Valley Developers',
      createdAt: localISODateTime(-160),
    },
    {
      id: 'PR1002',
      builderId: 'D001',
      name: 'Penna Riverside',
      location: 'Magunta Layout',
      city: 'Nellore',
      description:
        'Upcoming apartment community near Magunta Layout with 2 and 3 BHK homes, lifts and covered parking. Sample project for this demo.',
      images: shots(PROJECT_IMAGES, 0, 4),
      amenities: ['Lift', 'Security', 'Power backup', 'Visitor parking', 'Park'],
      totalUnits: 120,
      availableUnits: 40,
      soldUnits: 10,
      status: 'upcoming',
      developerName: 'Green Valley Developers',
      createdAt: localISODateTime(-120),
    },
    {
      id: 'PR1003',
      builderId: 'D002',
      name: 'Balaji Enclave',
      location: 'Balaji Nagar',
      city: 'Nellore',
      description:
        'Independent houses in a quiet Balaji Nagar pocket, planned with parks and a compound wall. Sample project for this demo.',
      images: shots(HOUSE_IMAGES, 1, 4),
      amenities: ['Park', 'Security', 'Compound wall', 'Water supply'],
      totalUnits: 36,
      availableUnits: 9,
      soldUnits: 18,
      status: 'ongoing',
      developerName: 'Coastal Homes',
      createdAt: localISODateTime(-140),
    },
    {
      id: 'PR1004',
      builderId: 'D002',
      name: 'Stonehouse Villas',
      location: 'Stonehousepet',
      city: 'Nellore',
      description:
        'Limited villa release in Stonehousepet with private parking and a residents’ clubhouse. Sample project for this demo.',
      images: shots(VILLA_IMAGES, 2, 4),
      amenities: ['Clubhouse', 'Security', 'Park', 'Power backup'],
      totalUnits: 16,
      availableUnits: 6,
      soldUnits: 4,
      status: 'ongoing',
      developerName: 'Coastal Homes',
      createdAt: localISODateTime(-100),
    },
    {
      id: 'PR1005',
      builderId: 'D003',
      name: 'Kavali Greens',
      location: 'Kavali',
      city: 'Kavali',
      description:
        'Plotted development and a few houses on the Kavali outskirts, with DTCP-style layout roads in this sample project.',
      images: shots(PLOT_IMAGES, 2, 4),
      amenities: ['Compound wall', 'Street lights', 'Drainage', 'Main road access'],
      totalUnits: 80,
      availableUnits: 50,
      soldUnits: 8,
      status: 'upcoming',
      developerName: 'South Gate Infra',
      createdAt: localISODateTime(-80),
    },
  ];

  const properties = PROPERTY_SEEDS.map(makeProperty);

  const listingSeeds: Array<[string, string, ListingStatus, boolean, number, number]> = [
    ['P1001', 'A001', 'active', true, -38, 286],
    ['P1003', 'O002', 'active', false, -30, 142],
    ['P1004', 'A001', 'active', false, -28, 198],
    ['P1005', 'A002', 'active', false, -26, 121],
    ['P1007', 'A003', 'active', false, -24, 164],
    ['P1008', 'A001', 'sold', false, -40, 310],
    ['P1010', 'AD001', 'active', false, -18, 96],
    ['P1011', 'A001', 'active', true, -22, 254],
    ['P1012', 'O002', 'active', false, -21, 133],
    ['P1013', 'A002', 'active', true, -19, 221],
    ['P1015', 'O004', 'active', false, -16, 88],
    ['P1016', 'A005', 'active', false, -15, 101],
    ['P1017', 'A003', 'active', true, -14, 340],
    ['P1019', 'A004', 'active', false, -12, 117],
    ['P1021', 'D001', 'active', false, -20, 188],
    ['P1022', 'D001', 'active', true, -20, 276],
    ['P1023', 'D001', 'active', false, -18, 143],
    ['P1024', 'D001', 'active', false, -18, 129],
    ['P1025', 'D001', 'active', false, -11, 156],
    ['P1026', 'D001', 'active', true, -11, 209],
    ['P1028', 'D002', 'active', false, -17, 134],
    ['P1029', 'D002', 'active', false, -17, 98],
    ['P1030', 'D002', 'active', true, -17, 167],
    ['P1031', 'D002', 'active', false, -9, 144],
    ['P1032', 'D002', 'active', false, -9, 121],
    ['P1033', 'D003', 'active', false, -8, 77],
    ['P1034', 'D003', 'active', false, -8, 69],
    ['P1035', 'D003', 'active', false, -7, 84],
  ];

  const listings: Listing[] = listingSeeds.map(([propertyId, listedById, status, featured, days, views], index) => {
    const person = users.find((item) => item.id === listedById);
    const property = properties.find((item) => item.id === propertyId);
    if (!person || !property) throw new Error(`Bad listing seed ${propertyId}`);
    return {
      id: `L${1001 + index}`,
      propertyId,
      listedById,
      listedByRole: person.role,
      price: property.askingPrice,
      status,
      featured,
      createdAt: localISODateTime(days, '11:00:00'),
      views,
    };
  });

  const leadSeeds: Array<[string, string, string, LeadSource, LeadStatus, string, string, number, string]> = [
    ['LD1001', 'B001', 'P1001', 'website', 'interested', 'A001', '', -12, 'Asked for the latest photos of the east side.'],
    ['LD1002', 'B001', 'P1011', 'website', 'site_visit_scheduled', 'A001', '', -6, 'Wants to visit on a weekday morning.'],
    ['LD1003', 'B001', 'P1017', 'website', 'negotiation', 'A001', '', -4, 'Discussing a small revision on the asking price.'],
    ['LD1004', 'B002', 'P1003', 'website', 'new', 'A002', '', -2, 'New website enquiry.'],
    ['LD1005', 'B002', 'P1012', 'website', 'contacted', 'A002', '', -9, 'Called once. Asked about parking.'],
    ['LD1006', 'B003', 'P1004', 'associate', 'interested', 'A001', 'A001', -15, 'Referred by Suresh Kumar.'],
    ['LD1007', 'B003', 'P1013', 'associate', 'site_visit_completed', 'A001', 'A001', -20, 'Family liked the 4 BHK. Comparing one more house.'],
    ['LD1008', 'B004', 'P1005', 'website', 'site_visit_completed', 'A002', '', -8, 'Visit done. Buyer is still deciding.'],
    ['LD1009', 'B004', 'P1015', 'phone', 'contacted', 'A003', '', -7, 'Phone enquiry about the Ramalingapuram house.'],
    ['LD1010', 'B005', 'P1007', 'website', 'interested', 'A003', '', -11, 'Wants a west-facing plot near Pogathota.'],
    ['LD1011', 'B005', 'P1016', 'website', 'lost', 'A005', '', -18, 'Buyer paused the search.'],
    ['LD1012', 'B006', 'P1008', 'associate', 'converted', 'A001', 'A001', -30, 'Plot booked and marked sold in this demo.'],
    ['LD1013', 'B007', 'P1001', 'website', 'new', '', '', -1, 'Second buyer interested in the Magunta plot.'],
    ['LD1014', 'B007', 'P1019', 'website', 'site_visit_scheduled', 'A004', '', -5, 'Visit confirmed for today.'],
    ['LD1015', 'B008', 'P1022', 'builder', 'negotiation', 'A001', 'A002', -7, 'Comparing the 4 BHK villa with a smaller unit.'],
    ['LD1016', 'B008', 'P1021', 'builder', 'contacted', 'A001', '', -10, 'Asked about clubhouse charges.'],
    ['LD1017', 'B009', 'P1031', 'associate', 'site_visit_scheduled', 'A004', 'A004', -4, 'Referred to Stonehouse Villas.'],
    ['LD1018', 'B010', 'P1012', 'website', 'new', 'A002', '', -1, 'Enquiry on the Balaji Nagar house.'],
    ['LD1019', 'B010', 'P1026', 'builder', 'interested', '', '', -6, 'Interested in the Penna Riverside 3 BHK.'],
    ['LD1020', 'B003', 'P1023', 'builder', 'site_visit_scheduled', 'A001', '', -3, 'Second villa option for Karthik.'],
    ['LD1021', 'B004', 'P1033', 'website', 'new', 'A005', '', -2, 'Asked if the Kavali plot is DTCP approved.'],
    ['LD1022', 'B005', 'P1028', 'walk_in', 'contacted', 'A002', '', -14, 'Met the associate at the site office.'],
    ['LD1023', 'B002', 'P1025', 'builder', 'new', '', '', -1, 'New enquiry for a 2 BHK apartment.'],
    ['LD1024', 'B009', 'P1034', 'associate', 'interested', 'A004', 'A004', -9, 'Backup plot if the villa does not suit.'],
    ['LD1025', 'B006', 'P1011', 'phone', 'interested', 'A001', 'A001', -13, 'Also asked about the Magunta house before the Kavali deal.'],
  ];

  const leads: Lead[] = leadSeeds.map(([id, buyerId, propertyId, source, status, assignedToId, referredById, days, notes]) => ({
    id,
    buyerId,
    propertyId,
    source,
    status,
    assignedToId: assignedToId || undefined,
    referredById: referredById || undefined,
    createdAt: localISODateTime(days, '12:15:00'),
    notes,
  }));

  const enquiries: Enquiry[] = [];
  for (const lead of leads) {
    const listing = listings.find((item) => item.propertyId === lead.propertyId);
    lead.listingId = listing?.id;
    if (lead.source !== 'website') continue;
    const enquiry: Enquiry = {
      id: `E${lead.id.slice(2)}`,
      buyerId: lead.buyerId,
      propertyId: lead.propertyId,
      listingId: listing?.id,
      message: lead.notes || 'I am interested in this property. Please contact me.',
      createdAt: lead.createdAt,
      leadId: lead.id,
    };
    lead.enquiryId = enquiry.id;
    enquiries.push(enquiry);
  }

  const visitSeeds: Array<[string, string, string, string, string, number, string, VisitStatus, string, string]> = [
    ['SV1001', 'LD1002', 'B001', 'P1011', 'A001', 1, '10:30', 'confirmed', 'B001', 'Weekday morning visit.'],
    ['SV1002', 'LD1001', 'B001', 'P1001', 'A001', -8, '11:00', 'completed', 'B001', 'Walked the plot and checked the road width.'],
    ['SV1003', 'LD1007', 'B003', 'P1013', 'A001', -12, '16:00', 'completed', 'A001', 'Family visit completed.'],
    ['SV1004', 'LD1014', 'B007', 'P1019', 'A004', 0, '15:00', 'confirmed', 'B007', 'Today’s confirmed visit.'],
    ['SV1005', 'LD1017', 'B009', 'P1031', 'A004', 2, '09:30', 'requested', 'B009', 'Waiting for associate confirmation.'],
    ['SV1006', 'LD1012', 'B006', 'P1008', 'A001', -21, '11:00', 'completed', 'A001', 'Visit that led to the completed deal.'],
    ['SV1007', 'LD1011', 'B005', 'P1016', 'A005', -14, '17:00', 'no_show', 'B005', 'Buyer did not reach the site.'],
    ['SV1008', 'LD1005', 'B002', 'P1012', 'A002', 3, '10:00', 'rescheduled', 'B002', 'Moved to a later morning.'],
    ['SV1009', 'LD1015', 'B008', 'P1022', 'A001', 5, '11:30', 'confirmed', 'B008', 'Villa walkthrough with the builder.'],
    ['SV1010', 'LD1019', 'B010', 'P1026', 'A003', -2, '12:30', 'cancelled', 'B010', 'Buyer cancelled.'],
    ['SV1011', 'LD1020', 'B003', 'P1023', 'A001', 4, '14:00', 'requested', 'A001', 'Associate requested this visit.'],
    ['SV1012', 'LD1008', 'B004', 'P1005', 'A002', -6, '12:00', 'completed', 'B004', 'Plot visit completed.'],
  ];

  const siteVisits: SiteVisit[] = visitSeeds.map(
    ([id, leadId, buyerId, propertyId, associateId, days, time, status, requestedById, notes]) => ({
      id,
      leadId,
      buyerId,
      propertyId,
      associateId,
      date: localISODate(days),
      time,
      status,
      notes,
      requestedById,
      createdAt: localISODateTime(days - 1, '09:00:00'),
    }),
  );

  const dealSeeds: Array<[string, string, string, string, DealStatus, number, string, string]> = [
    ['DL1001', 'B006', 'P1008', 'A001', 'completed', -20, 'LD1012', 'Sample completed sale of the Kavali plot.'],
    ['DL1002', 'B001', 'P1017', 'A001', 'negotiation', -3, 'LD1003', 'Price discussion on the Pogathota house.'],
    ['DL1003', 'B008', 'P1022', 'A001', 'booking', -2, 'LD1015', 'Booking amount noted for the 4 BHK villa.'],
    ['DL1004', 'B003', 'P1013', 'A001', 'confirmed', -10, 'LD1007', 'Verbal confirmation, paperwork in the demo flow.'],
    ['DL1005', 'B005', 'P1016', 'A005', 'cancelled', -12, 'LD1011', 'Buyer withdrew.'],
    ['DL1006', 'B009', 'P1031', 'A004', 'negotiation', -1, 'LD1017', 'Opening negotiation on Stonehouse Villas.'],
  ];

  const deals: Deal[] = dealSeeds.map(([id, buyerId, propertyId, associateId, status, days, leadId, notes]) => {
    const property = properties.find((item) => item.id === propertyId);
    if (!property) throw new Error(`Bad deal seed ${propertyId}`);
    return {
      id,
      buyerId,
      propertyId,
      ownerId: property.ownerId,
      builderId: property.builderId,
      associateId,
      leadId,
      value: property.askingPrice,
      commission: Math.round(property.askingPrice * 0.02),
      status,
      date: localISODate(days),
      notes,
    };
  });

  return {
    users,
    properties,
    listings,
    enquiries,
    leads,
    siteVisits,
    deals,
    projects,
    favorites: [
      { userId: 'B001', propertyId: 'P1003', createdAt: localISODateTime(-5) },
      { userId: 'B001', propertyId: 'P1013', createdAt: localISODateTime(-4) },
      { userId: 'B001', propertyId: 'P1022', createdAt: localISODateTime(-3) },
      { userId: 'B001', propertyId: 'P1007', createdAt: localISODateTime(-2) },
      { userId: 'B002', propertyId: 'P1011', createdAt: localISODateTime(-6) },
      { userId: 'B002', propertyId: 'P1026', createdAt: localISODateTime(-1) },
      { userId: 'B004', propertyId: 'P1001', createdAt: localISODateTime(-7) },
    ],
    messages: [
      {
        id: 'M1001',
        name: 'Sample Visitor',
        email: 'visitor.one@example.com',
        phone: '9000090001',
        message: 'Do you cover agricultural land near Nellore Rural?',
        createdAt: localISODateTime(-3, '15:00:00'),
      },
      {
        id: 'M1002',
        name: 'Sample Owner',
        email: 'visitor.two@example.com',
        phone: '9000090002',
        message: 'I want to list a house in Dargamitta. Is verification required?',
        createdAt: localISODateTime(-1, '16:40:00'),
      },
    ],
    settings: {
      brandName: 'ManaNelloreRealEstate',
      supportEmail: 'hello@mananellore.com',
      supportPhone: '9000000000',
      city: 'Nellore',
      tagline: 'Building trust, creating futures',
      officeAddress: 'Demo Office, Trunk Road, Nellore, Andhra Pradesh 524001',
    },
  };
}

function user(
  id: string,
  role: UserRole,
  name: string,
  email: string,
  phone: string,
  location: string,
  company?: string,
): User {
  return {
    id,
    role,
    name,
    email,
    phone,
    password: DEMO_PASSWORD,
    company,
    location,
    active: true,
    createdAt: localISODateTime(-90),
  };
}

const PROPERTY_SEEDS: PropSeed[] = [
  plot('P1001', 'East-facing plot in Magunta Layout', 'Magunta Layout', 'O001', 'A001', 'associate', 'listed', -40, 0, 4500000, 240, 'east', 30, false, true, 'dtcp', 'A ready residential plot close to the Magunta Layout main road, with a compound wall and street lights.'),
  plot('P1002', 'Corner plot in Balaji Nagar', 'Balaji Nagar', 'O001', 'O001', 'owner', 'submitted', -2, 1, 3200000, 180, 'west', 25, true, true, 'rera', 'Corner plot inside a gated pocket. Waiting for platform verification in this demo.'),
  plot('P1003', 'North-facing plot at Dargamitta', 'Dargamitta', 'O002', 'O002', 'owner', 'listed', -30, 2, 5800000, 300, 'north', 40, true, false, 'dtcp', 'A wider corner plot on a 40 ft road, suitable for an independent house.'),
  plot('P1004', 'RERA plotted land in Vedayapalem', 'Vedayapalem', 'O003', 'A001', 'associate', 'listed', -28, 3, 2700000, 200, 'east', 30, false, true, 'rera', 'Associate-sourced plot in a gated layout near Vedayapalem.'),
  plot('P1005', 'Compact plot in Ramalingapuram', 'Ramalingapuram', 'O004', 'A002', 'associate', 'listed', -26, 4, 2200000, 150, 'south', 20, false, false, 'other', 'Smaller south-facing plot for a compact house plan.'),
  plot('P1006', 'Large Stonehousepet corner', 'Stonehousepet', 'O005', 'O005', 'owner', 'under_verification', -4, 5, 7500000, 400, 'north_east', 50, true, true, 'dtcp', 'Large corner parcel currently under verification.'),
  plot('P1007', 'Pogathota residential plot', 'Pogathota', 'O002', 'A003', 'associate', 'listed', -24, 6, 3600000, 220, 'west', 30, false, false, 'not_specified', 'West-facing plot with a 30 ft approach road.'),
  plot('P1008', 'Gated plot in Kavali', 'Kavali', 'O003', 'A001', 'associate', 'listed', -45, 7, 6400000, 350, 'east', 40, true, true, 'dtcp', 'This sample plot is already marked sold after a completed deal.'),
  plot('P1009', 'Gudur layout plot', 'Gudur', 'O004', 'O004', 'owner', 'changes_requested', -6, 2, 1800000, 120, 'south', 20, false, false, 'not_specified', 'Admin asked for a clearer site photo and road-width note.', 'Please confirm the road width and add a clearer site photo.'),
  plot('P1010', 'Nellore Rural farmland edge plot', 'Nellore Rural', 'O005', 'AD001', 'admin', 'listed', -18, 3, 4100000, 280, 'north', 25, false, false, 'dtcp', 'Admin-listed plot on the rural edge of Nellore, with DTCP approval noted in the sample record.'),
  house('P1011', '3 BHK house in Magunta Layout', 'Magunta Layout', 'O001', 'A001', 'associate', 'listed', -22, 0, 7200000, 3, 1650, 180, 6, 'east', 1, 'semi_furnished', true, 'A family house near schools, with one covered parking slot.'),
  house('P1012', '2 BHK house in Balaji Nagar', 'Balaji Nagar', 'O002', 'O002', 'owner', 'listed', -21, 1, 4800000, 2, 1100, 120, 12, 'west', 0, 'unfurnished', false, 'An older unfurnished house on a quiet cross road.'),
  house('P1013', '4 BHK house in Dargamitta', 'Dargamitta', 'O003', 'A002', 'associate', 'listed', -19, 2, 9500000, 4, 2400, 240, 4, 'north', 2, 'furnished', true, 'A newer furnished house in a gated street with two parking slots.'),
  house('P1014', '3 BHK house in Vedayapalem', 'Vedayapalem', 'O001', 'O001', 'owner', 'submitted', -1, 3, 6800000, 3, 1500, 160, 8, 'east', 1, 'semi_furnished', true, 'Freshly submitted house waiting for admin review.'),
  house('P1015', '2 BHK house in Ramalingapuram', 'Ramalingapuram', 'O004', 'O004', 'owner', 'listed', -16, 4, 3900000, 2, 980, 100, 15, 'south', 1, 'unfurnished', false, 'Compact older house, listed directly by the owner.'),
  house('P1016', '3 BHK house in Stonehousepet', 'Stonehousepet', 'O005', 'A005', 'associate', 'listed', -15, 5, 5500000, 3, 1400, 150, 9, 'north_east', 1, 'semi_furnished', true, 'Gated house with a single car park.'),
  house('P1017', '5 BHK house in Pogathota', 'Pogathota', 'O002', 'A003', 'associate', 'listed', -14, 6, 13500000, 5, 3200, 300, 3, 'east', 3, 'furnished', true, 'A larger furnished house currently in negotiation in the sample data.'),
  house('P1018', '2 BHK house in Kavali', 'Kavali', 'O003', 'O003', 'owner', 'rejected', -9, 7, 4400000, 2, 1050, 110, 11, 'west', 1, 'unfurnished', false, 'Rejected in this demo because ownership papers were incomplete.', 'Ownership papers were incomplete. This sample was rejected.'),
  house('P1019', '3 BHK house in Gudur', 'Gudur', 'O004', 'A004', 'associate', 'listed', -12, 8, 5200000, 3, 1380, 140, 7, 'west', 1, 'semi_furnished', false, 'A practical 3 BHK with a visit booked for today.'),
  house('P1020', '4 BHK house in Nellore Rural', 'Nellore Rural', 'O005', 'O005', 'owner', 'approved', -3, 9, 8800000, 4, 2100, 200, 5, 'north', 2, 'furnished', true, 'Approved and waiting for admin to publish the listing.'),
  villa('P1021', '3 BHK villa at Green Valley', 'Vedayapalem', 'D001', 'PR1001', 'listed', -20, 0, 8500000, 3, 2100, 220, 1),
  villa('P1022', '4 BHK villa at Green Valley', 'Vedayapalem', 'D001', 'PR1001', 'listed', -20, 1, 11000000, 4, 2800, 280, 1),
  villa('P1023', '3 BHK garden villa', 'Vedayapalem', 'D001', 'PR1001', 'listed', -18, 2, 9200000, 3, 2200, 240, 1),
  villa('P1024', '4 BHK corner villa', 'Vedayapalem', 'D001', 'PR1001', 'listed', -18, 3, 12500000, 4, 3000, 300, 0),
  apartment('P1025', '2 BHK at Penna Riverside', 'Magunta Layout', 'D001', 'PR1002', 'listed', -11, 0, 4800000, 2, 1050, 1),
  apartment('P1026', '3 BHK at Penna Riverside', 'Magunta Layout', 'D001', 'PR1002', 'listed', -11, 1, 7200000, 3, 1480, 1),
  apartment('P1027', '3 BHK east wing, Penna Riverside', 'Magunta Layout', 'D001', 'PR1002', 'submitted', -1, 2, 6800000, 3, 1420, 1),
  projectHouse('P1028', '3 BHK at Balaji Enclave', 'Balaji Nagar', 'D002', 'PR1003', 'listed', -17, 2, 7600000, 3, 1680, 170, 2),
  projectHouse('P1029', '2 BHK at Balaji Enclave', 'Balaji Nagar', 'D002', 'PR1003', 'listed', -17, 3, 5100000, 2, 1120, 120, 3),
  projectHouse('P1030', '4 BHK at Balaji Enclave', 'Balaji Nagar', 'D002', 'PR1003', 'listed', -17, 4, 10500000, 4, 2300, 220, 1),
  villa('P1031', '3 BHK at Stonehouse Villas', 'Stonehousepet', 'D002', 'PR1004', 'listed', -9, 4, 9800000, 3, 2050, 210, 1),
  villa('P1032', '4 BHK at Stonehouse Villas', 'Stonehousepet', 'D002', 'PR1004', 'listed', -9, 5, 14000000, 4, 2900, 270, 0),
  plot('P1033', 'Plot 12, Kavali Greens', 'Kavali', 'D003', 'D003', 'builder', 'listed', -8, 1, 3000000, 200, 'east', 30, false, true, 'dtcp', 'A layout plot inside the Kavali Greens sample project.', undefined, 'D003', 'PR1005'),
  plot('P1034', 'Plot 18, Kavali Greens', 'Kavali', 'D003', 'D003', 'builder', 'listed', -8, 4, 2600000, 160, 'north', 30, true, true, 'dtcp', 'Corner plot inside Kavali Greens.', undefined, 'D003', 'PR1005'),
  house('P1035', '3 BHK house at Kavali Greens', 'Kavali', 'D003', 'D003', 'builder', 'listed', -7, 5, 6000000, 3, 1460, 150, 1, 'east', 1, 'semi_furnished', true, 'A project house with a small garden.', undefined, 'D003', 'PR1005'),
  plot('P1036', 'Draft plot near Magunta Layout', 'Magunta Layout', 'O001', 'O001', 'owner', 'draft', -1, 5, 2000000, 140, 'east', 20, false, false, 'not_specified', 'Owner draft that has not been submitted yet.'),
];

function plot(
  id: string,
  title: string,
  location: string,
  ownerId: string,
  by: string,
  role: UserRole,
  status: PropertyStatus,
  days: number,
  img: number,
  price: number,
  size: number,
  facing: Facing,
  road: number,
  corner: boolean,
  gated: boolean,
  approval: ApprovalType,
  description: string,
  note?: string,
  builderId?: string,
  projectId?: string,
): PropSeed {
  return {
    id,
    type: 'plot',
    title,
    location,
    address: `${title}, ${location}, ${cityFor(location)}, Andhra Pradesh`,
    description,
    price,
    ownerId: builderId ? undefined : ownerId,
    builderId,
    projectId,
    by,
    role,
    status,
    days,
    img,
    pool: 'plot',
    note,
    size,
    facing,
    road,
    corner,
    gated,
    approval,
  };
}

function house(
  id: string,
  title: string,
  location: string,
  ownerId: string,
  by: string,
  role: UserRole,
  status: PropertyStatus,
  days: number,
  img: number,
  price: number,
  bhk: number,
  built: number,
  plotArea: number,
  age: number,
  facing: Facing,
  parking: number,
  furnished: Furnish,
  gated: boolean,
  description: string,
  note?: string,
  builderId?: string,
  projectId?: string,
): PropSeed {
  return {
    id,
    type: 'house',
    title,
    location,
    address: `${title}, ${location}, ${cityFor(location)}, Andhra Pradesh`,
    description,
    price,
    ownerId: builderId ? undefined : ownerId,
    builderId,
    projectId,
    by,
    role,
    status,
    days,
    img,
    pool: projectId ? 'house' : 'house',
    note,
    facing,
    gated,
    bhk,
    built,
    plotArea,
    age,
    parking,
    furnished,
    road: 30,
  };
}

function villa(
  id: string,
  title: string,
  location: string,
  builderId: string,
  projectId: string,
  status: PropertyStatus,
  days: number,
  img: number,
  price: number,
  bhk: number,
  built: number,
  plotArea: number,
  age: number,
): PropSeed {
  return {
    id,
    type: 'villa',
    title,
    location,
    address: `${title}, ${location}, ${cityFor(location)}, Andhra Pradesh`,
    description: `${title} is a sample villa unit with clubhouse access, security and covered parking.`,
    price,
    builderId,
    projectId,
    by: builderId,
    role: 'builder',
    status,
    days,
    img,
    pool: 'villa',
    facing: 'east',
    gated: true,
    bhk,
    built,
    plotArea,
    age,
    parking: 2,
    furnished: 'semi_furnished',
    approval: 'rera',
  };
}

function apartment(
  id: string,
  title: string,
  location: string,
  builderId: string,
  projectId: string,
  status: PropertyStatus,
  days: number,
  img: number,
  price: number,
  bhk: number,
  built: number,
  age: number,
): PropSeed {
  return {
    id,
    type: 'apartment',
    title,
    location,
    address: `${title}, ${location}, ${cityFor(location)}, Andhra Pradesh`,
    description: `${title} is a sample apartment with lift access, security and one reserved car park.`,
    price,
    builderId,
    projectId,
    by: builderId,
    role: 'builder',
    status,
    days,
    img,
    pool: 'project',
    facing: 'east',
    gated: true,
    bhk,
    built,
    age,
    parking: 1,
    furnished: 'unfurnished',
    approval: 'rera',
  };
}

function projectHouse(
  id: string,
  title: string,
  location: string,
  builderId: string,
  projectId: string,
  status: PropertyStatus,
  days: number,
  img: number,
  price: number,
  bhk: number,
  built: number,
  plotArea: number,
  age: number,
): PropSeed {
  return house(
    id,
    title,
    location,
    builderId,
    builderId,
    'builder',
    status,
    days,
    img,
    price,
    bhk,
    built,
    plotArea,
    age,
    'north',
    1,
    'semi_furnished',
    true,
    `${title} is a sample independent house inside the builder project.`,
    undefined,
    builderId,
    projectId,
  );
}
