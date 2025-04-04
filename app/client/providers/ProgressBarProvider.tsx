'use client';

import { ReactNode } from 'react';
import { ProgressBar } from '@/components/ProgressBar';
import { useFetchWithProgress } from '@/hooks/useFetchWithProgress';

interface ProgressBarProviderProps {
  children: ReactNode;
  delay?: number;
}

export const ProgressBarProvider = ({ 
  children, 
  delay = 300 
}: ProgressBarProviderProps) => {
  // Hook to intercept fetch requests and show progress
  useFetchWithProgress(delay);
  
  return (
    <>
      {/* Component for route changes */}
      <ProgressBar delay={delay} />
      {children}
    </>
  );
}; 