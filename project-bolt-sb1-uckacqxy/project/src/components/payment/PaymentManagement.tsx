import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Payment, Subscription } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function PaymentManagement() {
  const { user, userProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);

  const subscriptionPlans = [
    { type: 'daily', amount: 50, description: 'Pay per delivery' },
    { type: 'weekly', amount: 300, description: '7 days delivery plan' },
    { type: 'monthly', amount: 1000, description: '30 days delivery plan (Best Value)' }
  ];

  useEffect(() => {
    if (user) {
      fetchPaymentData();
    }
  }, [user]);

  const fetchPaymentData = async () => {
    try {
      const [paymentsResponse, subscriptionResponse] = await Promise.all([
        supabase
          .from('payments')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .single()
      ]);

      if (paymentsResponse.data) setPayments(paymentsResponse.data);
      if (subscriptionResponse.data) setSubscription(subscriptionResponse.data);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async (planType: string, amount: number) => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      
      switch (planType) {
        case 'daily':
          endDate.setDate(startDate.getDate() + 1);
          break;
        case 'weekly':
          endDate.setDate(startDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(startDate.getMonth() + 1);
          break;
      }

      const subscriptionData = {
        user_id: user?.id,
        plan_type: planType,
        amount,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([subscriptionData]);

      if (subscriptionError) throw subscriptionError;

      // Create payment record
      const paymentData = {
        user_id: user?.id,
        amount,
        currency: 'INR',
        payment_method: 'card',
        status: 'completed',
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([paymentData]);

      if (paymentError) throw paymentError;

      toast.success('Subscription activated successfully!');
      setShowSubscriptionForm(false);
      fetchPaymentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process subscription');
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;
    
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', subscription.id);

      if (error) throw error;
      toast.success('Subscription cancelled successfully!');
      fetchPaymentData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        {userProfile?.role === 'parent' && (
          <Button onClick={() => setShowSubscriptionForm(true)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Subscription
          </Button>
        )}
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Active Subscription</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-medium text-gray-900 capitalize">
                  {subscription.plan_type} Plan
                </p>
                <p className="text-sm text-gray-600">
                  Valid until {formatDate(subscription.end_date)}
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  ₹{subscription.amount}
                </p>
              </div>
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowSubscriptionForm(true)}>
                  Upgrade Plan
                </Button>
                <Button variant="destructive" onClick={cancelSubscription}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      {showSubscriptionForm && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.type}
                  className={`border rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-colors ${
                    plan.type === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <h3 className="text-lg font-medium text-gray-900 capitalize mb-2">
                    {plan.type} Plan
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-4">₹{plan.amount}</p>
                  {plan.type === 'monthly' && (
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full inline-block mb-4">
                      Best Value
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => handleSubscription(plan.type, plan.amount)}
                  >
                    Choose {plan.type} Plan
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setShowSubscriptionForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      payment.status === 'completed' ? 'bg-green-50' :
                      payment.status === 'pending' ? 'bg-yellow-50' :
                      'bg-red-50'
                    }`}>
                      {payment.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : payment.status === 'pending' ? (
                        <Calendar className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        ₹{payment.amount} - {payment.payment_method}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(payment.transaction_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      payment.status === 'completed' ? 'bg-green-50 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {payment.status}
                    </span>
                    {payment.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        Download Receipt
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{payments.filter(p => 
                    new Date(p.transaction_date).getMonth() === new Date().getMonth()
                  ).reduce((sum, p) => sum + p.amount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}