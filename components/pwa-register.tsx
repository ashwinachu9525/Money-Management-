"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully:", reg.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      });
    }

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted PWA installation");
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed top-2 left-2 right-2 sm:left-auto sm:right-4 z-[110] bg-blue-600 text-white p-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 max-w-sm animate-in slide-in-from-top-4 duration-300 border border-blue-400/30">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight truncate">Install Money Manager</p>
          <p className="text-[11px] opacity-90 leading-tight truncate">Add to Home Screen for app experience</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 text-xs font-semibold px-3 bg-white text-blue-600 hover:bg-blue-50"
          onClick={handleInstallClick}
        >
          Install
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
          onClick={() => setShowInstallBanner(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
