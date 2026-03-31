// lib/teamApi.ts
import { TeamMember } from '@/types/team';

export async function listTeamMembers(): Promise<TeamMember[]> {
    const res = await fetch('/api/team', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch team members');
    return res.json();
}

export async function getTeamMember(id: string): Promise<TeamMember> {
    const res = await fetch(`/api/team/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch team member');
    return res.json();
}

export async function createTeamMember(formData: FormData): Promise<TeamMember> {
    const res = await fetch('/api/team', {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create team member');
    }
    return res.json();
}

export async function updateTeamMember(id: string, formData: FormData): Promise<TeamMember> {
    const res = await fetch(`/api/team/${id}`, {
        method: 'PATCH',
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update team member');
    }
    return res.json();
}

export async function deleteTeamMember(id: string): Promise<void> {
    const res = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete team member');
}
