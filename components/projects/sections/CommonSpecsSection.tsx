// components/projects/sections/CommonSpecsSection.tsx
'use client';
import { useState } from 'react';
import { Plus, Trash2, Loader2, Save, GripVertical } from 'lucide-react';
import { updateSpecifications } from '@/lib/projectApi';
import type { ProjectDoc, SpecificationItem } from '@/types/project';

interface Props { project: ProjectDoc; onUpdate: (doc: ProjectDoc) => void; }

function SpecsEditor({ project, onUpdate, type, title, description }: Props & { type: 'common' | 'commercial'; title: string; description: string }) {
    const initial = type === 'common' ? project.commonSpecifications : project.commercialSpecifications;
    const [items, setItems] = useState<SpecificationItem[]>(initial ?? []);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const addRow = () => setItems(prev => [...prev, { label: '', value: '', order: prev.length }]);

    const updateRow = (i: number, patch: Partial<SpecificationItem>) =>
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item));

    const removeRow = (i: number) =>
        setItems(prev => prev.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, order: idx })));

    const handleSave = async () => {
        setSaving(true);
        try {
            const updated = await updateSpecifications(project._id, type, items);
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 max-w-2xl">
            <div>
                <h2 className="text-base font-bold text-slate-800">{title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>

            {/* Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_1fr_auto] bg-slate-50 border-b border-slate-100">
                    <div className="w-8" />
                    <div className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Specification</div>
                    <div className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Value</div>
                    <div className="w-10" />
                </div>

                {items.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">
                        No specifications yet — click &quot;Add Row&quot; to start
                    </div>
                ) : (
                    items.map((item, i) => (
                        <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] border-b border-slate-100 last:border-b-0 group hover:bg-slate-50/60 transition-colors">
                            <div className="flex items-center justify-center w-8 text-slate-300 cursor-grab">
                                <GripVertical size={13} />
                            </div>
                            <div className="px-2 py-2">
                                <input
                                    type="text"
                                    placeholder="e.g. Structure"
                                    value={item.label}
                                    onChange={e => updateRow(i, { label: e.target.value })}
                                    className="w-full border border-transparent focus:border-indigo-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-50 transition-all bg-transparent focus:bg-white"
                                />
                            </div>
                            <div className="px-2 py-2">
                                <input
                                    type="text"
                                    placeholder="e.g. RCC Framed"
                                    value={item.value}
                                    onChange={e => updateRow(i, { value: e.target.value })}
                                    className="w-full border border-transparent focus:border-indigo-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-50 transition-all bg-transparent focus:bg-white"
                                />
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
                    <Plus size={14} /> Add Row
                </button>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 font-semibold py-2.5 px-6 rounded-xl text-sm transition-all
            ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'} disabled:opacity-60`}
                >
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> :
                        saved ? '✓ Saved!' :
                            <><Save size={14} /> Save Specifications</>}
                </button>
            </div>
        </div>
    );
}

export default function CommonSpecsSection(props: Props) {
    return (
        <SpecsEditor
            {...props}
            type="common"
            title="Common Specifications"
            description="General building specifications shown to all visitors (structure, flooring, doors, etc.)"
        />
    );
}