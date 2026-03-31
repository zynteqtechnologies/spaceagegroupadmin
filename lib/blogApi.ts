// lib/blogApi.ts

export async function listBlogPosts(params: { status?: string; category?: string } = {}) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/blog?${query}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch blog posts');
    return res.json();
}

export async function getBlogPost(id: string) {
    const res = await fetch(`/api/blog/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch blog post');
    return res.json();
}

export async function createBlogPost(data: FormData) {
    const res = await fetch('/api/blog', {
        method: 'POST',
        body: data,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create blog post');
    }
    return res.json();
}

export async function updateBlogPost(id: string, data: FormData) {
    const res = await fetch(`/api/blog/${id}`, {
        method: 'PATCH',
        body: data,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update blog post');
    }
    return res.json();
}

export async function deleteBlogPost(id: string) {
    const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete blog post');
}

export async function listNotifications() {
    const res = await fetch('/api/notifications', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
}

export async function markNotificationRead(id: string, all = false) {
    const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, all }),
    });
    if (!res.ok) throw new Error('Failed to update notification');
    return res.json();
}
