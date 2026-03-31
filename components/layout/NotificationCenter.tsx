// components/layout/NotificationCenter.tsx
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
    Bell, Heart, MessageSquare, Reply, 
    Clock, CheckCircle2, Loader2, X, ShieldAlert 
} from 'lucide-react';
import { listNotifications, markNotificationRead } from '@/lib/blogApi';

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationsRef = useRef<any[]>([]);

    // Keep ref in sync with state for browser alert check
    useEffect(() => {
        notificationsRef.current = notifications;
    }, [notifications]);

    const fetchNotifications = useCallback(async (isInitial = false) => {
        try {
            const data = await listNotifications();
            
            // Check for new notifications to trigger browser alerts
            if (!isInitial && data.length > 0) {
                const newItems = data.filter((n: any) => 
                    !n.isRead && 
                    !notificationsRef.current.some((oldN: any) => oldN._id === n._id)
                );
                
                if (newItems.length > 0) {
                    newItems.forEach((n: any) => {
                        if (Notification.permission === 'granted') {
                            new Notification('Space Age Group Admin', {
                                body: n.content,
                                icon: '/favicon.ico' // Or a specific icon
                            });
                        }
                    });
                }
            }

            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []); // Removed [notifications] to prevent infinite loop

    useEffect(() => {
        // Request browser notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        fetchNotifications(true);
        // Simple polling for "real-time" experience
        const interval = setInterval(() => fetchNotifications(false), 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markNotificationRead('', true);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart size={14} className="text-rose-500" />;
            case 'comment': return <MessageSquare size={14} className="text-blue-500" />;
            case 'reply': return <Reply size={14} className="text-indigo-500" />;
            case 'manager_action': return <ShieldAlert size={14} className="text-amber-500" />;
            default: return <Bell size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all relative group"
            >
                <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">{unreadCount} New</span>}
                        </h3>
                        <button 
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                        >
                            Mark all as read
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-8 flex flex-col items-center justify-center gap-2">
                                <Loader2 size={20} className="text-blue-500 animate-spin" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updating alerts…</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell size={20} className="text-slate-300" />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">All caught up! No alerts yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((n) => (
                                    <Link 
                                        key={n._id} 
                                        href={n.type === 'manager_action' ? '#' : `/blog/${n.postId?._id || n.postId}`}
                                        className={`px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer relative group block ${!n.isRead ? 'bg-blue-50/20' : ''}`}
                                        onClick={() => {
                                            handleMarkAsRead(n._id);
                                            if (n.type !== 'manager_action') setIsOpen(false);
                                        }}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                                                n.type === 'like' ? 'bg-rose-50' : 
                                                n.type === 'comment' ? 'bg-blue-50' : 
                                                n.type === 'reply' ? 'bg-indigo-50' : 
                                                'bg-amber-50'
                                            }`}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-800 font-medium leading-relaxed line-clamp-2">
                                                    {n.content}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {!n.isRead && (
                                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                        <Link 
                            href="/notifications" 
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            View all history
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
