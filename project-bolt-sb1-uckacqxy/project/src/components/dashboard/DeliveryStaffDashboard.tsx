import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function DeliveryStaffDashboard() {
  const { user } = useAuth();
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    inTransit: 0,
    completed: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch today's deliveries
      const today = new Date().toISOString().split('T')[0];
      
      const { data: deliveries } = await supabase
        .from('deliveries')
        .select(`
          *,
          lunchbox_bookings:booking_id (
            *,
            children:child_id (*),
            schools:school_id (*)
          )
        `)
        .eq('delivery_staff_id', user?.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (deliveries) {
        setTodayDeliveries(deliveries);
        
        // Calculate stats
        const pending = deliveries.filter(d => d.status === 'assigned').length;
        const inTransit = deliveries.filter(d => ['picked_up', 'in_transit'].includes(d.status)).length;
        const completed = deliveries.filter(d => d.status === 'delivered').length;
        
        setStats({
          pending,
          inTransit,
          completed,
          totalEarnings: completed * 50 // ₹50 per delivery
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          status,
          [`${status}_time_actual`]: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (!error) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Dashboard</h1>
        <Button>Start Route</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inTransit}</p>
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
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {todayDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No deliveries scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayDeliveries.map((delivery: any) => (
                <div key={delivery.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {delivery.lunchbox_bookings?.children?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {delivery.lunchbox_bookings?.schools?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        QR: {delivery.qr_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      delivery.status === 'delivered' ? 'bg-green-50 text-green-700' :
                      delivery.status === 'in_transit' ? 'bg-blue-50 text-blue-700' :
                      delivery.status === 'picked_up' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                    {delivery.status === 'assigned' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                      >
                        Mark Picked Up
                      </Button>
                    )}
                    {delivery.status === 'picked_up' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                      >
                        Start Transit
                      </Button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                      >
                        Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}