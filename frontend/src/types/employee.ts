export interface WorkingHours {
  start: string;
  end: string;
}

export interface TimeOff {
  date: string;
  reason: string;
}

export interface Appointment {
  id: number;
  date: string;
  count: number;
}

export interface EmployeeSchedule {
  working_hours: {
    [key: string]: WorkingHours;
  };
  time_off: TimeOff[];
  appointments: any[];
}

export interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: number;
  description?: string;
  salon_id: number;
  active: boolean;
  image_url?: string;
  employee_ids?: number[];
}

export interface ServiceAssignment {
  employee_id: number;
  service_id: number;
}

export interface Salon {
  id: number;
  name: string;
  address: string;
  phone: string;
  description: string;
  opening_hours: {
    [key: string]: string;
  };
  image_url: string;
  active: boolean;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  phone: string;
  email: string;
  bio: string;
  salon_id: number;
  working_hours: {
    [key: string]: WorkingHours;
  };
  service_ids: number[];
  photo_url: string;
  active: boolean;
}

export interface AppointmentDetails {
  id: number;
  client_id: number;
  client_name: string;
  service_id: number;
  service_name: string;
  salon_id: number;
  salon_name: string;
  salon_address: string;
  employee_id: number;
  date_time: string;
  duration: number;
  price: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  cancel_reason?: string;
  client_contact: string;
}

export interface EmployeePerformance {
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  total_revenue: number;
  average_rating: number;
  client_satisfaction: number;
  popular_services: {
    service_id: number;
    service_name: string;
    count: number;
  }[];
  monthly_stats: {
    month: string;
    appointments: number;
    revenue: number;
  }[];
} 