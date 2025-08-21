import React, { useState, useEffect } from 'react';
import { School, Package, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [expectedDeliveries, setExpectedDeliveries] = useState([]);
  const [stats, setStats] = useState({
    expected: 0,
    received: 0,
    missing: 0,
    onTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First, get the school associated with this admin
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userData) {
        // Fetch today's expected deliveries for this school
        const { data: deliveries } = await supabase
          .from('deliveries')
          .select(`
            *,
            lunchbox_bookings:booking_id (
              *,
              children:child_id (*)
            )
          `)
          .eq('school_id', userData.school_id || '1') // Default school for demo
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);

        if (deliveries) {
          setExpectedDeliveries(deliveries);
          
          const expected = deliveries.length;
          const received = deliveries.filter(d => d.status === 'delivered').length;
          const missing = deliveries.filter(d => d.status === 'failed').length;
          const onTime = deliveries.filter(d => 
            d.status === 'delivered' && 
            new Date(d.delivery_time_actual) <= new Date(d.lunchbox_bookings.delivery_time)
          ).length;

          setStats({ expected, received, missing, onTime });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmReceipt = async (deliveryId: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ 
          status: 'delivered',
          delivery_time_actual: new Date().toISOString()
        })
        .eq('id', deliveryId);

      if (!error) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error confirming receipt:', error);
    }
  };

  const reportMissing = async (deliveryId: string) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update({ status: 'failed' })
        .eq('id', deliveryId);

      if (!error) {
        fetchDashboardData();
        // Send notification to parent
        // This would trigger a notification in a real system
      }
    } catch (error) {
      console.error('Error reporting missing lunchbox:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">School Dashboard</h1>
        <Button>Export Report</Button>
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
                <p className="text-sm font-medium text-gray-600">Expected Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expected}</p>
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
                <p className="text-sm font-medium text-gray-600">Received</p>
                <p className="text-2xl font-bold text-gray-900">{stats.received}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Missing</p>
                <p className="text-2xl font-bold text-gray-900">{stats.missing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">On Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.onTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expected Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Expected Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          {expectedDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No deliveries expected today.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expectedDeliveries.map((delivery: any) => (
                <div key={delivery.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      delivery.status === 'delivered' ? 'bg-green-50' :
                      delivery.status === 'failed' ? 'bg-red-50' :
                      delivery.status === 'in_transit' ? 'bg-blue-50' :
                      'bg-gray-50'
                    }`}>
                      {delivery.status === 'delivered' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                       delivery.status === 'failed' ? <AlertTriangle className="h-5 w-5 text-red-600" /> :
                       delivery.status === 'in_transit' ? <Package className="h-5 w-5 text-blue-600" /> :
                       <Clock className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {delivery.lunchbox_bookings?.children?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Class: {delivery.lunchbox_bookings?.children?.class}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expected: {delivery.lunchbox_bookings?.delivery_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      delivery.status === 'delivered' ? 'bg-green-50 text-green-700' :
                      delivery.status === 'failed' ? 'bg-red-50 text-red-700' :
                      delivery.status === 'in_transit' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                    
                    {delivery.status === 'in_transit' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => confirmReceipt(delivery.id)}
                        >
                          Confirm Receipt
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => reportMissing(delivery.id)}
                        >
                          Report Missing
                        </Button>
                      </>
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