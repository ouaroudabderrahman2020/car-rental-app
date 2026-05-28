export type CarStatus = 'Available' | 'Unavailable' | 'Rented' | 'In Maintenance' | 'Workshop' | 'Decommissioned';
export type ReservationStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'Overdue';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';

export interface MaintenanceInterval {
  id: string;
  type: string;
  value: string;
  lastCompleted: string;
}

export interface EssentialItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface CarDocument {
  doc_type: 'image' | 'registration_card' | 'insurance' | 'vignette' | 'documentation';
  file_url: string;
  file_name?: string;
  mime_type?: string;
}

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
  gps_sim?: string;
  seats?: number;
  notes?: string;
  registration_expiry?: string;
  insurance_expiry?: string;
  vignette_expiry?: string;
  first_use_date?: string;
  created_at: string;
  updated_at: string;
  essentials?: EssentialItem[];
  intervals?: MaintenanceInterval[];
  documents?: CarDocument[];
}

export interface FormattedCar extends Car {
  name: string;
  statusColor?: string;
  rentedBy?: string;
  returnDate?: string;
  needsMaintenance?: boolean;
  rate?: string;
  image?: string;
}

export interface ReservationDocument {
  doc_type: 'vehicle_state' | 'paper_contract' | 'id_card' | 'license';
  file_url: string;
  file_name?: string;
  mime_type?: string;
}

export interface Reservation {
  id: string;
  car_id: string;
  client_id?: string;
  customer_name: string;
  customer_national_id?: string;
  customer_license?: string;
  start_date: string;
  end_date: string;
  status: ReservationStatus;
  total_price: number;
  prepayment: number;
  balance_due?: number;
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
  vehicle_state_urls?: string[];
  contract_url?: string;
  paper_contract_urls?: string[];
  created_at: string;
  updated_at?: string;
  car?: Car;
  documents?: ReservationDocument[];
}

export interface FormattedReservation extends Reservation {
  id_short: string;
  client: string;
  carName: string;
  carPlate: string;
  duration: string;
  state: string;
  price: string;
  statusColor?: string;
  clientType?: string;
  mileage?: string;
  durationString?: string;
  hours?: string;
}

export interface ClientDocument {
  doc_type: 'id_card' | 'license' | 'master_contract';
  file_url: string;
  file_name?: string;
  mime_type?: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  id_card_number: string;
  trust_rank: number; // 1-5
  is_blacklisted: boolean;
  license_issue?: string;
  created_at: string;
  email?: string;
  address?: string;
  dob?: string;
  nationality?: string;
  national_id?: string;
  notes?: string;
  documents?: ClientDocument[];
}
