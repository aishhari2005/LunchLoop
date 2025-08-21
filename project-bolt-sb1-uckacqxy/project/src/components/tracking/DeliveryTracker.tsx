import React, { useState, useEffect } from 'react';
import { MapPin, Package, Truck, School, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import QRCode from 'react-qr-code';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { formatTime } from '../../lib/utils';

export function DeliveryTracker() {
  const { user, userProfile } = useAuth();
  const [trackingId, setTrackingId] = useState('');
  const [delivery, setDelivery] = useState<any>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && userProfile?.role === 'parent') {
      fetchActiveDeliveries();
    }
  }, [user, userProfile]);

  const fetchActiveDeliveries = async () => {
    try {
      const { data } = await supabase
        .from('deliveries')
        .select(`
          *,
          lunchbox_bookings:booking_id (
            *,
            children:child_id (*)
          )
        `)
        .eq('lunchbox_bookings.parent_id', user?.id)
        .in('status', ['assigned', 'picked_up', 'in_transit'])
        .order('created_at', { ascending: false });

      if (data) setActiveDeliveries(data);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    }
  };

  const trackDelivery = async () => {
    if (!trackingId) return;
    
    setLoading(true);
    try {
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
        .eq('qr_code', trackingId)
        .single();

      if (data) {
        setDelivery(data);
      } else {
        alert('Delivery not found');
      }
    } catch (error) {
      console.error('Error tracking delivery:', error);
      alert('Error tracking delivery');
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = (currentStatus: string) => {
    const steps = [
      { id: 'assigned', label: 'Order Confirmed', icon: CheckCircle },
      { id: 'picked_up', label: 'Picked Up', icon: Package },
      { id: 'in_transit', label: 'In Transit', icon: Truck },
      { id: 'delivered', label: 'Delivered', icon: School }
    ];

    const currentIndex = steps.findIndex(step => step.id === currentStatus);
    
    return steps.map((step, index) => ({
      ...step,
      isActive: index <= currentIndex,
      isCurrent: index === currentIndex
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Track Your Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Input
              placeholder="Enter QR Code or Tracking ID"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={trackDelivery} disabled={loading}>
              {loading ? 'Tracking...' : 'Track'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeDeliveries.map((activeDelivery) => (
                <div 
                  key={activeDelivery.id}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setDelivery(activeDelivery)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {activeDelivery.lunchbox_bookings?.children?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Delivery Time: {formatTime(activeDelivery.lunchbox_bookings?.delivery_time)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Tracking: {activeDelivery.qr_code}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      activeDelivery.status === 'in_transit' ? 'bg-blue-50 text-blue-700' :
                      activeDelivery.status === 'picked_up' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>
                      {activeDelivery.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Details */}
      {delivery && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {getStatusSteps(delivery.status).map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          step.isActive 
                            ? step.isCurrent 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${step.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                            {step.label}
                          </p>
                          {step.isActive && step.id !== 'assigned' && (
                            <p className="text-sm text-gray-600">
                              {step.id === 'picked_up' && delivery.pickup_time_actual && 
                                `Picked up at ${formatTime(delivery.pickup_time_actual)}`}
                              {step.id === 'delivered' && delivery.delivery_time_actual && 
                                `Delivered at ${formatTime(delivery.delivery_time_actual)}`}
                            </p>
                          )}
                        </div>
                        {index < getStatusSteps(delivery.status).length - 1 && (
                          <div className={`w-px h-8 ml-5 ${step.isActive ? 'bg-green-600' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Child</p>
                  <p className="text-gray-900">{delivery.lunchbox_bookings?.children?.name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">School</p>
                  <p className="text-gray-900">{delivery.lunchbox_bookings?.schools?.name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Expected Delivery</p>
                  <p className="text-gray-900">
                    {formatTime(delivery.lunchbox_bookings?.delivery_time)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">QR Code</p>
                  <div className="flex justify-center p-4 bg-white border rounded-lg">
                    <QRCode value={delivery.qr_code} size={120} />
                  </div>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    {delivery.qr_code}
                  </p>
                </div>

                {delivery.special_instructions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Special Instructions</p>
                    <p className="text-gray-900 text-sm">
                      {delivery.lunchbox_bookings?.special_instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Real-time Updates */}
      {delivery && (
        <Card>
          <CardHeader>
            <CardTitle>Live Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-600">
                  {new Date().toLocaleTimeString()} - Tracking information updated
                </span>
              </div>
              
              {delivery.status === 'in_transit' && (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-gray-600">
                    Driver is en route to school (ETA: 5-10 minutes)
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}