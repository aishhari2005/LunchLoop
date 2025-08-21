import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Clock, Package, Navigation, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { DeliveryRoute, Delivery } from '../../types';
import { formatTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export function DeliveryRoutes() {
  const { user, userProfile } = useAuth();
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [currentRoute, setCurrentRoute] = useState<DeliveryRoute | null>(null);
  const [todayDeliveries, setTodayDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRoutes();
      fetchTodayDeliveries();
    }
  }, [user]);

  const fetchRoutes = async () => {
    try {
      const { data } = await supabase
        .from('delivery_routes')
        .select('*')
        .eq('delivery_staff_id', user?.id)
        .order('created_at', { ascending: false });

      if (data) {
        setRoutes(data);
        const activeRoute = data.find(r => r.status === 'in_progress');
        if (activeRoute) setCurrentRoute(activeRoute);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchTodayDeliveries = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
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
        .lt('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: true });

      if (data) setTodayDeliveries(data);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRoute = async () => {
    try {
      const routeData = {
        delivery_staff_id: user?.id,
        date: new Date().toISOString().split('T')[0],
        deliveries: JSON.stringify(todayDeliveries.map(d => d.id)),
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('delivery_routes')
        .insert([routeData])
        .select()
        .single();

      if (error) throw error;
      setCurrentRoute(data);
      toast.success('Route started successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start route');
    }
  };

  const completeRoute = async () => {
    if (!currentRoute) return;

    try {
      const { error } = await supabase
        .from('delivery_routes')
        .update({ 
          status: 'completed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', currentRoute.id);

      if (error) throw error;
      setCurrentRoute(null);
      toast.success('Route completed successfully!');
      fetchRoutes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete route');
    }
  };

  const optimizeRoute = () => {
    // In a real application, this would call a route optimization service
    const optimizedDeliveries = [...todayDeliveries].sort((a, b) => {
      // Simple optimization: sort by school location (in real app, use proper algorithm)
      return a.lunchbox_bookings?.schools?.name.localeCompare(b.lunchbox_bookings?.schools?.name) || 0;
    });
    
    setTodayDeliveries(optimizedDeliveries);
    toast.success('Route optimized for efficiency!');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {userProfile?.role === 'delivery_staff' ? 'My Routes' : 'Route Management'}
        </h1>
        <div className="flex space-x-4">
          {todayDeliveries.length > 0 && (
            <Button variant="outline" onClick={optimizeRoute}>
              <Navigation className="h-4 w-4 mr-2" />
              Optimize Route
            </Button>
          )}
          {!currentRoute && todayDeliveries.length > 0 && (
            <Button onClick={startRoute}>
              <Truck className="h-4 w-4 mr-2" />
              Start Route
            </Button>
          )}
          {currentRoute && (
            <Button variant="secondary" onClick={completeRoute}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Route
            </Button>
          )}
        </div>
      </div>

      {/* Current Route Status */}
      {currentRoute && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Active Route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700">
                  Route started: {new Date(currentRoute.created_at).toLocaleTimeString()}
                </p>
                <p className="text-sm text-blue-700">
                  Total deliveries: {todayDeliveries.length}
                </p>
                <p className="text-sm text-blue-700">
                  Completed: {todayDeliveries.filter(d => d.status === 'delivered').length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-900">
                  {Math.round((todayDeliveries.filter(d => d.status === 'delivered').length / todayDeliveries.length) * 100)}%
                </p>
                <p className="text-sm text-blue-700">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Today's Deliveries</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No deliveries scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayDeliveries.map((delivery, index) => (
                <div
                  key={delivery.id}
                  className={`p-4 rounded-lg border ${
                    delivery.status === 'delivered' 
                      ? 'border-green-200 bg-green-50' 
                      : currentRoute && delivery.status === 'in_transit'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                        delivery.status === 'delivered' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div>
                        <p className="font-medium text-gray-900">
                          {delivery.lunchbox_bookings?.children?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {delivery.lunchbox_bookings?.schools?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expected: {formatTime(delivery.lunchbox_bookings?.delivery_time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                          delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          delivery.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          delivery.status === 'picked_up' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {delivery.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Open maps with delivery address
                            const query = encodeURIComponent(delivery.lunchbox_bookings?.schools?.address || '');
                            window.open(`https://maps.google.com/maps?q=${query}`, '_blank');
                          }}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {delivery.lunchbox_bookings?.special_instructions && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>Special Instructions:</strong> {delivery.lunchbox_bookings.special_instructions}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Stops</p>
                <p className="text-2xl font-bold text-gray-900">{todayDeliveries.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">
                  {todayDeliveries.filter(d => d.status === 'delivered').length}
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
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayDeliveries.filter(d => ['picked_up', 'in_transit'].includes(d.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Navigation className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Est. Distance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentRoute?.total_distance ? `${currentRoute.total_distance}km` : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route History */}
      <Card>
        <CardHeader>
          <CardTitle>Route History</CardTitle>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-8">
              <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No route history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {routes.slice(0, 5).map((route) => (
                <div key={route.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(route.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {JSON.parse(route.deliveries).length} deliveries
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      route.status === 'completed' ? 'bg-green-50 text-green-700' :
                      route.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {route.status.replace('_', ' ')}
                    </span>
                    {route.total_distance && (
                      <span className="text-sm text-gray-600">
                        {route.total_distance}km
                      </span>
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