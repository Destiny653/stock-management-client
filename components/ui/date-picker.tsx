import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

export interface DatePickerProps {
    date?: string | Date;
    onChange?: (date: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function DatePicker({ date, onChange, placeholder = "Pick a date", className, disabled }: DatePickerProps) {
    const selectedDate = typeof date === 'string' ? (date ? parseISO(date) : undefined) : date;
    const displayDate = selectedDate && isValid(selectedDate) ? selectedDate : undefined;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-start text-left font-normal h-10 px-3 bg-white border-slate-200 hover:border-primary/30 hover:bg-primary/5 transition-all",
                        !displayDate && "text-slate-400",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {displayDate ? format(displayDate, "PPP") : <span>{placeholder}</span>}
                    {displayDate && !disabled && (
                        <X
                            className="ml-auto h-4 w-4 text-slate-400 hover:text-rose-500 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange?.("");
                            }}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-xl z-60" align="start">
                <Calendar
                    selected={displayDate}
                    onSelect={(newDate) => {
                        onChange?.(format(newDate, "yyyy-MM-dd"));
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
