import { useState } from 'react';
import toast from 'react-hot-toast';
import { Palette } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';

const Theme = () => {
  const { isDark, toggleDark, primary, setPrimary, PRIMARY_COLORS } = useTheme();
  // Ensure localColor is a hex value for the color picker
  const [localColor, setLocalColor] = useState(PRIMARY_COLORS[primary] || primary);

  const handleApply = () => {
    if (localColor !== primary && localColor !== PRIMARY_COLORS[primary]) {
      setPrimary(localColor);
    }
    toast.success('Theme applied!');
  };

  const getContrastText = (hex) => {
    try {
      let c = hex.substring(1);
      if(c.length === 3) c = c.split('').map(x => x + x).join('');
      const r = parseInt(c.slice(0, 2), 16);
      const g = parseInt(c.slice(2, 4), 16);
      const b = parseInt(c.slice(4, 6), 16);
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return (yiq >= 128) ? '#0f172a' : '#ffffff';
    } catch {
      return '#ffffff';
    }
  };

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)' }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Palette size={18} style={{ color: 'var(--accent)' }} />
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
          Theme & Appearance
        </h2>
      </div>

      {/* Dark mode toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer group">
          {/* Custom toggle */}
          <button
            role="switch"
            aria-checked={isDark}
            onClick={toggleDark}
            className={clsx(
              'relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none',
              isDark ? 'bg-indigo-600' : 'bg-slate-300'
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300',
                isDark ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
            Dark Mode
          </span>
        </label>
      </div>

      {/* Color presets and Custom Picker */}
      <div className="mb-8">
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-2)' }}>
          School Primary Color
        </p>
        <p className="text-xs text-slate-500 mb-4">Choose a preset or pick your school's exact brand color.</p>
        
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {Object.entries(PRIMARY_COLORS).map(([name, hex]) => (
            <button
              key={name}
              title={name}
              onClick={() => setLocalColor(hex)}
              className={clsx(
                'w-10 h-10 rounded-full transition-all duration-200 ring-offset-2',
                (localColor === hex || localColor === name)
                  ? 'ring-2 ring-white scale-110 shadow-lg'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              )}
              style={{
                background: hex,
                ringOffsetColor: isDark ? '#07090f' : '#eef2f7',
              }}
            />
          ))}
          
          <div className="w-px h-8 bg-slate-700/50 mx-2"></div>
          
          {/* Custom Color Picker */}
          <div className="relative group">
            <input
              type="color"
              value={localColor.startsWith('#') ? localColor : PRIMARY_COLORS[localColor] || '#6366f1'}
              onChange={(e) => setLocalColor(e.target.value)}
              className="absolute opacity-0 w-full h-full cursor-pointer inset-0 z-10"
              title="Pick a custom color"
            />
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-dashed border-slate-500 transition-all group-hover:border-slate-300 shadow-sm"
              style={{
                background: localColor.startsWith('#') && !Object.values(PRIMARY_COLORS).includes(localColor) 
                  ? localColor 
                  : 'transparent',
                boxShadow: localColor.startsWith('#') && !Object.values(PRIMARY_COLORS).includes(localColor)
                  ? `0 0 0 2px white, 0 0 0 4px ${isDark ? '#07090f' : '#eef2f7'}`
                  : 'none'
              }}
            >
               {!(localColor.startsWith('#') && !Object.values(PRIMARY_COLORS).includes(localColor)) && (
                 <Palette size={16} className="text-slate-400 group-hover:text-slate-200" />
               )}
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">{localColor.startsWith('#') ? localColor : PRIMARY_COLORS[localColor] || '#6366f1'}</span>
        </div>

        {/* Live Preview */}
        <div className="p-5 rounded-xl border border-slate-800/60 bg-black/20 flex flex-col items-center justify-center">
           <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Live Preview</p>
           <button 
             className="px-6 py-2.5 rounded-lg font-semibold transition shadow-lg"
             style={{ 
               backgroundColor: localColor, 
               color: getContrastText(localColor.startsWith('#') ? localColor : PRIMARY_COLORS[localColor] || '#6366f1') 
             }}
           >
             Interactive Element
           </button>
           <p className="text-xs mt-3 text-center max-w-sm" style={{ color: 'var(--text-3)' }}>
             The text color automatically adjusts to remain readable on your chosen brand color.
           </p>
        </div>
      </div>

      <Button onClick={handleApply} style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
        Apply Theme
      </Button>
    </div>
  );
};

export default Theme;
