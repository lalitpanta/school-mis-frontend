import React from 'react';
import NepaliDatePicker from '@zener/nepali-datepicker-react';
import '@zener/nepali-datepicker-react/index.css';
import { useSettings } from '../../context/SettingsContext';
import { adToBs, bsToAd } from '../../utils/bsCalendar';

/**
 * A universal date picker that respects the global calendar_type setting.
 * Internally, it always works with ISO (YYYY-MM-DD) Gregorian dates as the standard value.
 * But it displays and allows input in either AD or BS depending on the setting.
 * 
 * @param {string} value - ISO date string (YYYY-MM-DD)
 * @param {function} onChange - Callback receiving the new ISO date string
 * @param {string} className - Optional styling
 */
const UniversalDatePicker = ({ value, onChange, className = '' }) => {
  const { settings } = useSettings();
  const calendarType = settings.calendar_type || 'BS';

  // For BS Picker
  const handleBsChange = (date) => {
    if (!date) {
      onChange('');
      return;
    }
    const dateStr = date.format('YYYY-MM-DD');
    const [y, m, d] = dateStr.split('-').map(Number);
    const adDate = bsToAd(y, m, d);
    if (adDate) {
      const localIso = new Date(adDate.getTime() - adDate.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
      onChange(localIso);
    }
  };

  // Get BS value for the picker
  const getBsValue = () => {
    if (!value) return '';
    const adDate = new Date(value);
    const bsObj = adToBs(adDate);
    if (bsObj) {
      return `${bsObj.year}-${String(bsObj.month).padStart(2, '0')}-${String(bsObj.day).padStart(2, '0')}`;
    }
    return '';
  };

  if (calendarType === 'BS') {
    return (
      <div className={`relative ${className}`}>
        <NepaliDatePicker
          value={getBsValue()}
          onChange={handleBsChange}
          lang="np"
          className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
        />
      </div>
    );
  }

  return (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 ${className}`}
    />
  );
};

export default UniversalDatePicker;
