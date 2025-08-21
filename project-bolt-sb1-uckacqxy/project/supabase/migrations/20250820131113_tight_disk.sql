/*
  # Complete Lunchbox Delivery System Database Schema

  1. New Tables
    - `users` - User profiles for all system users (parents, delivery staff, school admin, system admin)
    - `schools` - School information and details
    - `children` - Child profiles linked to parents
    - `lunchbox_bookings` - Booking records for lunchbox deliveries
    - `deliveries` - Delivery tracking and management
    - `delivery_routes` - Optimized delivery routes for staff
    - `notifications` - System notifications for users
    - `payments` - Payment records and transactions
    - `subscriptions` - User subscription plans
    
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each user role
    - Secure data access based on user relationships
    
  3. Features
    - QR code generation for delivery tracking
    - Route optimization support
    - Recurring booking patterns
    - Payment integration ready
    - Comprehensive notification system
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('parent', 'delivery_staff', 'school_admin', 'system_admin')),
  full_name text NOT NULL,
  phone text NOT NULL,
  address text,
  school_id uuid,
  service_area text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  lunch_time_start time NOT NULL DEFAULT '12:00',
  lunch_time_end time NOT NULL DEFAULT '13:00',
  contact_person text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  class text NOT NULL,
  school_id uuid NOT NULL REFERENCES schools(id),
  allergies text,
  special_notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lunchbox bookings table
CREATE TABLE IF NOT EXISTS lunchbox_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  pickup_time time NOT NULL,
  delivery_time time NOT NULL,
  special_instructions text,
  is_recurring boolean DEFAULT false,
  recurring_pattern text CHECK (recurring_pattern IN ('daily', 'weekly') OR recurring_pattern IS NULL),
  recurring_end_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL REFERENCES lunchbox_bookings(id) ON DELETE CASCADE,
  delivery_staff_id uuid REFERENCES users(id),
  pickup_address text NOT NULL,
  school_id uuid NOT NULL REFERENCES schools(id),
  pickup_time_actual timestamptz,
  delivery_time_actual timestamptz,
  pickup_proof text,
  delivery_proof text,
  qr_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Delivery routes table
CREATE TABLE IF NOT EXISTS delivery_routes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  deliveries jsonb NOT NULL DEFAULT '[]',
  optimized_route jsonb,
  total_distance numeric,
  estimated_duration integer,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  related_booking_id uuid REFERENCES lunchbox_bookings(id),
  created_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES lunchbox_bookings(id),
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_id text,
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('daily', 'weekly', 'monthly')),
  amount numeric(10,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  auto_renew boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert sample schools
INSERT INTO schools (name, address, phone, email, contact_person) VALUES
('Delhi Public School', '123 Main Street, New Delhi', '+91-11-12345678', 'admin@dpsdelhi.com', 'Principal Sharma'),
('St. Mary School', '456 Park Avenue, Mumbai', '+91-22-87654321', 'contact@stmary.com', 'Sister Agnes'),
('Modern School', '789 Garden Road, Bangalore', '+91-80-11223344', 'info@modernschool.com', 'Dr. Rajesh Kumar')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunchbox_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
  );

-- RLS Policies for schools table
CREATE POLICY "Everyone can read schools" ON schools
  FOR SELECT USING (true);

CREATE POLICY "School admins can update own school" ON schools
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND school_id = schools.id AND role = 'school_admin')
  );

-- RLS Policies for children table
CREATE POLICY "Parents can manage own children" ON children
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "School admins can read children in their school" ON children
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND school_id = children.school_id AND role = 'school_admin')
  );

-- RLS Policies for lunchbox_bookings table
CREATE POLICY "Parents can manage own bookings" ON lunchbox_bookings
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "Delivery staff can read assigned bookings" ON lunchbox_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deliveries 
      WHERE deliveries.booking_id = lunchbox_bookings.id 
      AND deliveries.delivery_staff_id = auth.uid()
    )
  );

CREATE POLICY "School admins can read bookings for their school" ON lunchbox_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children 
      JOIN users ON users.id = auth.uid() 
      WHERE children.id = lunchbox_bookings.child_id 
      AND children.school_id = users.school_id 
      AND users.role = 'school_admin'
    )
  );

-- RLS Policies for deliveries table
CREATE POLICY "Delivery staff can manage assigned deliveries" ON deliveries
  FOR ALL USING (delivery_staff_id = auth.uid());

CREATE POLICY "Parents can read own deliveries" ON deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lunchbox_bookings 
      WHERE lunchbox_bookings.id = deliveries.booking_id 
      AND lunchbox_bookings.parent_id = auth.uid()
    )
  );

CREATE POLICY "School admins can read deliveries for their school" ON deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.school_id = deliveries.school_id 
      AND users.role = 'school_admin'
    )
  );

-- RLS Policies for delivery_routes table
CREATE POLICY "Delivery staff can manage own routes" ON delivery_routes
  FOR ALL USING (delivery_staff_id = auth.uid());

-- RLS Policies for notifications table
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for payments table
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System admins can read all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
  );

-- RLS Policies for subscriptions table
CREATE POLICY "Users can read own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_school_id ON children(school_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parent_id ON lunchbox_bookings(parent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_child_id ON lunchbox_bookings(child_id);
CREATE INDEX IF NOT EXISTS idx_bookings_delivery_date ON lunchbox_bookings(delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_booking_id ON deliveries(booking_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_staff_id ON deliveries(delivery_staff_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_qr_code ON deliveries(qr_code);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Drop existing policies on lunchbox_bookings
DROP POLICY IF EXISTS "Parents can manage own bookings" ON lunchbox_bookings;
DROP POLICY IF EXISTS "Delivery staff can read assigned bookings" ON lunchbox_bookings;
DROP POLICY IF EXISTS "School admins can read bookings for their school" ON lunchbox_bookings;

-- Drop policies on deliveries
DROP POLICY IF EXISTS "Delivery staff can manage assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Parents can read own deliveries" ON deliveries;
DROP POLICY IF EXISTS "School admins can read deliveries for their school" ON deliveries;

-- Drop policies on children
DROP POLICY IF EXISTS "Parents can manage own children" ON children;
DROP POLICY IF EXISTS "School admins can read children in their school" ON children;

-- Drop policies on users
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "System admins can manage all users" ON users;

-- Drop policies on schools
DROP POLICY IF EXISTS "Everyone can read schools" ON schools;
DROP POLICY IF EXISTS "School admins can update own school" ON schools;

-- Drop policies on delivery_routes
DROP POLICY IF EXISTS "Delivery staff can manage own routes" ON delivery_routes;

-- Drop policies on notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Drop policies on payments
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "System admins can read all payments" ON payments;

-- Drop policies on subscriptions
DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;

-- Now create updated policies

-- Users table policies
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System admins can manage all users" ON users
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
);

-- Schools table policies
CREATE POLICY "Everyone can read schools" ON schools
FOR SELECT USING (true);

CREATE POLICY "School admins can update own school" ON schools
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND school_id = schools.id AND role = 'school_admin')
);

-- Children table policies
CREATE POLICY "Parents can manage own children" ON children
FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "School admins can read children in their school" ON children
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND school_id = children.school_id AND role = 'school_admin'
  )
);

-- Lunchbox bookings table policies
CREATE POLICY "Parents can manage own bookings" ON lunchbox_bookings
FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "Delivery staff can read assigned bookings" ON lunchbox_bookings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM deliveries
    WHERE deliveries.booking_id = lunchbox_bookings.id
      AND deliveries.delivery_staff_id = auth.uid()
  )
);

CREATE POLICY "School admins can read bookings for their school" ON lunchbox_bookings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM children
    JOIN users ON users.id = auth.uid()
    WHERE children.id = lunchbox_bookings.child_id
      AND children.school_id = users.school_id
      AND users.role = 'school_admin'
  )
);

-- Deliveries table policies
CREATE POLICY "Delivery staff can manage assigned deliveries" ON deliveries
FOR ALL USING (delivery_staff_id = auth.uid());

CREATE POLICY "Parents can read own deliveries" ON deliveries
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lunchbox_bookings
    WHERE lunchbox_bookings.id = deliveries.booking_id
      AND lunchbox_bookings.parent_id = auth.uid()
  )
);

CREATE POLICY "School admins can read deliveries for their school" ON deliveries
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.school_id = deliveries.school_id AND users.role = 'school_admin'
  )
);

-- Delivery routes table policies
CREATE POLICY "Delivery staff can manage own routes" ON delivery_routes
FOR ALL USING (delivery_staff_id = auth.uid());

-- Notifications table policies
CREATE POLICY "Users can read own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- Payments table policies
CREATE POLICY "Users can read own payments" ON payments
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System admins can read all payments" ON payments
FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'system_admin')
);

-- Subscriptions table policies
CREATE POLICY "Users can read own subscriptions" ON subscriptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions
FOR UPDATE USING (user_id = auth.uid());
