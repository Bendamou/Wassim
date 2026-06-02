import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendReading, MonitorPayload, MonitorResponse } from '../lib/api';

export function usePulse() {
  const [readings, setReadings] = useState<MonitorResponse[]>([]);
  
  const monitorMutation = useMutation({
    mutationFn: sendReading,
    onSuccess: (data) => {
      setReadings(prev => {
        const newReadings = [...prev, data];
        if (newReadings.length > 20) {
          return newReadings.slice(newReadings.length - 20);
        }
        return newReadings;
      });
    }
  });

  const submitReading = useCallback((payload: MonitorPayload) => {
    monitorMutation.mutate(payload);
  }, [monitorMutation]);

  return {
    readings,
    submitReading,
    isSubmitting: monitorMutation.isPending,
    latestReading: readings[readings.length - 1] || null
  };
}
