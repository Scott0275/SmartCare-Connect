"use client";
import { useEffect } from 'react';
import { registerSW } from '@/lib/pwa';
import { initNetworkMonitoring } from '@/lib/networkService';

export default function PWAWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerSW();
    initNetworkMonitoring();
  }, []);

  return <>{children}</>;
}