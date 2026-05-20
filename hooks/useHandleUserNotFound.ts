import { useCallback } from 'react';
import { router } from 'expo-router';
import { useUser } from '@/context/UserContext';

export function useHandleUserNotFound() {
  const { clearSession } = useUser();

  const handleError = useCallback(async (error: any) => {
    if (error?.shouldClearLocalSession) {
      await clearSession();
      router.replace('/onboarding');
    }
  }, [clearSession]);

  return { handleError };
}
