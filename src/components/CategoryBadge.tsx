import React from 'react';
import {
  CreditCard,
  CalendarCheck,
  BadgeCheck,
  FileCheck,
  FileText,
  GraduationCap,
  Wrench,
  Home,
  Bus,
  HelpCircle,
} from 'lucide-react';
import { TicketCategory } from '../types';

interface CategoryBadgeProps {
  category: TicketCategory;
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, showIcon = true }) => {
  const getIcon = () => {
    if (!showIcon) return null;
    const cls = 'w-3.5 h-3.5 text-slate-500';
    switch (category) {
      case 'Fees':
        return <CreditCard className={cls} />;
      case 'Attendance':
        return <CalendarCheck className={cls} />;
      case 'ID Card':
        return <BadgeCheck className={cls} />;
      case 'Certificate':
        return <FileCheck className={cls} />;
      case 'Documents':
        return <FileText className={cls} />;
      case 'Examination':
        return <GraduationCap className={cls} />;
      case 'Technical Support':
        return <Wrench className={cls} />;
      case 'Hostel':
        return <Home className={cls} />;
      case 'Transport':
        return <Bus className={cls} />;
      default:
        return <HelpCircle className={cls} />;
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
      {getIcon()}
      <span>{category}</span>
    </span>
  );
};
