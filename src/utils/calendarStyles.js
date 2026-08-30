/**
 * Shared color logic for both Dashboard and Settings
 */
export function dayColor(dayType, categoryName) {
  const cat = (categoryName || '').toLowerCase();
  const type = (dayType || '').toLowerCase();

  // Primary categories
  if (cat.includes('holiday') || type.includes('holiday')) {
    return { cell: 'bg-rose-600', badge: 'bg-white/20 text-white border-white/30', num: 'text-white' };
  }
  if (cat.includes('exam') || type.includes('exam')) {
    return { cell: 'bg-amber-500', badge: 'bg-white/20 text-white border-white/30', num: 'text-white' };
  }
  if (cat.includes('annual') || cat.includes('event')) {
    return { cell: 'bg-purple-600', badge: 'bg-white/20 text-white border-white/30', num: 'text-white' };
  }
  
  // Working days (School Days)
  if (type.includes('school') || type.includes('working')) {
    return { cell: 'bg-emerald-600', badge: 'bg-white/20 text-white border-white/30', num: 'text-white' };
  }
  
  // Weekend / Off
  if (type.includes('weekend') || type.includes('saturday')) {
    return { cell: 'bg-slate-700', badge: 'bg-white/10 text-slate-300 border-white/10', num: 'text-slate-300' };
  }

  // Fallback
  return { cell: 'bg-indigo-600', badge: 'bg-white/20 text-white border-white/30', num: 'text-white' };
}
