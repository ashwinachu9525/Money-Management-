"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, CheckCircle, Download } from "lucide-react";

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("To install Money Manager on iOS:\n1. Tap the Share button in Safari\n2. Select 'Add to Home Screen'\n\nOn Android/Desktop:\nUse the browser menu and click 'Install App' or 'Add to Home Screen'.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium pt-2">
        <CheckCircle className="h-4 w-4" />
        App is installed & running in Standalone mode
      </div>
    );
  }

  return (
    <Button
      onClick={handleInstall}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium gap-2"
    >
      <Smartphone className="h-4 w-4" />
      Install App on Device
    </Button>
  );
}
