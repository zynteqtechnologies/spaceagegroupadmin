// app/providers.tsx
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { ModalProvider } from '@/context/ModalContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ModalProvider>
        {children}
      </ModalProvider>
    </AuthProvider>
  );
}