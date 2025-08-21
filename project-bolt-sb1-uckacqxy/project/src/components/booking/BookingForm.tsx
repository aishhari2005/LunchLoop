import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Child, School } from '../../types';
import { generateQRCode } from '../../lib/utils';
import toast from 'react-hot-toast';

export function BookingForm() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    child_id: '',
    delivery_date: '',
    pickup_time: '08:00',
    delivery_time: '12:00',
    special_instructions: '',
    is_recurring: false,
    recurring_pattern: 'daily' as const,
    recurring_end_date: '',
  });

  useEffect(() => {
    if (user) {
      fetchChildren();
      fetchSchools();
    }
  }, [user]);

  const fetchChildren = async () => {
    const { data } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', user?.id);
    
    if (data) setChildren(data);
  };

  const fetchSchools = async () => {
    const { data } = await supabase
      .from('schools')
      .select('*');
    
    if (data) setSchools(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const child = children.find(c => c.id === formData.child_id);
      if (!child) throw new Error('Please select a child');

      const bookingData = {
        child_id: formData.child_id,
        parent_id: user?.id,
        delivery_date: formData.delivery_date,
        pickup_time: formData.pickup_time,
        delivery_time: formData.delivery_time,
        special_instructions: formData.special_instructions,
        is_recurring: formData.is_recurring,
        recurring_pattern: formData.is_recurring ? formData.recurring_pattern : null,
        recurring_end_date: formData.is_recurring ? formData.recurring_end_date : null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: booking, error: bookingError } = await supabase
        .from('lunchbox_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create delivery record
      const deliveryData = {
        booking_id: booking.id,
        pickup_address: `Parent address for ${child.name}`, // In real app, get from parent profile
        school_id: child.school_id,
        qr_code: generateQRCode(),
        status: 'assigned',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert([deliveryData]);

      if (deliveryError) throw deliveryError;

      toast.success('Booking created successfully!');
      
      // Reset form
      setFormData({
        child_id: '',
        delivery_date: '',
        pickup_time: '08:00',
        delivery_time: '12:00',
        special_instructions: '',
        is_recurring: false,
        recurring_pattern: 'daily',
        recurring_end_date: '',
      });
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Book Lunchbox Delivery</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Child Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Child
              </label>
              <select
                value={formData.child_id}
                onChange={(e) => setFormData(prev => ({ ...prev, child_id: e.target.value }))}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a child</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name} - {child.class}
                  </option>
                ))}
              </select>
              {children.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Please add a child profile first
                </p>
              )}
            </div>

            {/* Delivery Date */}
            <Input
              label="Delivery Date"
              type="date"
              value={formData.delivery_date}
              onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
              min={minDate}
              required
            />

            {/* Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Pickup Time"
                type="time"
                value={formData.pickup_time}
                onChange={(e) => setFormData(prev => ({ ...prev, pickup_time: e.target.value }))}
                required
              />
              <Input
                label="Delivery Time"
                type="time"
                value={formData.delivery_time}
                onChange={(e) => setFormData(prev => ({ ...prev, delivery_time: e.target.value }))}
                required
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={formData.special_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
                rows={3}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Keep food hot, child allergic to nuts, etc."
              />
            </div>

            {/* Recurring Options */}
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_recurring: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="recurring" className="ml-2 text-sm font-medium text-gray-700">
                  Make this a recurring booking
                </label>
              </div>

              {formData.is_recurring && (
                <div className="ml-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat Pattern
                    </label>
                    <select
                      value={formData.recurring_pattern}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring_pattern: e.target.value as any }))}
                      className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  
                  <Input
                    label="End Date"
                    type="date"
                    value={formData.recurring_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurring_end_date: e.target.value }))}
                    min={formData.delivery_date || minDate}
                    required={formData.is_recurring}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
              <Button type="submit" disabled={loading || children.length === 0}>
                {loading ? 'Creating...' : 'Book Delivery'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Quick Book Options */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Book Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {children.map((child) => (
            <Card key={child.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{child.name}</p>
                    <p className="text-sm text-gray-600">{child.class}</p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-3" 
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      child_id: child.id,
                      delivery_date: tomorrow.toISOString().split('T')[0]
                    }));
                  }}
                >
                  Quick Book Tomorrow
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}