"use client";
import { useEffect } from 'react';
import { registerSW } from '@/lib/pwa';

export default function PWAWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerSW();
  }, []);

  return <>{children}</>;
}