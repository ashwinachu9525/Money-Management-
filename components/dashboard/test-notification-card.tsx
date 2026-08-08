"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Smartphone, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { createTestNotification } from "@/actions/notifications";
import { sendMonthlyReportViaEmail } from "@/actions/email-reports";
import { toast } from "sonner";

export function TestNotificationCard() {
  const [inAppLoading, setInAppLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const handleTestInApp = async () => {
    setInAppLoading(true);
    try {
      const res = await createTestNotification();
      if (res.success) {
        toast.success("In-app test notification created! Check the bell icon at the top right.");
      } else {
        toast.error("Failed to create test notification");
      }
    } catch (error) {
      toast.error("Error creating test notification");
    } finally {
      setInAppLoading(false);
    }
  };

  const handleTestPush = async () => {
    setPushLoading(true);
    try {
      if (!("Notification" in window)) {
        toast.error("Browser does not support notifications.");
        return;
      }

      let permission = Notification.permission;
      if (permission !== "granted") {
        permission = await Notification.requestPermission();
      }

      if (permission === "granted") {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification("🔔 Test Push Notification - Money Manager", {
            body: "Push notifications are active and working on your device!",
            icon: "/icon-192.png",
          });
        } else {
          new Notification("🔔 Test Push Notification - Money Manager", {
            body: "Push notifications are active and working on your device!",
            icon: "/icon-192.png",
          });
        }
        toast.success("Native push notification sent to your device!");
      } else {
        toast.error("Notification permission denied by browser settings.");
      }
    } catch (error) {
      toast.error("Failed to send push notification.");
    } finally {
      setPushLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailLoading(true);
    try {
      const now = new Date();
      const res = await sendMonthlyReportViaEmail(now.getMonth(), now.getFullYear());
      if (res.success) {
        toast.success(`Test email report sent via Yahoo SMTP to ${res.recipient}!`);
      } else {
        toast.error(res.error || "Failed to send test email");
      }
    } catch (error) {
      toast.error("Error sending test email");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <Card className="md:col-span-2 border-purple-200 dark:border-purple-900 bg-gradient-to-r from-purple-50/40 to-indigo-50/40 dark:from-purple-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
          <Bell className="h-5 w-5" />
          Notification & Alert Testing
        </CardTitle>
        <CardDescription>
          Verify that your In-App Bell alerts, Web Push notifications, and Yahoo SMTP Email reports are functioning properly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            onClick={handleTestInApp}
            disabled={inAppLoading}
            variant="outline"
            className="gap-2 justify-start border-purple-200 dark:border-purple-800 hover:bg-purple-100/50 dark:hover:bg-purple-900/30"
          >
            {inAppLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            ) : (
              <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            )}
            Test In-App Bell
          </Button>

          <Button
            onClick={handleTestPush}
            disabled={pushLoading}
            variant="outline"
            className="gap-2 justify-start border-blue-200 dark:border-blue-800 hover:bg-blue-100/50 dark:hover:bg-blue-900/30"
          >
            {pushLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            )}
            Test Web Push
          </Button>

          <Button
            onClick={handleTestEmail}
            disabled={emailLoading}
            variant="outline"
            className="gap-2 justify-start border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30"
          >
            {emailLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
            Test SMTP Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
