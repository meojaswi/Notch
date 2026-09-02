import React, { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import './CalendarWidget.css';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getWeekDays(centerDate) {
  const start = new Date(centerDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarWidget({ selectedDate = new Date(), onSelectDate }) {
  const week = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const monthLabel = selectedDate.toLocaleDateString([], { month: 'short' });

  return (
    <div className="calendar-widget">
      <div className="calendar-widget-header">
        <Calendar size={13} />
        <span>Calendar</span>
      </div>

      <div className="calendar-widget-month">{monthLabel}</div>

      <div className="calendar-widget-grid">
        {DAY_LABELS.map((label, i) => (
          <span key={`label-${i}`} className="calendar-widget-daylabel">
            {label}
          </span>
        ))}
        {week.map((d) => {
          const isSelected = d.toDateString() === selectedDate.toDateString();
          return (
            <button
              key={d.toISOString()}
              className={`calendar-widget-day ${isSelected ? 'calendar-widget-day--selected' : ''}`}
              onClick={() => onSelectDate?.(d)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
