"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import "./Calendar.css";

interface CalendarProps {
    selectedDates: string[]; // YYYY-MM-DD
    onSelect: (date: string) => void;
    disabledDate?: (date: string) => boolean;
}

export function Calendar({ selectedDates, onSelect, disabledDate }: CalendarProps) {
    const [viewDate, setViewDate] = useState(new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const startDay = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

    const daysInMonth = lastDayOfMonth.getDate();

    // Days to display in the grid (42 days)
    const days: { date: string; day: number; isCurrentMonth: boolean; isSunday: boolean; isSaturday: boolean }[] = [];

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
        const d = prevMonthLastDay - i;
        const prevMonthDate = new Date(year, month - 1, d);
        days.push({
            date: formatDate(prevMonthDate),
            day: d,
            isCurrentMonth: false,
            isSunday: false,
            isSaturday: false
        });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const currentMonthDate = new Date(year, month, i);
        days.push({
            date: formatDate(currentMonthDate),
            day: i,
            isCurrentMonth: true,
            isSunday: currentMonthDate.getDay() === 0,
            isSaturday: currentMonthDate.getDay() === 6
        });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
        const nextMonthDate = new Date(year, month + 1, i);
        days.push({
            date: formatDate(nextMonthDate),
            day: i,
            isCurrentMonth: false,
            isSunday: false,
            isSaturday: false
        });
    }

    function formatDate(date: Date) {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const d = date.getDate().toString().padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    const changeMonth = (offset: number) => {
        const newDate = new Date(year, month + offset, 1);
        setViewDate(newDate);
    };

    return (
        <div className="hkdk-calendar">
            <header className="calendar-header">
                <button type="button" className="btn-calendar-nav" onClick={() => changeMonth(-1)}>
                    <Icon name="arrow-left" size={24} color="#8E8E93" />
                </button>
                <div className="calendar-header__title">
                    {year}년 {month + 1}월
                    <Icon name="arrow-down" size={14} color="#1C1C1E" />
                </div>
                <button type="button" className="btn-calendar-nav" onClick={() => changeMonth(1)}>
                    <Icon name="arrow-right" size={24} color="#8E8E93" />
                </button>
            </header>

            <div className="calendar-grid">
                {/* Day Labels */}
                {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                    <div key={d} className={`calendar-day-label ${i === 0 ? "sunday" : ""} ${i === 6 ? "saturday" : ""}`}>
                        {d}
                    </div>
                ))}

                {/* Date Cells */}
                {days.map((item, idx) => {
                    const isSelected = selectedDates.includes(item.date);
                    const isToday = item.date === formatDate(new Date());
                    const isDisabled = disabledDate?.(item.date);

                    return (
                        <button
                            key={idx}
                            type="button"
                            className={`calendar-date-cell 
                                ${!item.isCurrentMonth ? "not-current" : ""} 
                                ${item.isSunday ? "sunday" : ""} 
                                ${item.isSaturday ? "saturday" : ""}
                                ${isSelected ? "selected" : ""}
                                ${isToday ? "today" : ""}
                                ${isDisabled ? "disabled" : ""}
                            `}
                            onClick={() => !isDisabled && onSelect(item.date)}
                            disabled={isDisabled}
                        >
                            <span className="date-number">{item.day}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
