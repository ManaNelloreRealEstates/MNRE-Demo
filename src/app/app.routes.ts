import { Routes } from '@angular/router';
import { guestGuard, roleGuard } from './core/role.guard';
import { DashboardLayout } from './layout/dashboard-layout';
import { PublicLayout } from './layout/public-layout';
import { LoginPage, RegisterPage } from './pages/auth.page';
import { AboutPage, ContactPage, NotFoundPage, SellPage } from './pages/content.page';
import { AdminListingsPage, AdminProjectsPage, AdminPropertiesPage, AdminReportsPage, AdminSettingsPage } from './pages/admin.page';
import { BrowsePage } from './pages/browse.page';
import { BuyPage } from './pages/buy.page';
import { ProfilePage, ProjectFormPage, PropertyFormPage } from './pages/forms.page';
import { HomePage } from './pages/home.page';
import { OverviewPage } from './pages/overview.page';
import { DealsPanel, EnquiriesPanel, LeadsPanel, UsersPanel, VisitsPanel } from './pages/panels.page';
import { ProjectDetailPage, ProjectsPage } from './pages/projects.page';
import { PropertyDetailPage } from './pages/property-detail.page';
import {
  AssociateAvailablePage,
  AssociateBuyersPage,
  AssociatePropertiesPage,
  BuilderListingsPage,
  BuilderProjectsPage,
  BuilderUnitsPage,
  OwnerListingsPage,
  OwnerPropertiesPage,
  SavedPage,
} from './pages/workspace.page';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: HomePage },
      { path: 'buy', component: BuyPage },
      { path: 'properties', component: BrowsePage },
      { path: 'property/:id', component: PropertyDetailPage },
      { path: 'projects', component: ProjectsPage },
      { path: 'project/:id', component: ProjectDetailPage },
      { path: 'sell', component: SellPage },
      { path: 'about', component: AboutPage },
      { path: 'contact', component: ContactPage },
      { path: 'login', component: LoginPage, canActivate: [guestGuard] },
      { path: 'register', component: RegisterPage, canActivate: [guestGuard] },
    ],
  },
  {
    path: 'buyer',
    component: DashboardLayout,
    canActivate: [roleGuard],
    data: { roles: ['buyer'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: OverviewPage },
      { path: 'enquiries', component: EnquiriesPanel, data: { mode: 'buyer' } },
      { path: 'leads', component: LeadsPanel, data: { mode: 'buyer' } },
      { path: 'saved', component: SavedPage },
      { path: 'site-visits', component: VisitsPanel, data: { mode: 'buyer' } },
      { path: 'negotiations', component: DealsPanel, data: { mode: 'buyer' } },
      { path: 'profile', component: ProfilePage },
    ],
  },
  {
    path: 'owner',
    component: DashboardLayout,
    canActivate: [roleGuard],
    data: { roles: ['owner'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: OverviewPage },
      { path: 'properties/new', component: PropertyFormPage },
      { path: 'properties/:id/edit', component: PropertyFormPage },
      { path: 'properties', component: OwnerPropertiesPage },
      { path: 'listings', component: OwnerListingsPage },
      { path: 'enquiries', component: EnquiriesPanel, data: { mode: 'owner' } },
      { path: 'site-visits', component: VisitsPanel, data: { mode: 'owner' } },
      { path: 'profile', component: ProfilePage },
    ],
  },
  {
    path: 'associate',
    component: DashboardLayout,
    canActivate: [roleGuard],
    data: { roles: ['associate'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: OverviewPage },
      { path: 'available', component: AssociateAvailablePage },
      { path: 'properties/new', component: PropertyFormPage },
      { path: 'properties/:id/edit', component: PropertyFormPage },
      { path: 'properties', component: AssociatePropertiesPage },
      { path: 'buyers', component: AssociateBuyersPage },
      { path: 'leads', component: LeadsPanel, data: { mode: 'associate' } },
      { path: 'site-visits', component: VisitsPanel, data: { mode: 'associate' } },
      { path: 'deals', component: DealsPanel, data: { mode: 'associate' } },
      { path: 'commission', component: DealsPanel, data: { mode: 'associate' } },
      { path: 'profile', component: ProfilePage },
    ],
  },
  {
    path: 'builder',
    component: DashboardLayout,
    canActivate: [roleGuard],
    data: { roles: ['builder'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: OverviewPage },
      { path: 'projects/new', component: ProjectFormPage },
      { path: 'projects', component: BuilderProjectsPage },
      { path: 'units/new', component: PropertyFormPage },
      { path: 'units', component: BuilderUnitsPage },
      { path: 'listings', component: BuilderListingsPage },
      { path: 'enquiries', component: EnquiriesPanel, data: { mode: 'builder' } },
      { path: 'leads', component: LeadsPanel, data: { mode: 'builder' } },
      { path: 'site-visits', component: VisitsPanel, data: { mode: 'builder' } },
      { path: 'deals', component: DealsPanel, data: { mode: 'builder' } },
      { path: 'profile', component: ProfilePage },
    ],
  },
  {
    path: 'admin',
    component: DashboardLayout,
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: OverviewPage },
      { path: 'users', component: UsersPanel, data: { role: 'all' } },
      { path: 'properties/new', component: PropertyFormPage },
      { path: 'properties', component: AdminPropertiesPage },
      { path: 'listings', component: AdminListingsPage },
      { path: 'projects/new', component: ProjectFormPage },
      { path: 'projects', component: AdminProjectsPage },
      { path: 'leads', component: LeadsPanel, data: { mode: 'admin' } },
      { path: 'site-visits', component: VisitsPanel, data: { mode: 'admin' } },
      { path: 'deals', component: DealsPanel, data: { mode: 'admin' } },
      { path: 'owners', component: UsersPanel, data: { role: 'owner' } },
      { path: 'associates', component: UsersPanel, data: { role: 'associate' } },
      { path: 'builders', component: UsersPanel, data: { role: 'builder' } },
      { path: 'reports', component: AdminReportsPage },
      { path: 'settings', component: AdminSettingsPage },
      { path: 'profile', component: ProfilePage },
    ],
  },
  { path: '**', component: NotFoundPage },
];
