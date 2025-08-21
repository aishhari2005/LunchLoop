import React from 'react';
import { 
  Home, 
  Calendar, 
  Truck, 
  School, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings,
  Package,
  MapPin,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { userProfile } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
    ];

    switch (userProfile?.role) {
      case 'parent':
        return [
          ...baseItems,
          { id: 'bookings', label: 'Book Lunch', icon: Calendar },
          { id: 'children', label: 'My Children', icon: Users },
          { id: 'tracking', label: 'Track Delivery', icon: MapPin },
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'history', label: 'History', icon: Clock },
        ];
      
      case 'delivery_staff':
        return [
          ...baseItems,
          { id: 'routes', label: 'My Routes', icon: Truck },
          { id: 'deliveries', label: 'Today\'s Deliveries', icon: Package },
          { id: 'scanner', label: 'QR Scanner', icon: Settings },
          { id: 'history', label: 'Delivery History', icon: Clock },
        ];
      
      case 'school_admin':
        return [
          ...baseItems,
          { id: 'expected', label: 'Expected Deliveries', icon: School },
          { id: 'verify', label: 'Verify Receipts', icon: Settings },
          { id: 'reports', label: 'School Reports', icon: BarChart3 },
        ];
      
      case 'system_admin':
        return [
          ...baseItems,
          { id: 'users', label: 'Manage Users', icon: Users },
          { id: 'schools', label: 'Manage Schools', icon: School },
          { id: 'routes', label: 'Route Management', icon: Truck },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'payments', label: 'Payment Management', icon: CreditCard },
          { id: 'settings', label: 'System Settings', icon: Settings },
        ];
      
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}