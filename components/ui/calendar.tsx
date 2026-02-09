import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    isToday,
    eachDayOfInterval,
    isAfter,
    isBefore,
    getYear,
    getMonth,
    setYear,
    setMonth
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface CalendarProps {
    selected?: Date;
    onSelect?: (date: Date) => void;
    className?: string;
    disabledDates?: (date: Date) => boolean;
}

export function Calendar({ selected, onSelect, className, disabledDates }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(selected || new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const years = Array.from({ length: 20 }, (_, i) => getYear(new Date()) - 10 + i);
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleYearChange = (year: string) => {
        setCurrentMonth(setYear(currentMonth, parseInt(year)));
    };

    const handleMonthChange = (month: string) => {
        setCurrentMonth(setMonth(currentMonth, months.indexOf(month)));
    };

    return (
        <div className={cn("p-4 bg-white rounded-xl shadow-lg border border-slate-100 w-[300px]", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevMonth}
                        className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={months[getMonth(currentMonth)]}
                        onValueChange={handleMonthChange}
                    >
                        <SelectTrigger className="h-8 py-0 px-2 border-none shadow-none font-semibold text-slate-700 hover:bg-slate-50 focus:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {months.map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={getYear(currentMonth).toString()}
                        onValueChange={handleYearChange}
                    >
                        <SelectTrigger className="h-8 py-0 px-2 border-none shadow-none font-semibold text-slate-700 hover:bg-slate-50 focus:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {years.map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextMonth}
                        className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Week days */}
            <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                    const isSelected = selected && isSameDay(day, selected);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const disabled = disabledDates && disabledDates(day);
                    const currentDay = isToday(day);

                    return (
                        <button
                            key={idx}
                            onClick={() => !disabled && onSelect?.(day)}
                            disabled={disabled}
                            className={cn(
                                "h-9 w-9 flex items-center justify-center rounded-lg text-sm transition-all relative group",
                                !isCurrentMonth && "text-slate-300 opacity-50",
                                isCurrentMonth && !isSelected && "text-slate-600 hover:bg-primary/5 hover:text-primary",
                                isSelected && "bg-primary text-white font-bold shadow-md shadow-primary/20 scale-105 z-10",
                                currentDay && !isSelected && "text-primary font-bold after:content-[''] after:absolute after:bottom-1.5 after:h-1 after:w-1 after:bg-primary after:rounded-full",
                                disabled && "opacity-20 cursor-not-allowed pointer-events-none"
                            )}
                        >
                            {format(day, 'd')}
                            {!isSelected && !disabled && (
                                <div className="absolute inset-0 rounded-lg border-2 border-primary opacity-0 group-hover:opacity-20 transition-opacity" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] font-bold h-7 px-2 text-primary hover:bg-primary/5"
                    onClick={() => onSelect?.(new Date())}
                >
                    TODAY
                </Button>
                {selected && (
                    <p className="text-[10px] font-medium text-slate-400">
                        Selected: <span className="text-slate-600">{format(selected, 'MMM d, yyyy')}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
