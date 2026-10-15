import type { CSSProperties } from 'react';

/**
 * Gaya tooltip Recharts yang terbaca di tema terang & gelap. Recharts mewarnai
 * baris nilai dengan warna seri (bisa gelap), jadi itemStyle wajib eksplisit.
 */
export const chartTooltipProps = {
  contentStyle: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '12px',
    fontSize: '12px',
    padding: '8px 12px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
  } as CSSProperties,
  labelStyle: { color: '#ffffff', fontWeight: 600, marginBottom: 2 } as CSSProperties,
  itemStyle: { color: '#e2e8f0', padding: 0 } as CSSProperties,
  cursor: { fill: 'rgba(148, 163, 184, 0.15)' }
};
