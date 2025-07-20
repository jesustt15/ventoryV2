

import { decrypt } from '@/lib/auth';
import { useSession } from 'next-auth/react';

export const useIsAdmin = () => {
  const { data: session } = useSession();
  return session?.role === 'admin';
};