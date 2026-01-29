'use client'

import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        'group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl dark:group-[.toaster]:bg-[#000032] dark:group-[.toaster]:text-slate-50 dark:group-[.toaster]:border-white/10',
                    description: 'group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400',
                    actionButton:
                        'group-[.toast]:bg-[#0070FF] group-[.toast]:text-slate-50',
                    cancelButton:
                        'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 dark:group-[.toast]:bg-slate-800 dark:group-[.toast]:text-slate-400',
                    success: 'group-[.toast]:bg-emerald-50 group-[.toast]:text-emerald-700 group-[.toast]:border-emerald-200 dark:group-[.toast]:bg-emerald-500/10 dark:group-[.toast]:text-emerald-400 dark:group-[.toast]:border-emerald-500/20',
                    error: 'group-[.toast]:bg-rose-50 group-[.toast]:text-rose-700 group-[.toast]:border-rose-200 dark:group-[.toast]:bg-rose-500/10 dark:group-[.toast]:text-rose-400 dark:group-[.toast]:border-rose-500/20',
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
