// lib/userApi.ts

export async function listUsers() {
    const res = await fetch('/api/users', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

export async function getUser(id: string) {
    const res = await fetch(`/api/users/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
}

export async function createUser(data: any) {
    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create user');
    }
    return res.json();
}

export async function updateUser(id: string, data: any) {
    const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update user');
    }
    return res.json();
}

export async function deleteUser(id: string) {
    const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete user');
}
