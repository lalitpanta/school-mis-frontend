import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const PRIMARY_COLORS = {
  indigo:  '#6366f1',
  violet:  '#7c3aed',
  sky:     '#0ea5e9',
  emerald: '#10b981',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
};

const hexToRgb = (hex) => {
  let c = hex.substring(1);      // strip #
  if(c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16)
  };
};

const rgbToHex = (r, g, b) => '#' + [r,g,b].map(x => {
  const hex = x.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}).join('');

const mix = (r1, g1, b1, r2, g2, b2, weight) => {
  return rgbToHex(
    Math.round(r1 * weight + r2 * (1 - weight)),
    Math.round(g1 * weight + g2 * (1 - weight)),
    Math.round(b1 * weight + b2 * (1 - weight))
  );
};

const getContrastText = (r, g, b) => {
  // YIQ equation from W3C
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#0f172a' : '#ffffff'; // dark slate for light backgrounds, white for dark
};

const applyToDOM = (isDark, primary) => {
  const html = document.documentElement;
  if (isDark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  
  // check if primary is a preset or a hex code
  const color = PRIMARY_COLORS[primary] || primary;
  
  html.style.setProperty('--accent', color);
  
  try {
    const { r, g, b } = hexToRgb(color);
    html.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.18)`);
    html.style.setProperty('--accent-text', getContrastText(r, g, b));
    
    // Override Tailwind indigo palette globally
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    
    html.style.setProperty('--color-indigo-50', mix(r, g, b, white[0], white[1], white[2], 0.05));
    html.style.setProperty('--color-indigo-100', mix(r, g, b, white[0], white[1], white[2], 0.1));
    html.style.setProperty('--color-indigo-200', mix(r, g, b, white[0], white[1], white[2], 0.2));
    html.style.setProperty('--color-indigo-300', mix(r, g, b, white[0], white[1], white[2], 0.4));
    html.style.setProperty('--color-indigo-400', mix(r, g, b, white[0], white[1], white[2], 0.6));
    html.style.setProperty('--color-indigo-500', rgbToHex(r, g, b));
    html.style.setProperty('--color-indigo-600', mix(r, g, b, black[0], black[1], black[2], 0.8));
    html.style.setProperty('--color-indigo-700', mix(r, g, b, black[0], black[1], black[2], 0.6));
    html.style.setProperty('--color-indigo-800', mix(r, g, b, black[0], black[1], black[2], 0.4));
    html.style.setProperty('--color-indigo-900', mix(r, g, b, black[0], black[1], black[2], 0.2));
    html.style.setProperty('--color-indigo-950', mix(r, g, b, black[0], black[1], black[2], 0.1));
  } catch (e) {
    // fallback if invalid hex
    html.style.setProperty('--accent-dim', 'rgba(99,102,241,0.18)');
    html.style.setProperty('--accent-text', '#ffffff');
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDark,  setIsDark]  = useState(() => {
    const saved = localStorage.getItem('mis_theme');
    return saved ? saved === 'dark' : true; // default dark
  });
  const [primary, setPrimaryState] = useState(
    () => localStorage.getItem('mis_primary') || 'indigo'
  );

  // Apply on mount + changes
  useEffect(() => {
    applyToDOM(isDark, primary);
  }, [isDark, primary]);

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('mis_theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const setPrimary = useCallback((color) => {
    setPrimaryState(color);
    localStorage.setItem('mis_primary', color);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleDark, primary, setPrimary, PRIMARY_COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

export default ThemeContext;
