import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, User, Globe, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function Settings() {
  const { userProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    address: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    delivery_updates: true,
    payment_reminders: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    default_delivery_time: '12:00',
    booking_cutoff_hours: 12,
    max_bookings_per_day: 50,
    service_fee: 10,
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        full_name: userProfile.full_name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
      });
    }
  }, [userProfile]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email');
    }
  };

  const settingSections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  if (userProfile?.role === 'system_admin') {
    settingSections.push({ id: 'system', label: 'System', icon: Globe });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5" />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="space-y-2">
              {settingSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <Input
                    label="Full Name"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                  
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your complete address"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {key.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {key === 'email_notifications' && 'Receive updates via email'}
                          {key === 'sms_notifications' && 'Receive SMS notifications'}
                          {key === 'push_notifications' && 'Browser push notifications'}
                          {key === 'delivery_updates' && 'Real-time delivery status updates'}
                          {key === 'payment_reminders' && 'Payment due and receipt notifications'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="pt-6">
                  <Button>Save Notification Settings</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Password</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Keep your account secure with a strong password
                    </p>
                    <Button variant="outline" onClick={handlePasswordReset}>
                      Reset Password
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Email:</strong> {user?.email}
                      </p>
                      <p className="text-sm">
                        <strong>Role:</strong> {userProfile?.role?.replace('_', ' ')}
                      </p>
                      <p className="text-sm">
                        <strong>Account Created:</strong> {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'billing' && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Current Plan</h4>
                    <p className="text-sm text-gray-600">Pay-per-delivery (₹50 per delivery)</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Payment Methods</h4>
                    <p className="text-sm text-gray-600 mb-4">Manage your payment methods</p>
                    <Button variant="outline">Add Payment Method</Button>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Billing History</h4>
                    <p className="text-sm text-gray-600 mb-4">View and download your invoices</p>
                    <Button variant="outline">View History</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'system' && userProfile?.role === 'system_admin' && (
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    label="Default Delivery Time"
                    type="time"
                    value={systemSettings.default_delivery_time}
                    onChange={(e) => setSystemSettings(prev => ({ 
                      ...prev, 
                      default_delivery_time: e.target.value 
                    }))}
                  />
                  
                  <Input
                    label="Booking Cutoff Hours"
                    type="number"
                    value={systemSettings.booking_cutoff_hours}
                    onChange={(e) => setSystemSettings(prev => ({ 
                      ...prev, 
                      booking_cutoff_hours: parseInt(e.target.value) 
                    }))}
                  />
                  
                  <Input
                    label="Max Bookings Per Day"
                    type="number"
                    value={systemSettings.max_bookings_per_day}
                    onChange={(e) => setSystemSettings(prev => ({ 
                      ...prev, 
                      max_bookings_per_day: parseInt(e.target.value) 
                    }))}
                  />
                  
                  <Input
                    label="Service Fee (₹)"
                    type="number"
                    value={systemSettings.service_fee}
                    onChange={(e) => setSystemSettings(prev => ({ 
                      ...prev, 
                      service_fee: parseInt(e.target.value) 
                    }))}
                  />

                  <div className="pt-4">
                    <Button>Save System Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}