export interface User {
  id: string;
  email: string;
  role: 'parent' | 'delivery_staff' | 'school_admin' | 'system_admin';
  full_name: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  class: string;
  school_id: string;
  allergies?: string;
  special_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  lunch_time_start: string;
  lunch_time_end: string;
  created_at: string;
  updated_at: string;
}

export interface LunchboxBooking {
  id: string;
  child_id: string;
  parent_id: string;
  delivery_date: string;
  pickup_time: string;
  delivery_time: string;
  special_instructions?: string;
  is_recurring: boolean;
  recurring_pattern?: 'daily' | 'weekly';
  recurring_end_date?: string;
  status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  booking_id: string;
  delivery_staff_id: string;
  pickup_address: string;
  school_id: string;
  pickup_time_actual?: string;
  delivery_time_actual?: string;
  pickup_proof?: string;
  delivery_proof?: string;
  qr_code: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface DeliveryRoute {
  id: string;
  delivery_staff_id: string;
  date: string;
  deliveries: string[];
  optimized_route: any;
  total_distance: number;
  estimated_duration: number;
  status: 'planned' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  booking_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'daily' | 'weekly' | 'monthly';
  amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
}