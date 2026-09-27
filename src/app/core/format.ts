export const DEMO_PASSWORD = '12345678';

export function formatInr(amount: number | null | undefined): string {
  const value = amount ?? 0;
  if (value >= 10000000) {
    const crore = value / 10000000;
    const text = crore >= 10 || Number.isInteger(crore) ? String(Math.round(crore * 100) / 100) : crore.toFixed(2);
    return `₹${trimNumber(text)} Crore`;
  }
  if (value >= 100000) {
    const lakh = value / 100000;
    const text = Number.isInteger(lakh) ? String(lakh) : lakh.toFixed(2);
    return `₹${trimNumber(text)} Lakhs`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function trimNumber(value: string): string {
  return value.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export function localISODate(offsetDays = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
}

export function localISODateTime(offsetDays = 0, time = '10:00:00'): string {
  return `${localISODate(offsetDays)}T${time}`;
}

export function nextId(ids: string[], prefix: string): string {
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  let max = 1000;
  for (const id of ids) {
    const match = pattern.exec(id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${max + 1}`;
}

export function cityFor(location: string): string {
  if (location === 'Kavali') return 'Kavali';
  if (location === 'Gudur') return 'Gudur';
  return 'Nellore';
}

export function clip(text: string, length = 110): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= length) return clean;
  return `${clean.slice(0, length - 1).trim()}…`;
}
