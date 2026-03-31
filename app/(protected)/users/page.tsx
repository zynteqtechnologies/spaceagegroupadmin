// app/(protected)/users/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
    Plus, Loader2, Trash2, Edit, User2,
    Mail, Shield, Calendar, ChevronRight, Search,
    MoreVertical, UserCheck, ShieldAlert
} from 'lucide-react';
import { listUsers, deleteUser } from '@/lib/userApi';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const isAdministrator = currentUser?.role === 'administrator';

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await listUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete admin "${name}"?`)) return;
        setDeletingId(id);
        try {
            await deleteUser(id);
            setUsers(prev => prev.filter(u => u._id !== id));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 size={28} className="text-blue-500 animate-spin" />
                <p className="text-sm text-slate-400 font-medium">Loading administrators…</p>
            </div>
        );
    }

    return (
        <div className="pb-20">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-4 lg:px-8 py-5">
                <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400 font-medium">
                    <Link href="/dashboard" className="hover:text-slate-600 transition-colors">Dashboard</Link>
                    <ChevronRight size={12} />
                    <span className="text-slate-700 font-semibold">Users</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
                            <Shield size={24} className="text-blue-600" />
                            Administrator Management
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage accounts with access to the admin dashboard</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search admins..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none w-64"
                            />
                        </div>
                        {isAdministrator && (
                            <Link
                                href="/users/new"
                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-6 rounded-sm text-sm transition-all shadow-sm"
                            >
                                <Plus size={16} /> Add Admin
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
                {filteredUsers.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-sm">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                            <User2 size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No administrators found</h3>
                        <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">
                            {searchTerm ? 'No results match your search criteria.' : 'Create your first administrator account to manage the dashboard.'}
                        </p>
                        {isAdministrator && !searchTerm && (
                            <Link
                                href="/users/new"
                                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3 rounded-sm transition-all"
                            >
                                <Plus size={18} /> Create First Admin
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map((user) => (
                            <div key={user._id} className="group bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
                                {/* Role Badge */}
                                <div className="absolute top-0 right-0 py-1.5 px-4 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-bl-xl border-b border-l border-blue-100">
                                    {user.role}
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200/50">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">{user.name}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                                            <Mail size={12} />
                                            {user.email}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                                        <span className="text-slate-400 font-medium">Joined On</span>
                                        <span className="text-slate-700 font-bold flex items-center gap-1.5">
                                            <Calendar size={12} className="text-slate-300" />
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-2">
                                        <span className="text-slate-400 font-medium">Account Status</span>
                                        <span className="text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                            <UserCheck size={12} />
                                            Active
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {isAdministrator ? (
                                    <div className="mt-auto flex items-center gap-2">
                                        <Link
                                            href={`/users/${user._id}/edit`}
                                            className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-bold py-2.5 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                        >
                                            <Edit size={14} /> Edit Profile
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(user._id, user.name)}
                                            disabled={deletingId === user._id}
                                            className="w-11 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all disabled:opacity-50"
                                        >
                                            {deletingId === user._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-auto p-3 bg-slate-50 rounded-xl text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100/50">
                                        View Only
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
