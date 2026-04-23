import { Type } from '@angular/core';
import {
  IconListAltComponent,
  IconTicketAltComponent,
  IconDollarSignComponent,
  IconCalendarDayComponent,
  IconBadgeDollarComponent,
  IconCashRegisterComponent,
  IconWindowRestoreComponent,
  IconFileAltComponent,
  IconPiggyBankComponent,
  IconCogComponent,
  IconCityComponent,
  IconSignOutComponent,
} from '@shared';

export interface MenuItem {
  label: string;
  iconComponent?: Type<unknown>;
  active?: boolean;
  isOpen?: boolean;
  /** When set, sidebar entry navigates (leaf items under a section). */
  route?: string;
  items?: MenuItem[];
}

export const MENU_DATA: MenuItem[] = [
  {
    label: 'Assets',
    iconComponent: IconCityComponent,
    isOpen: true,
    items: [
      { label: 'Hubs' },
      { label: 'Calendar', route: '/assets/hubs/calendar' },
    ],
  },
  {
    label: 'Events',
    iconComponent: IconListAltComponent,
    isOpen: false,
    items: [
      { label: 'Events list' },
      { label: 'Dashboard' },
      { label: 'Structured plan', route: '/structured-plan' },
      { label: 'Inventory' },
      { label: 'Schedule & Tickets' },
      { label: 'Channels' },
      { label: 'Attendees' },
      { label: 'Invitations' },
      { label: 'Reviews' },
    ],
  },
  { label: 'Validation', iconComponent: IconTicketAltComponent },
  {
    label: 'Orders',
    iconComponent: IconDollarSignComponent,
    items: [{ label: 'Orders list' }],
  },
  {
    label: 'Reservations',
    iconComponent: IconCalendarDayComponent,
    items: [
      { label: 'Overview' },
      { label: 'Rules' },
      { label: 'Businesses' },
      { label: 'Guide' },
    ],
  },
  {
    label: 'Marketing',
    iconComponent: IconBadgeDollarComponent,
    items: [{ label: 'Promo codes' }],
  },
  {
    label: 'Box Office',
    iconComponent: IconCashRegisterComponent,
    items: [
      { label: 'Ticketing' },
      { label: 'Shifts' },
      { label: 'Stock Management' },
      { label: 'Settings' },
    ],
  },
  {
    label: 'White Labels',
    iconComponent: IconWindowRestoreComponent,
    items: [
      { label: 'My White Labels' },
      { label: 'Configurations' },
      { label: 'Styles' },
    ],
  },
  { label: 'Reports', iconComponent: IconFileAltComponent },
  {
    label: 'Finance',
    iconComponent: IconPiggyBankComponent,
    items: [{ label: 'Invoices' }],
  },
  {
    label: 'Settings',
    iconComponent: IconCogComponent,
    items: [
      { label: 'Users' },
      { label: 'Notifications' },
      { label: 'Feature Management' },
    ],
  },
  { label: 'Organizations', iconComponent: IconCityComponent },
  { label: 'Log out', iconComponent: IconSignOutComponent },
];
