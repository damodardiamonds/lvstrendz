
"use client";

import { LogOut, Bell, CheckCheck, AlertTriangle, ShoppingCart, MessageSquare, ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email: string;
  };
}

interface NotificationItem {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
  href: string;
  createdAt: string;
  category: "stock" | "order" | "chat" | "system";
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
  };

  const markSingleRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const renderIcon = (category: string, type: string) => {
    if (category === "stock" || type === "warning") {
      return <AlertTriangle size={16} className="text-amber-600" />;
    }
    if (category === "order" || type === "success") {
      return <ShoppingCart size={16} className="text-emerald-600" />;
    }
    return <MessageSquare size={16} className="text-blue-600" />;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMins = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Welcome back, {user.name || "Admin"}
        </h2>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications Popover Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) fetchNotifications();
            }}
            aria-label="View notifications"
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#A0463E]/20"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A0463E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A0463E]"></span>
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 bg-[#A0463E]/10 text-[#A0463E] rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-gray-500 hover:text-[#A0463E] flex items-center gap-1 font-medium"
                    >
                      <CheckCheck size={14} />
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {loading && notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">Loading alerts...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500 font-medium">No recent notifications</p>
                    <p className="text-[11px] text-gray-400">Store alerts & updates will appear here.</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isRead = readIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => markSingleRead(item.id)}
                        className={`p-3.5 hover:bg-gray-50/80 transition-colors flex items-start gap-3 cursor-pointer ${
                          !isRead ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            item.type === "warning"
                              ? "bg-amber-100"
                              : item.type === "success"
                              ? "bg-emerald-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {renderIcon(item.category, item.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-xs font-semibold truncate ${
                                !isRead ? "text-gray-900" : "text-gray-700"
                              }`}
                            >
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatTimeAgo(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>

                          <div className="mt-2 flex items-center justify-between">
                            <Link
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className="text-[11px] font-semibold text-[#A0463E] hover:underline flex items-center gap-1"
                            >
                              View details
                              <ExternalLink size={10} />
                            </Link>
                            {!isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#A0463E]" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 p-2 text-center bg-gray-50/50 rounded-b-xl">
                  <Link
                    href="/admin/orders"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-medium text-gray-600 hover:text-[#A0463E] transition-colors"
                  >
                    View all store activity →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#A0463E] hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

