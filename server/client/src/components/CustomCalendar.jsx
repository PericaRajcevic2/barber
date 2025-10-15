import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const CustomCalendar = ({ value, onChange, blockedDates, onDateSelect }) => {
  // Custom styles for dark theme
  const calendarStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    padding: '10px',
    color: 'white'
  };
  const isDateBlocked = (date) => {
    return blockedDates.some(blockedDate => 
      blockedDate.getFullYear() === date.getFullYear() &&
      blockedDate.getMonth() === date.getMonth() &&
      blockedDate.getDate() === date.getDate()
    );
  };

  const handleDateChange = (newDate) => {
    if (!isDateBlocked(newDate)) {
      onChange(newDate);
      if (onDateSelect) onDateSelect();
    }
  };

  const renderTileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const isBlocked = isDateBlocked(date);
    const isNeighboringMonth = date.getMonth() !== value.getMonth();
    
    return (
      <div className={`calendar-tile ${isBlocked ? 'blocked' : ''} ${isNeighboringMonth ? 'neighboring' : ''}`}>
        {isBlocked && (
          <div className="blocked-marker">
            <span className="blocked-x">×</span>
            <span className="blocked-tooltip">Termin je blokiran</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Calendar
      onChange={handleDateChange}
      value={value}
      minDate={new Date()}
      locale="hr-HR"
      className="custom-calendar"
      style={calendarStyle}
      tileClassName={({ date, view }) => {
        if (view !== 'month') return '';
        
        const isBlocked = isDateBlocked(date);
        if (isBlocked) return 'blocked-date';
        return '';
      }}
      tileDisabled={({ date, view }) => {
        if (view !== 'month') return false;
        return isDateBlocked(date);
      }}
      tileContent={({ date, view }) => {
        if (view !== 'month') return null;
        
        const isBlocked = isDateBlocked(date);
        if (!isBlocked) return null;
        
        return (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 0, 0, 0.15)',
            color: '#ff4444',
            borderRadius: '8px'
          }}>
            ×
          </div>
        );
      }}
    />
  );
};

export default CustomCalendar;