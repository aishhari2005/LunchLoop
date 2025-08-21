import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, AlertTriangle, Users, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { LunchboxBooking, Child, School } from '../../types';

export function ParentDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<LunchboxBooking[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch children
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user?.id);
      
      if (childrenData) setChildren(childrenData);

      // Fetch recent bookings
      const { data: bookingsData } = await supabase
        .from('lunchbox_bookings')
        .select('*')
        .eq('parent_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (bookingsData) setBookings(bookingsData);

      // Fetch schools
      const { data: schoolsData } = await supabase
        .from('schools')
        .select('*');
      
      if (schoolsData) setSchools(schoolsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'in_transit': return 'text-blue-600 bg-blue-50';
      case 'picked_up': return 'text-yellow-600 bg-yellow-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return CheckCircle;
      case 'in_transit': return Truck;
      case 'picked_up': return Package;
      case 'pending': return Clock;
      case 'cancelled': return AlertTriangle;
      default: return Clock;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
        <Button>Quick Book Lunch</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Children Registered</p>
                <p className="text-2xl font-bold text-gray-900">{children.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => b.status === 'delivered').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {bookings.filter(b => ['pending', 'confirmed', 'picked_up', 'in_transit'].includes(b.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Actions</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bookings yet. Start by booking your first lunch delivery!</p>
              <Button className="mt-4">Book Now</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const child = children.find(c => c.id === booking.child_id);
                const StatusIcon = getStatusIcon(booking.status);
                
                return (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(booking.status)}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{child?.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.delivery_date).toLocaleDateString()} at {booking.delivery_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                      <Button variant="outline" size="sm">
                        Track
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 text-blue-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Book Lunch</h3>
            <p className="text-sm text-gray-600">Schedule lunch delivery for your child</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-green-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Track Delivery</h3>
            <p className="text-sm text-gray-600">See real-time delivery status</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-purple-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Manage Children</h3>
            <p className="text-sm text-gray-600">Add or update child information</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}