import React, { useState, useEffect } from 'react';
import { Users, School, Truck, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function SystemAdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSchools: 0,
    totalDeliveries: 0,
    totalRevenue: 0,
    activeBookings: 0,
    completionRate: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch various statistics
      const [usersCount, schoolsCount, deliveriesCount, paymentsSum, bookingsCount] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('schools').select('id', { count: 'exact' }),
        supabase.from('deliveries').select('id', { count: 'exact' }),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('lunchbox_bookings').select('id', { count: 'exact' }).in('status', ['pending', 'confirmed', 'picked_up', 'in_transit'])
      ]);

      const totalRevenue = paymentsSum.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const completedDeliveries = await supabase.from('deliveries').select('id', { count: 'exact' }).eq('status', 'delivered');
      
      setStats({
        totalUsers: usersCount.count || 0,
        totalSchools: schoolsCount.count || 0,
        totalDeliveries: deliveriesCount.count || 0,
        totalRevenue,
        activeBookings: bookingsCount.count || 0,
        completionRate: deliveriesCount.count ? Math.round(((completedDeliveries.count || 0) / deliveriesCount.count) * 100) : 0
      });

      // Generate sample chart data (in real app, this would be from actual data)
      const mockChartData = [
        { name: 'Mon', bookings: 45, deliveries: 42 },
        { name: 'Tue', bookings: 52, deliveries: 49 },
        { name: 'Wed', bookings: 38, deliveries: 35 },
        { name: 'Thu', bookings: 61, deliveries: 58 },
        { name: 'Fri', bookings: 55, deliveries: 52 },
        { name: 'Sat', bookings: 28, deliveries: 25 },
        { name: 'Sun', bookings: 15, deliveries: 14 }
      ];
      setChartData(mockChartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
        <div className="flex space-x-4">
          <Button variant="outline">Export Data</Button>
          <Button>System Settings</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <School className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Schools</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSchools}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
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
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Bookings vs Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" />
                <Bar dataKey="deliveries" fill="#10B981" name="Deliveries" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="deliveries" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Manage Users</h3>
            <p className="text-sm text-gray-600">Add, edit, or remove system users</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <School className="h-8 w-8 text-green-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">School Management</h3>
            <p className="text-sm text-gray-600">Configure schools and settings</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Truck className="h-8 w-8 text-purple-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Route Optimization</h3>
            <p className="text-sm text-gray-600">Manage delivery routes and staff</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-indigo-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600">View detailed system analytics</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Database Status</p>
                <p className="text-xs text-gray-600">All systems operational</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Payment Gateway</p>
                <p className="text-xs text-gray-600">Connected and processing</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Notification Service</p>
                <p className="text-xs text-gray-600">Minor delays detected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}