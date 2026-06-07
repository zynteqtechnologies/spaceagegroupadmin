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
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">
                            Administrator Management
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">Manage accounts with access to the admin dashboard</p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#f9fbfd] rounded-sm border border-gray-200 shadow-sm px-3.5 py-2">
                            <Shield size={14} className="text-black" />
                            <span className="text-xs font-bold text-black">{users.length} Total</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-5">
                    <div className="flex items-center gap-1">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 text-white shadow-sm rounded-sm">
                            <Shield size={14} />
                            All Administrators
                        </button>
                        {isAdministrator && (
                            <Link
                                href="/users/new"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-[#f9fbfd] rounded-sm border border-gray-200 hover:bg-slate-50 transition-all"
                            >
                                <Plus size={14} />
                                Create New
                            </Link>
                        )}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search admins..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[#f9fbfd] border border-gray-200 rounded-sm text-sm focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all outline-none w-full sm:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* ── Content ────────────────────────────────────────────────────── */}
            {/* ── Content ────────────────────────────────────────────────────── */}
            <div className="px-4 lg:px-8 py-6 bg-[#f9fbfd] min-h-[calc(100vh-140px)]">
                {filteredUsers.length === 0 ? (
                    <div className="bg-white border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                            <User2 size={28} className="text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-700 mb-1">No administrators found</p>
                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                                {searchTerm ? 'No results match your search criteria.' : 'Create your first administrator account to manage the dashboard.'}
                            </p>
                        </div>
                        {isAdministrator && !searchTerm && (
                            <Link
                                href="/users/new"
                                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                            >
                                <Plus size={15} /> Create Admin
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredUsers.map((user) => (
                            <div key={user._id} className="group bg-white border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-200 transition-all relative flex flex-col p-4">
                                {/* Role Badge */}
                                <div className="absolute top-0 right-0 py-1 px-3 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border-b border-l border-blue-100">
                                    {user.role}
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors truncate">{user.name}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5 truncate">
                                            <Mail size={10} className="shrink-0" />
                                            <span className="truncate">{user.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 flex-1">
                                    <div className="flex items-center justify-between text-[11px] py-1.5 border-b border-slate-50">
                                        <span className="text-slate-400 font-medium">Joined On</span>
                                        <span className="text-slate-700 font-bold flex items-center gap-1">
                                            <Calendar size={10} className="text-slate-300" />
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] py-1.5">
                                        <span className="text-slate-400 font-medium">Account Status</span>
                                        <span className="text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                                            <UserCheck size={10} />
                                            Active
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                {isAdministrator ? (
                                    <div className="mt-auto flex items-center gap-2">
                                        <Link
                                            href={`/users/${user._id}/edit`}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold py-2 rounded-sm transition-all border border-slate-100"
                                        >
                                            <Edit size={12} /> Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(user._id, user.name)}
                                            disabled={deletingId === user._id}
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 text-xs font-semibold py-2 rounded-sm transition-all border border-rose-100 disabled:opacity-50"
                                        >
                                            {deletingId === user._id ? <Loader2 size={12} className="animate-spin" /> : <><Trash2 size={12} /> Delete</>}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-auto p-2 bg-slate-50 rounded-sm text-center text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
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
