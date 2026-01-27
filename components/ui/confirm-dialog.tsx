"use client"

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "default" | "warning";
    isLoading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "destructive",
    isLoading = false
}: ConfirmDialogProps) {
    const iconMap = {
        destructive: <AlertTriangle className="h-6 w-6 text-rose-600" />,
        warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
        default: <AlertTriangle className="h-6 w-6 text-blue-600" />
    };

    const bgMap = {
        destructive: "bg-rose-100",
        warning: "bg-amber-100",
        default: "bg-blue-100"
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader className="flex flex-col items-center text-center space-y-3">
                    <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center",
                        bgMap[variant]
                    )}>
                        {iconMap[variant]}
                    </div>
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                    <p className="text-sm text-slate-500">
                        {description}
                    </p>
                </DialogHeader>
                <DialogFooter className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            variant === 'warning' && "bg-amber-600 hover:bg-amber-700 text-white"
                        )}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
