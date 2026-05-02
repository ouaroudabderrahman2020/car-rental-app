export type CarStatus = 'Available' | 'Rented' | 'In Maintenance' | 'Workshop' | 'Decommissioned';
export type ReservationStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'Overdue';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';

export interface Car {
  id: string;
  brand: string;
  model: string;
  plate: string;
  color?: string;
  fuel_type?: FuelType;
  transmission?: 'Automatic' | 'Manual';
  odometer: number;
  daily_rate: number;
  status: CarStatus;
  starting_fuel_level: number;
  gps_sim?: string;
  seats?: number;
  damage_notes?: string;
  image_url?: string;
  documentation_url?: string;
  created_at: string;
  updated_at: string;
  essentials?: any[];
  intervals?: any[];
}

export interface Reservation {
  id: string;
  car_id: string;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  status: ReservationStatus;
  total_price: number;
  prepayment: number;
  deposit_type?: string;
  deposit_amount?: number;
  odometer_out?: number;
  odometer_in?: number;
  fuel_level_out?: number;
  fuel_level_in?: number;
  extended_return_date?: string;
  cleaned_before?: string;
  included_items?: string[];
  notes?: string;
  rating?: number;
  created_at: string;
  car?: Car;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  id_card_number: string;
  trust_rank: number; // 1-5
  is_blacklisted: boolean;
  created_at: string;
  email?: string;
  address?: string;
  dob?: string;
  nationality?: string;
  national_id?: string;
  drive_id_photo?: string;
  drive_license_front_photo?: string;
  drive_license_back_photo?: string;
  drive_contract_doc_id?: string;
  notes?: string;
}
