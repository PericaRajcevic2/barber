import React, { useRef } from 'react';
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

  const calendarRef = useRef();

  // Kad se promijeni prikazani mjesec, automatski postavi value na prvi dan tog mjeseca
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    // Ako value nije u prikazanom mjesecu, postavi na prvi dan
    if (activeStartDate.getMonth() !== value.getMonth() || activeStartDate.getFullYear() !== value.getFullYear()) {
      const firstDay = new Date(activeStartDate.getFullYear(), activeStartDate.getMonth(), 1);
      onChange(firstDay);
    }
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
      ref={calendarRef}
      onChange={handleDateChange}
      value={value}
      minDate={new Date()}
      locale="hr-HR"
      className="custom-calendar"
      style={calendarStyle}
      onActiveStartDateChange={handleActiveStartDateChange}
      tileClassName={({ date, view }) => {
        if (view !== 'month') return '';
        const isBlocked = isDateBlocked(date);
        if (isBlocked) return 'blocked-date';
        if (date.getDay() === 0) return 'blocked-date'; // Nedjelja
        // React Calendar automatski dodaje .react-calendar__tile--neighboringMonth na dane izvan mjeseca
        return '';
      }}
      tileDisabled={({ date, view }) => {
        if (view !== 'month') return false;
        // Blokirani, nedjelja ili izvan mjeseca
        return isDateBlocked(date) || date.getDay() === 0 || date.getMonth() !== value.getMonth();
      }}
      tileContent={({ date, view }) => {
        if (view !== 'month') return null;
        // Nema X-a na blokiranim danima
        return null;
      }}
    />
  );
};

export default CustomCalendar;