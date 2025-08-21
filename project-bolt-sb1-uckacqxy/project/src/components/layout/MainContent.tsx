import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ParentDashboard } from '../dashboard/ParentDashboard';
import { DeliveryStaffDashboard } from '../dashboard/DeliveryStaffDashboard';
import { SchoolAdminDashboard } from '../dashboard/SchoolAdminDashboard';
import { SystemAdminDashboard } from '../dashboard/SystemAdminDashboard';
import { BookingForm } from '../booking/BookingForm';
import { ChildrenManagement } from '../children/ChildrenManagement';
import { DeliveryTracker } from '../tracking/DeliveryTracker';
import { PaymentManagement } from '../payment/PaymentManagement';
import { DeliveryRoutes } from '../delivery/DeliveryRoutes';
import { QRScanner } from '../scanner/QRScanner';
import { Reports } from '../reports/Reports';
import { UserManagement } from '../admin/UserManagement';
import { SchoolManagement } from '../admin/SchoolManagement';
import { Settings } from '../settings/Settings';

interface MainContentProps {
  activeTab: string;
}

export function MainContent({ activeTab }: MainContentProps) {
  const { userProfile } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        switch (userProfile?.role) {
          case 'parent': return <ParentDashboard />;
          case 'delivery_staff': return <DeliveryStaffDashboard />;
          case 'school_admin': return <SchoolAdminDashboard />;
          case 'system_admin': return <SystemAdminDashboard />;
          default: return <div>Access Denied</div>;
        }
      
      case 'bookings': return <BookingForm />;
      case 'children': return <ChildrenManagement />;
      case 'tracking': return <DeliveryTracker />;
      case 'payments': return <PaymentManagement />;
      case 'routes': return <DeliveryRoutes />;
      case 'scanner': return <QRScanner />;
      case 'reports': 
      case 'analytics': 
      case 'history': return <Reports />;
      case 'users': return <UserManagement />;
      case 'schools': return <SchoolManagement />;
      case 'settings': return <Settings />;
      
      default: return <div>Page not found</div>;
    }
  };

  return <div className="max-w-7xl mx-auto">{renderContent()}</div>;
}