// lib/dashboardApi.ts
import { DashboardStats } from '@/types/dashboard';

export async function getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch dashboard stats');
    }
    return res.json();
}
