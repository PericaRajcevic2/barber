import React, { useState, useRef, useEffect } from 'react';
import './SwipeableCalendar.css';

const SwipeableCalendar = ({ selectedDate, onDateChange, minDate, maxDate, blockedDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const calendarRef = useRef(null);

  const minSwipeDistance = 50;

  const monthNames = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
    'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  const dayNames = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    const currentTouch = e.targetTouches[0].clientX;
    const distance = currentTouch - touchStart;
    setDragOffset(distance);
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextMonth();
    } else if (isRightSwipe) {
      previousMonth();
    }

    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (date < today) return true;

    // Check if date is blocked
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.includes(dateStr);
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === new Date(selectedDate).toDateString();
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date) => {
    if (!isDateDisabled(date) && onDateChange) {
      onDateChange(date);
    }
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="swipeable-calendar">
      <div className="calendar-header">
        <button
          className="calendar-nav-btn"
          onClick={previousMonth}
          aria-label="Prethodni mjesec"
        >
          ‹
        </button>
        <h3 className="calendar-title">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          className="calendar-nav-btn"
          onClick={nextMonth}
          aria-label="Sljedeći mjesec"
        >
          ›
        </button>
      </div>

      <div className="calendar-hint">
        👆 Swipe lijevo/desno za promjenu mjeseca
      </div>

      <div
        ref={calendarRef}
        className={`calendar-grid-wrapper ${isDragging ? 'dragging' : ''}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: isDragging ? `translateX(${dragOffset}px)` : 'translateX(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <div className="calendar-weekdays">
          {dayNames.map((day, index) => (
            <div key={index} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((date, index) => (
            <div
              key={index}
              className={`calendar-day ${!date ? 'empty' : ''} ${
                isDateDisabled(date) ? 'disabled' : ''
              } ${isDateSelected(date) ? 'selected' : ''} ${
                isToday(date) ? 'today' : ''
              }`}
              onClick={() => date && handleDateClick(date)}
            >
              {date && (
                <>
                  <span className="day-number">{date.getDate()}</span>
                  {isToday(date) && <span className="today-indicator">•</span>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SwipeableCalendar;
