import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
// ✅ ?raw bypasses PostCSS/Tailwind — imports CSS as a plain string
import rbcCss from 'react-big-calendar/lib/css/react-big-calendar.css?raw';
import { useMemo, useEffect } from 'react';

// Inject react-big-calendar CSS once without going through Tailwind
let rbcStyleInjected = false;
const injectRBCStyles = () => {
  if (rbcStyleInjected) return;
  const style = document.createElement('style');
  style.setAttribute('data-rbc-calendar', '');
  style.textContent = rbcCss;
  document.head.appendChild(style);
  rbcStyleInjected = true;
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
});

/**
 * @param {object} props
 * @param {Array}    props.events       - react-big-calendar event objects
 * @param {Function} props.onSelectEvent
 * @param {Function} props.onSelectSlot
 */
const CalendarView = ({ events = [], onSelectEvent, onSelectSlot }) => {
  const defaultDate = useMemo(() => new Date(), []);

  useEffect(() => {
    injectRBCStyles();
  }, []);

  return (
    <div className="h-full min-h-[560px]">
      <Calendar
        localizer={localizer}
        events={events}
        defaultDate={defaultDate}
        defaultView="month"
        selectable
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        style={{ height: '100%' }}
      />
    </div>
  );
};

export default CalendarView;
