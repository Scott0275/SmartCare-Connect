"use client";
import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Install SmartCare Connect</div>
          <div className="text-sm opacity-90">Add to home screen for quick access</div>
        </div>
        <div className="flex space-x-2">
          <button onClick={handleInstall} className="bg-white text-blue-600 px-3 py-1 rounded text-sm">
            Install
          </button>
          <button onClick={() => setShowPrompt(false)} className="text-white/80 text-sm">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}