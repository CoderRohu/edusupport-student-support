import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { StaffDashboard } from './dashboards/StaffDashboard';
import { ManagerDashboard } from './dashboards/ManagerDashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'student') {
    return <StudentDashboard />;
  }

  if (user.role === 'staff') {
    return <StaffDashboard />;
  }

  return <ManagerDashboard />;
};
