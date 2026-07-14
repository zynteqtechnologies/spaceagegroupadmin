// context/ModalContext.tsx
'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info as InfoIcon } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface ModalOptions {
    type: 'alert' | 'confirm';
    alertType?: AlertType;
    title: string;
    message: string;
    resolve: (value: boolean) => void;
}

interface ModalContextType {
    showAlert: (title: string, message: string, alertType?: AlertType) => Promise<boolean>;
    showConfirm: (title: string, message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalOptions | null>(null);

    const showAlert = (title: string, message: string, alertType: AlertType = 'info') => {
        return new Promise<boolean>((resolve) => {
            setModal({
                type: 'alert',
                alertType,
                title,
                message,
                resolve,
            });
        });
    };

    const showConfirm = (title: string, message: string) => {
        return new Promise<boolean>((resolve) => {
            setModal({
                type: 'confirm',
                alertType: 'warning',
                title,
                message,
                resolve,
            });
        });
    };

    const handleConfirm = () => {
        if (modal) {
            modal.resolve(true);
            setModal(null);
        }
    };

    const handleCancel = () => {
        if (modal) {
            modal.resolve(false);
            setModal(null);
        }
    };

    const renderIcon = () => {
        if (!modal) return null;
        const color = modal.alertType === 'success' ? 'text-emerald-500 bg-emerald-50'
                    : modal.alertType === 'error' ? 'text-rose-500 bg-rose-50'
                    : modal.alertType === 'warning' ? 'text-amber-500 bg-amber-50'
                    : 'text-blue-500 bg-blue-50';

        const IconComponent = modal.alertType === 'success' ? CheckCircle
                            : modal.alertType === 'error' ? XCircle
                            : modal.alertType === 'warning' ? AlertTriangle
                            : InfoIcon;

        return (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color}`}>
                <IconComponent size={24} />
            </div>
        );
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            
            {modal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
                    <div className="bg-white border border-slate-100 shadow-2xl p-6 max-w-sm w-full rounded-sm flex flex-col items-center text-center animate-scale-in">
                        
                        {renderIcon()}
                        
                        <h3 className="text-base font-bold text-slate-900 font-serif mb-2 leading-tight">
                            {modal.title}
                        </h3>
                        
                        <p className="text-xs text-slate-500 leading-relaxed mb-6">
                            {modal.message}
                        </p>
                        
                        <div className="flex gap-2 w-full mt-auto">
                            {modal.type === 'confirm' ? (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-sm cursor-pointer transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="flex-1 py-2 text-white bg-slate-900 hover:bg-slate-800 text-xs font-bold rounded-sm cursor-pointer transition-colors"
                                    >
                                        Confirm
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleConfirm}
                                    className="w-full py-2.5 text-white bg-slate-900 hover:bg-slate-800 text-xs font-bold rounded-sm cursor-pointer transition-colors"
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within ModalProvider');
    return context;
}
