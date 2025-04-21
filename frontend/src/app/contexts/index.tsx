'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppProvider } from './AppContext';
import { CoursesProvider } from './CoursesContext';
import { SchedulingProvider } from './SchedulingContext';
import { PaymentsProvider } from './PaymentsContext';

interface ProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<ProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <AppProvider>
        <CoursesProvider>
          <SchedulingProvider>
            <PaymentsProvider>
              {children}
            </PaymentsProvider>
          </SchedulingProvider>
        </CoursesProvider>
      </AppProvider>
    </AuthProvider>
  );
};

export { useAuth } from './AuthContext';
export { useApp } from './AppContext';
export { useCourses } from './CoursesContext';
export { useScheduling } from './SchedulingContext';
export { usePayments } from './PaymentsContext';