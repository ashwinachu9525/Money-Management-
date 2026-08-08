"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2, Smartphone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from "@/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export function NotificationPopover() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasPushPermission, setHasPushPermission] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPushPermission(Notification.permission === "granted");
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read");
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    setNotifications([]);
    toast.success("Notifications cleared");
  };

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser does not support desktop/mobile notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setHasPushPermission(true);
      toast.success("Push notifications enabled!");

      // Send a test push notification
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification("Money Manager Notifications Enabled", {
            body: "You will now receive bill payment reminders and budget alerts on your device!",
            icon: "/icon-192.png",
          });
        });
      } else {
        new Notification("Money Manager Notifications Enabled", {
          body: "You will now receive bill payment reminders and budget alerts on your device!",
          icon: "/icon-192.png",
        });
      }
    } else {
      toast.error("Notification permission denied by browser settings.");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            title="Notifications"
          />
        }
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 z-[100] border-zinc-200 dark:border-zinc-800 shadow-xl"
      >
        <div className="flex items-center justify-between border-b p-3 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-1.5">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Read All
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700"
                onClick={handleClearAll}
                title="Clear all notifications"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Push notification banner */}
        {!hasPushPermission && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <p className="text-[11px] text-blue-900 dark:text-blue-200 leading-tight truncate">
                Get payment alerts on mobile home screen
              </p>
            </div>
            <Button
              size="sm"
              className="h-7 text-[11px] px-2.5 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              onClick={requestPushPermission}
            >
              Enable Push
            </Button>
          </div>
        )}

        {/* Notification List */}
        <div className="max-h-80 overflow-y-auto divide-y">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                className={`p-3 text-xs transition-colors cursor-pointer flex items-start gap-2.5 ${
                  n.isRead
                    ? "bg-white dark:bg-zinc-950 text-muted-foreground opacity-80"
                    : "bg-blue-50/50 dark:bg-blue-950/20 text-foreground font-medium"
                } hover:bg-zinc-100 dark:hover:bg-zinc-900`}
              >
                <AlertCircle
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    n.isRead ? "text-muted-foreground" : "text-blue-600 dark:text-blue-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs leading-snug">{n.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              <Bell className="h-8 w-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
              No new notifications right now
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
