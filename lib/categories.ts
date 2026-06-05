import type { Category, Weights, WeightValue } from './types';

export const CATEGORIES: Category[] = [
  {
    key: 'location',
    icon: '📍',
    name: 'Location',
    items: [
      'Commute / drive time',
      'Neighborhood feel & safety',
      'Walk to groceries / gym',
      'Street noise',
      'Parking on/off-site',
    ],
  },
  {
    key: 'interior',
    icon: '🛋',
    name: 'Interior & Unit',
    items: [
      'Layout & flow',
      'Natural light',
      'Kitchen condition',
      'Bathroom & water pressure',
      'Closets / storage',
      'AC & heating',
      'Floors / walls / paint',
    ],
  },
  {
    key: 'building',
    icon: '🏢',
    name: 'Building & Amenities',
    items: [
      'Gym / fitness',
      'In-unit laundry',
      'Secure entry',
      'Elevator / stairs',
      'Trash & recycling',
      'Maintenance responsiveness',
    ],
  },
  {
    key: 'cost',
    icon: '💵',
    name: 'Cost & Value',
    items: [
      'Rent vs budget',
      'Utilities included?',
      'Deposit & fees',
      'Parking / pet fees',
      'Value for the money',
    ],
  },
  {
    key: 'practical',
    icon: '📋',
    name: 'Practical & Lease',
    items: [
      'Lease length & terms',
      'Management vibe',
      'Cell signal / wifi',
      'Pet / guest policy',
      'Move-in timing',
    ],
  },
  {
    key: 'vibe',
    icon: '✨',
    name: 'Gut Check',
    items: [
      'Could I picture living here',
      'First impression',
      'Light & airiness',
      'Would I be excited to come home',
    ],
  },
];

export const DEFAULT_WEIGHTS: Weights = {
  location: 3,
  interior: 3,
  building: 2,
  cost: 3,
  practical: 2,
  vibe: 2,
};

export const WEIGHT_LABEL: Record<WeightValue, string> = {
  1: 'Low',
  2: 'Med',
  3: 'High',
};
