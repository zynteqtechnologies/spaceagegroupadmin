export async function listServices(): Promise<any[]> {
    const res = await fetch('/api/services', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
}

export async function getService(id: string): Promise<any> {
    const res = await fetch(`/api/services/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch service');
    return res.json();
}

export async function createService(data: any): Promise<any> {
    const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create service');
    }
    return res.json();
}

export async function updateService(id: string, data: any): Promise<any> {
    const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update service');
    }
    return res.json();
}

export async function deleteService(id: string): Promise<void> {
    const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete service');
}
