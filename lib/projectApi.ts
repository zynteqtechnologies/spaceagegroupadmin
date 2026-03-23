// lib/projectApi.ts
import type {
    ProjectDoc,
    CreateProjectPayload,
    SpecificationItem,
    AmenityItem,
    VirtualTour,
    NewMediaDetail,
    NewFloorPlanDetail,
    SampleHousePreview,
    FloorPlanItem,
    MediaItem,
    SampleHousePhoto,
} from '@/types/project';

const BASE = '/api/projects';

// ── helpers ───────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed: ${res.status}`);
    }
    return res.json();
}

// ── Projects CRUD ─────────────────────────────────────────────────────────────

export async function listProjects(status?: string): Promise<ProjectDoc[]> {
    const url = status ? `${BASE}?status=${status}` : BASE;
    const res = await fetch(url, { cache: 'no-store' });
    return handleResponse<ProjectDoc[]>(res);
}

export async function getProject(id: string): Promise<ProjectDoc> {
    const res = await fetch(`${BASE}/${id}`, { cache: 'no-store' });
    return handleResponse<ProjectDoc>(res);
}

export async function createProject(payload: CreateProjectPayload): Promise<ProjectDoc> {
    const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

export async function updateProjectBasic(id: string, payload: Partial<CreateProjectPayload>): Promise<ProjectDoc> {
    const res = await fetch(`${BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

export async function deleteProject(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    await handleResponse<void>(res);
}

// ── Hero images ───────────────────────────────────────────────────────────────

export async function uploadHeroImages(
    projectId: string,
    files: File[],
    details: NewMediaDetail[]
): Promise<ProjectDoc> {
    const formData = new FormData();
    formData.append('imageDetails', JSON.stringify(details));
    files.forEach((f) => formData.append('images', f));

    const res = await fetch(`${BASE}/${projectId}/hero-images`, { method: 'POST', body: formData });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

export async function updateHeroImages(
    projectId: string,
    files: File[],
    details: (MediaItem & { markedForDeletion?: boolean } | NewMediaDetail)[]
): Promise<ProjectDoc> {
    const formData = new FormData();
    formData.append('imageDetails', JSON.stringify(details));
    files.forEach((f) => formData.append('images', f));

    const res = await fetch(`${BASE}/${projectId}/hero-images`, { method: 'PUT', body: formData });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

// ── Floor plans ───────────────────────────────────────────────────────────────

export async function uploadFloorPlans(
    projectId: string,
    files: File[],
    details: NewFloorPlanDetail[]
): Promise<ProjectDoc> {
    const formData = new FormData();
    formData.append('floorPlanDetails', JSON.stringify(details));
    files.forEach((f) => formData.append('floorPlans', f));

    const res = await fetch(`${BASE}/${projectId}/floor-plans`, { method: 'POST', body: formData });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

export async function updateFloorPlans(
    projectId: string,
    files: File[],
    details: (FloorPlanItem | NewFloorPlanDetail)[]
): Promise<ProjectDoc> {
    const formData = new FormData();
    formData.append('floorPlanDetails', JSON.stringify(details));
    files.forEach((f) => formData.append('floorPlans', f));

    const res = await fetch(`${BASE}/${projectId}/floor-plans`, { method: 'PUT', body: formData });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

// ── Layout plan ───────────────────────────────────────────────────────────────

export async function uploadLayoutPlan(
    projectId: string,
    file: File,
    title = 'Layout Plan',
    alt = ''
): Promise<ProjectDoc> {
    const formData = new FormData();
    formData.append('layoutPlan', file);
    formData.append('title', title);
    formData.append('alt', alt);

    const res = await fetch(`${BASE}/${projectId}/layout-plan`, { method: 'PUT', body: formData });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

export async function deleteLayoutPlan(projectId: string): Promise<ProjectDoc> {
    const res = await fetch(`${BASE}/${projectId}/layout-plan`, { method: 'DELETE' });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

// ── Specifications ────────────────────────────────────────────────────────────

export async function updateSpecifications(
    projectId: string,
    type: 'common' | 'commercial',
    items: SpecificationItem[]
): Promise<ProjectDoc> {
    const res = await fetch(`${BASE}/${projectId}/specifications?type=${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

// ── Amenities ─────────────────────────────────────────────────────────────────

export async function updateAmenities(
    projectId: string,
    items: AmenityItem[]
): Promise<ProjectDoc> {
    const res = await fetch(`${BASE}/${projectId}/amenities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

// ── Sample house photos ───────────────────────────────────────────────────────

export async function uploadSamplePhotos(
    projectId: string,
    files: File[],
    details: SampleHousePreview[]
): Promise<ProjectDoc> {
    const formData = new FormData();
    formData.append('photoDetails', JSON.stringify(details));
    files.forEach((f) => formData.append('photos', f));

    const res = await fetch(`${BASE}/${projectId}/sample-house-photos`, { method: 'POST', body: formData });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

export async function updateSamplePhotos(
    projectId: string,
    files: File[],
    details: (SampleHousePhoto | SampleHousePreview)[]
): Promise<ProjectDoc> {
    const formData = new FormData();
    formData.append('photoDetails', JSON.stringify(details));
    files.forEach((f) => formData.append('photos', f));

    const res = await fetch(`${BASE}/${projectId}/sample-house-photos`, { method: 'PUT', body: formData });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

// ── Brochure ──────────────────────────────────────────────────────────────────

export async function uploadBrochure(projectId: string, file: File): Promise<ProjectDoc> {
    const formData = new FormData();
    formData.append('brochure', file);

    const res = await fetch(`${BASE}/${projectId}/brochure`, { method: 'PUT', body: formData });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

export async function deleteBrochure(projectId: string): Promise<ProjectDoc> {
    const res = await fetch(`${BASE}/${projectId}/brochure`, { method: 'DELETE' });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}

// ── Virtual tour ──────────────────────────────────────────────────────────────

export async function updateVirtualTour(projectId: string, data: VirtualTour): Promise<ProjectDoc> {
    const res = await fetch(`${BASE}/${projectId}/virtual-tour`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const result = await handleResponse<{ project: ProjectDoc }>(res);
    return result.project;
}

export async function deleteVirtualTour(projectId: string): Promise<ProjectDoc> {
    const res = await fetch(`${BASE}/${projectId}/virtual-tour`, { method: 'DELETE' });
    const data = await handleResponse<{ project: ProjectDoc }>(res);
    return data.project;
}