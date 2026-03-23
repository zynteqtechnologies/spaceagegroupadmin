// components/projects/sections/AmenitiesSection.tsx
'use client';
import { useState } from 'react';
import { Plus, Trash2, Loader2, Save, Sparkles } from 'lucide-react';
import { updateAmenities } from '@/lib/projectApi';
import type { ProjectDoc, AmenityItem } from '@/types/project';

interface Props { project: ProjectDoc; onUpdate: (doc: ProjectDoc) => void; }

// Suggested amenity categories
const CATEGORIES = ['Sports', 'Wellness', 'Recreation', 'Convenience', 'Safety', 'Kids', 'Green', 'Other'];

// Common amenity presets
const PRESETS = [
    { name: 'Swimming Pool', icon: '🏊', category: 'Sports' },
    { name: 'Gymnasium', icon: '🏋️', category: 'Wellness' },
    { name: 'Clubhouse', icon: '🏛️', category: 'Recreation' },
    { name: 'Jogging Track', icon: '🏃', category: 'Sports' },
    { name: 'Children Play Area', icon: '🛝', category: 'Kids' },
    { name: 'Landscaped Garden', icon: '🌿', category: 'Green' },
    { name: 'CCTV Surveillance', icon: '📹', category: 'Safety' },
    { name: '24/7 Security', icon: '💂', category: 'Safety' },
    { name: 'Power Backup', icon: '⚡', category: 'Convenience' },
    { name: 'Lift / Elevator', icon: '🛗', category: 'Convenience' },
    { name: 'Car Parking', icon: '🚗', category: 'Convenience' },
    { name: 'Indoor Games', icon: '🎱', category: 'Recreation' },
];

export default function AmenitiesSection({ project, onUpdate }: Props) {
    const [items, setItems] = useState<AmenityItem[]>(project.amenities ?? []);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const addRow = () => setItems(prev => [...prev, { name: '', icon: '', category: 'Other', order: prev.length }]);

    const addPreset = (preset: typeof PRESETS[0]) => {
        const already = items.some(i => i.name.toLowerCase() === preset.name.toLowerCase());
        if (already) return;
        setItems(prev => [...prev, { name: preset.name, icon: preset.icon, category: preset.category, order: prev.length }]);
    };

    const updateRow = (i: number, patch: Partial<AmenityItem>) =>
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item));

    const removeRow = (i: number) =>
        setItems(prev => prev.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, order: idx })));

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await updateAmenities(project._id, items);
            onUpdate(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5 max-w-2xl">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div>
                    <h2 className="text-base font-bold text-slate-800">Amenities</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Add amenities with optional emoji icons and categories</p>
                </div>

                {/* Quick add presets */}
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Add</p>
                    <div className="flex flex-wrap gap-2">
                        {PRESETS.map((preset) => {
                            const added = items.some(i => i.name.toLowerCase() === preset.name.toLowerCase());
                            return (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => addPreset(preset)}
                                    disabled={added}
                                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all
                    ${added
                                            ? 'bg-emerald-50 text-emerald-500 border-emerald-100 cursor-default'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
                                        }`}
                                >
                                    <span>{preset.icon}</span>
                                    {preset.name}
                                    {added && <span className="text-emerald-400 font-bold">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Amenity rows */}
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[2fr_1fr_1fr_auto] bg-slate-50 border-b border-slate-100">
                        <div className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amenity Name</div>
                        <div className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Icon</div>
                        <div className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</div>
                        <div className="w-10" />
                    </div>

                    {items.length === 0 ? (
                        <div className="py-10 text-center">
                            <Sparkles size={24} className="text-slate-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No amenities yet — use quick add or add manually</p>
                        </div>
                    ) : (
                        items.map((item, i) => (
                            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] border-b border-slate-100 last:border-b-0 group hover:bg-slate-50/60 transition-colors">
                                <div className="px-2 py-2">
                                    <input
                                        type="text"
                                        placeholder="Amenity name"
                                        value={item.name}
                                        onChange={e => updateRow(i, { name: e.target.value })}
                                        className="w-full border border-transparent focus:border-indigo-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-50 transition-all bg-transparent focus:bg-white"
                                    />
                                </div>
                                <div className="px-2 py-2">
                                    <input
                                        type="text"
                                        placeholder="🏊"
                                        value={item.icon ?? ''}
                                        onChange={e => updateRow(i, { icon: e.target.value })}
                                        className="w-full border border-transparent focus:border-indigo-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-50 transition-all bg-transparent focus:bg-white"
                                    />
                                </div>
                                <div className="px-2 py-2">
                                    <select
                                        value={item.category ?? 'Other'}
                                        onChange={e => updateRow(i, { category: e.target.value })}
                                        className="w-full border border-transparent focus:border-indigo-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-50 transition-all bg-transparent focus:bg-white"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center justify-center w-10">
                                    <button
                                        type="button"
                                        onClick={() => removeRow(i)}
                                        className="w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={addRow}
                        className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 font-semibold bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all"
                    >
                        <Plus size={14} /> Add Manually
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 font-semibold py-2.5 px-6 rounded-xl text-sm transition-all
              ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'} disabled:opacity-60`}
                    >
                        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
                            saved ? '✓ Saved!' :
                                <><Save size={14} /> Save Amenities</>}
                    </button>
                </div>
            </div>

            {/* Live preview */}
            {items.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Preview</p>
                    <div className="flex flex-wrap gap-2">
                        {items.map((item, i) => (
                            <span key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg">
                                {item.icon && <span>{item.icon}</span>}
                                {item.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}