"use client";

import { Bell, ExternalLink, X } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { notificationApi, Notification, getNotificationImageUrl } from "@/lib/api";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.ilmify-edu.uz";

export function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await notificationApi.getUserNotifications(user.id);
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (error) {
      console.error("Bildirishnomalarni yuklashda xatolik:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // WebSocket real-time connection
  useEffect(() => {
    if (!user?.id) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') || 'student' : 'student';

    const socket = io(SOCKET_URL, {
      query: { userId: String(user.id), role, token: token || '' },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[NotifSocket] Connected');
    });

    socket.on('notification', (data: Notification) => {
      setNotifications(prev => {
        const exists = prev.some(n => n.id === data.id);
        if (exists) return prev;
        return [data, ...prev].slice(0, 100);
      });
      setUnreadCount(prev => prev + 1);
    });

    socket.on('connect_error', (err) => {
      console.error('[NotifSocket] Error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  const markAllAsRead = async () => {
    if (!user?.id) return;
    const unreadIds = notifications.filter((n) => !n.is_read);
    if (unreadIds.length === 0) return;
    try {
      const role = typeof window !== 'undefined' ? localStorage.getItem('role') || 'student' : 'student';
      await notificationApi.markAllAsRead(user.id, role);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Barchasini o‘qilgan deb belgilashda xatolik:", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const openDetail = (n: Notification) => {
    setSelectedNotif(n);
    setOpen(false);
    if (!n.is_read) markAsRead(n.id);
  };

  useEffect(() => {
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  }, [open]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-96 p-0 shadow-xl rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80 rounded-t-xl">
            <h3 className="text-base font-semibold text-gray-900">Bildirishnomalar</h3>
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                {unreadCount} ta yangi
              </span>
            )}
          </div>

          <ScrollArea className="h-[32rem] max-h-[70vh]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-gray-500">
                Yuklanmoqda...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-sm text-gray-500">
                <Bell className="h-8 w-8 text-gray-300 mb-2" />
                <span>Bildirishnomalar yo‘q</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const imageUrl = getNotificationImageUrl(notification.image);
                  const timeAgo = formatDistanceToNow(
                    new Date(notification.createdAt),
                    { addSuffix: true, locale: uz }
                  );

                  return (
                    <div
                      key={notification.id}
                      onClick={() => openDetail(notification)}
                      className={`
                        p-5 transition-all hover:bg-gray-50/80 cursor-pointer
                        ${!notification.is_read ? "bg-blue-50/40" : ""}
                      `}
                    >
                      <div className="flex gap-4">
                        {imageUrl && (
                          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                            <Image
                              src={imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                            )}
                          </div>

                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {notification.description}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-gray-400">
                              {timeAgo}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Notification Detail Modal */}
      <Dialog open={!!selectedNotif} onOpenChange={(open) => { if (!open) setSelectedNotif(null); }}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg text-gray-900">
              {selectedNotif?.title || 'Bildirishnoma'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              {selectedNotif?.createdAt ? formatDistanceToNow(
                new Date(selectedNotif.createdAt),
                { addSuffix: true, locale: uz }
              ) : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedNotif?.image && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={getNotificationImageUrl(selectedNotif.image) || ''}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="py-3">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {selectedNotif?.description || 'Tavsif mavjud emas'}
            </p>
          </div>
          <DialogFooter className="gap-2">
            {selectedNotif?.link && (
              <Button
                onClick={() => {
                  window.open(selectedNotif.link, '_blank');
                  setSelectedNotif(null);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" /> Ko'rish
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedNotif(null)}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
