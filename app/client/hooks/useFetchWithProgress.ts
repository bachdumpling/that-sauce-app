import { useEffect, useRef } from 'react';
import { startFetchProgress } from '@/components/ProgressBar';

export const useFetchWithProgress = (delay = 300) => {
  const originalFetch = useRef<typeof fetch | null>(null);

  useEffect(() => {
    // Store the original fetch
    if (!originalFetch.current) {
      originalFetch.current = window.fetch;
    }

    // Override fetch with our own implementation
    window.fetch = async (...args) => {
      // Start the progress bar with delay
      const stopProgress = startFetchProgress(delay);
      
      try {
        // Call the original fetch
        const response = await originalFetch.current!(...args);
        // Stop the progress bar
        stopProgress();
        return response;
      } catch (error) {
        // Make sure to stop the progress bar even if there's an error
        stopProgress();
        throw error;
      }
    };

    // Restore the original fetch when the component unmounts
    return () => {
      if (originalFetch.current) {
        window.fetch = originalFetch.current;
      }
    };
  }, [delay]);
}; 