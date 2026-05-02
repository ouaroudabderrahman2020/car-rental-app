import { CarStatus, ReservationStatus, FuelType } from './types';

export const CAR_STATUSES: readonly CarStatus[] = [
  'Available', 
  'Rented', 
  'In Maintenance', 
  'Workshop', 
  'Decommissioned'
];

export const FUEL_TYPES: readonly FuelType[] = [
  'Petrol', 
  'Diesel', 
  'Electric', 
  'Hybrid'
];

export const TRANSMISSIONS: readonly ('Automatic' | 'Manual')[] = [
  'Automatic', 
  'Manual'
];

export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  'Pending', 
  'Confirmed', 
  'In Progress', 
  'Completed', 
  'Cancelled', 
  'Overdue'
];
