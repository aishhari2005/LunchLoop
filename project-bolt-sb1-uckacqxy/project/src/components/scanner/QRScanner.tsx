import React, { useState, useRef, useEffect } from 'react';
import { Camera, Square, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export function QRScanner() {
  const { user, userProfile } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedDelivery, setScannedDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanning = () => {
    setScanning(true);
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    };

    scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false);
    
    scannerRef.current.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
        stopScanning();
      },
      (error) => {
        console.warn("QR scan error:", error);
      }
    );
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleScanSuccess = async (qrCode: string) => {
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
        .eq('qr_code', qrCode)
        .single();

      if (data) {
        setScannedDelivery(data);
        toast.success('QR code scanned successfully!');
      } else {
        toast.error('Invalid QR code');
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
      toast.error('Error processing QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanSuccess(manualCode.trim());
    }
  };

  const updateDeliveryStatus = async (status: string) => {
    if (!scannedDelivery) return;

    setLoading(true);
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add timestamp based on status
      if (status === 'picked_up') {
        updateData.pickup_time_actual = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivery_time_actual = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', scannedDelivery.id);

      if (error) throw error;

      // Update booking status as well
      const bookingStatus = status === 'delivered' ? 'delivered' : 
                           status === 'picked_up' ? 'picked_up' : 'in_transit';
      
      await supabase
        .from('lunchbox_bookings')
        .update({ status: bookingStatus, updated_at: new Date().toISOString() })
        .eq('id', scannedDelivery.booking_id);

      toast.success(`Delivery marked as ${status.replace('_', ' ')}!`);
      setScannedDelivery({ ...scannedDelivery, status });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update delivery status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-50';
      case 'in_transit': return 'text-blue-600 bg-blue-50';
      case 'picked_up': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
        {userProfile?.role === 'delivery_staff' && (
          <div className="flex space-x-4">
            {!scanning ? (
              <Button onClick={startScanning}>
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            ) : (
              <Button variant="outline" onClick={stopScanning}>
                Stop Scanning
              </Button>
            )}
          </div>
        )}
      </div>

      {/* QR Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Square className="h-5 w-5" />
            <span>Scan QR Code</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div id="qr-reader" className="w-full"></div>
          ) : (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Click "Start Scanning" to scan lunchbox QR codes
              </p>
            </div>
          )}

          {/* Manual Entry */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Entry</h3>
            <form onSubmit={handleManualSubmit} className="flex space-x-4">
              <Input
                placeholder="Enter QR code manually"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Submit'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Scanned Delivery Details */}
      {scannedDelivery && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Delivery Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Child Information</h4>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {scannedDelivery.lunchbox_bookings?.children?.name}</p>
                  <p><strong>Class:</strong> {scannedDelivery.lunchbox_bookings?.children?.class}</p>
                  <p><strong>School:</strong> {scannedDelivery.lunchbox_bookings?.schools?.name}</p>
                </div>

                {scannedDelivery.lunchbox_bookings?.children?.allergies && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <p className="text-sm font-medium text-orange-800">Allergies:</p>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      {scannedDelivery.lunchbox_bookings.children.allergies}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Delivery Information</h4>
                <div className="space-y-2">
                  <p><strong>QR Code:</strong> {scannedDelivery.qr_code}</p>
                  <p><strong>Expected Delivery:</strong> {scannedDelivery.lunchbox_bookings?.delivery_time}</p>
                  <p>
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(scannedDelivery.status)}`}>
                      {scannedDelivery.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>

                {scannedDelivery.lunchbox_bookings?.special_instructions && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-medium text-blue-800 mb-1">Special Instructions:</p>
                    <p className="text-sm text-blue-700">
                      {scannedDelivery.lunchbox_bookings.special_instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons for Delivery Staff */}
            {userProfile?.role === 'delivery_staff' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex space-x-4">
                  {scannedDelivery.status === 'assigned' && (
                    <Button 
                      onClick={() => updateDeliveryStatus('picked_up')}
                      disabled={loading}
                    >
                      Mark as Picked Up
                    </Button>
                  )}
                  
                  {scannedDelivery.status === 'picked_up' && (
                    <Button 
                      onClick={() => updateDeliveryStatus('in_transit')}
                      disabled={loading}
                    >
                      Start Transit
                    </Button>
                  )}
                  
                  {scannedDelivery.status === 'in_transit' && (
                    <Button 
                      onClick={() => updateDeliveryStatus('delivered')}
                      disabled={loading}
                      variant="secondary"
                    >
                      Mark as Delivered
                    </Button>
                  )}

                  {scannedDelivery.status === 'delivered' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Delivery Complete</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Square className="h-8 w-8 mx-auto mb-2" />
            <p>Your recent QR scans will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}