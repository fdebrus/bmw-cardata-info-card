// src/const/imgconst.ts

// Helper to convert raw SVG to data URI
export const toDataUri = (svg: string) =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

// -----------------------------------------------------------------------------
// Raw SVG sources
// -----------------------------------------------------------------------------

const darkSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='#0b0f1a'/>
      <stop offset='1' stop-color='#0e1a2d'/>
    </linearGradient>
    <linearGradient id='accent' x1='0' y1='0' x2='1' y2='0'>
      <stop offset='0' stop-color='#2a86ff'/>
      <stop offset='1' stop-color='#69d6ff'/>
    </linearGradient>
  </defs>
  <rect width='800' height='450' fill='url(#bg)'/>
  <rect x='-40' y='330' width='880' height='180' rx='90' fill='url(#accent)' opacity='0.18'/>
  <circle cx='120' cy='110' r='70' fill='#0f2c4d'/>
  <circle cx='120' cy='110' r='48' fill='#0c8ed9' opacity='0.7'/>
  <text x='720' y='95' text-anchor='end' font-family='Arial, Helvetica, sans-serif' font-size='42' font-weight='700' fill='#e6f2ff'>BMW</text>
  <text x='720' y='135' text-anchor='end' font-family='Arial, Helvetica, sans-serif' font-size='16' fill='#8fb6ff'>M Power Inspired</text>
</svg>`;

const lightSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='#f6f8fb'/>
      <stop offset='1' stop-color='#dfe9f8'/>
    </linearGradient>
    <linearGradient id='accent' x1='0' y1='0' x2='1' y2='0'>
      <stop offset='0' stop-color='#1c6cd4'/>
      <stop offset='1' stop-color='#7fd7ff'/>
    </linearGradient>
  </defs>
  <rect width='800' height='450' fill='url(#bg)'/>
  <rect x='-30' y='330' width='860' height='170' rx='85' fill='url(#accent)' opacity='0.18'/>
  <circle cx='110' cy='110' r='66' fill='#e1ecf9'/>
  <circle cx='110' cy='110' r='44' fill='#0c8ed9' opacity='0.5'/>
  <text x='720' y='95' text-anchor='end' font-family='Arial, Helvetica, sans-serif' font-size='42' font-weight='700' fill='#0c2a52'>BMW</text>
  <text x='720' y='135' text-anchor='end' font-family='Arial, Helvetica, sans-serif' font-size='16' fill='#2a7ac2'>Connected Drive</text>
</svg>`;

const tyreSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'>
  <defs>
    <radialGradient id='bg' cx='0.32' cy='0.38' r='0.85'>
      <stop offset='0%' stop-color='#111827' stop-opacity='0.9'/>
      <stop offset='100%' stop-color='#0b101a' stop-opacity='0.6'/>
    </radialGradient>
  </defs>
  <rect width='320' height='180' fill='url(#bg)'/>
  <g stroke='#2a86ff' stroke-width='6' stroke-opacity='0.35' fill='none'>
    <path d='M15 140 Q80 110 160 125 T305 140'/>
    <path d='M40 155 Q120 130 200 145 T320 160'/>
  </g>
  <g fill='#0c8ed9' opacity='0.35'>
    <circle cx='70' cy='70' r='10'/>
    <circle cx='120' cy='55' r='8'/>
    <circle cx='160' cy='80' r='6'/>
    <circle cx='210' cy='60' r='9'/>
    <circle cx='260' cy='75' r='7'/>
  </g>
</svg>`;

const spinnerSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
  <circle cx='60' cy='60' r='50' fill='none' stroke='#1c6cd4' stroke-width='10' opacity='0.25'/>
  <path d='M110 60a50 50 0 0 1-50 50' fill='none' stroke='#2a86ff' stroke-width='10' stroke-linecap='round'/>
</svg>`;

// -----------------------------------------------------------------------------
// Encoded simple icons (already as data URIs)
// -----------------------------------------------------------------------------

export const carBlockedIcon =
  'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22M7.5%2C2C5.71%2C3.15%204.5%2C5.18%204.5%2C7.5C4.5%2C9.82%205.71%2C11.85%207.53%2C13C4.46%2C13%202%2C10.54%202%2C7.5A5.5%2C5.5%200%200%2C1%207.5%2C2M19.07%2C3.5L20.5%2C4.93L4.93%2C20.5L3.5%2C19.07L19.07%2C3.5M12.89%2C5.93L11.41%2C5L9.97%2C6L10.39%2C4.3L9%2C3.24L10.75%2C3.12L11.33%2C1.47L12%2C3.1L13.73%2C3.13L12.38%2C4.26L12.89%2C5.93M9.59%2C9.54L8.43%2C8.81L7.31%2C9.59L7.65%2C8.27L6.56%2C7.44L7.92%2C7.35L8.37%2C6.06L8.88%2C7.33L10.24%2C7.36L9.19%2C8.23L9.59%2C9.54M19%2C13.5A5.5%2C5.5%200%200%2C1%2013.5%2C19C12.28%2C19%2011.15%2C18.6%2010.24%2C17.93L17.93%2C10.24C18.6%2C11.15%2019%2C12.28%2019%2C13.5M14.6%2C20.08L17.37%2C18.93L17.13%2C22.28L14.6%2C20.08M18.93%2C17.38L20.08%2C14.61L22.28%2C17.15L18.93%2C17.38M20.08%2C12.42L18.94%2C9.64L22.28%2C9.88L20.08%2C12.42M9.63%2C18.93L12.4%2C20.08L9.87%2C22.27L9.63%2C18.93Z%22%20fill%3D%22currentcolor%22%20%2F%3E%3C%2Fsvg%3E';

export const carLocationIcon =
  'data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%2033%2033%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xml%3Aspace%3D%22preserve%22%3E%3Cpath%20d%3D%22M13.213%2022.15a8.91%208.91%200%200%201%203.425-7.025H6.875l2.063-6.188h15.125l1.679%205.033a9%209%200%200%201%203.013%202.171L26.017%208.25a2.06%202.06%200%200%200-1.954-1.375H8.938A2.06%202.06%200%200%200%206.984%208.25L4.125%2016.5v11A1.38%201.38%200%200%200%205.5%2028.875h1.375A1.38%201.38%200%200%200%208.25%2027.5v-1.375h5.9a8.96%208.96%200%200%201-.933-3.975M8.938%2022a2.058%202.058%200%201%201-.008-4.117A2.058%202.058%200%200%201%208.938%2022m19.538%206.463-.013.013zm-6.325-12.5a6.16%206.16%200%200%201%206.188%206.188c0%201.225-.346%202.35-.95%203.288l4.236%204.274-1.913%201.913-4.275-4.221a6.25%206.25%200%200%201-3.288.933c-3.438%200-6.188-2.75-6.188-6.188s2.75-6.188%206.188-6.188m0%202.75a3.438%203.438%200%201%200%203.438%203.438%203.417%203.417%200%200%200-3.438-3.438%22%20fill%3D%22currentcolor%22%2F%3E%3C%2Fsvg%3E';

// -----------------------------------------------------------------------------
// Data URI exports for main backgrounds
// -----------------------------------------------------------------------------

export const amgBlack = toDataUri(darkSvg);
export const amgWhite = toDataUri(lightSvg);
export const tyreBg = toDataUri(tyreSvg);
export const logoLoading = toDataUri(spinnerSvg);

// -----------------------------------------------------------------------------
// Central image map and types
// -----------------------------------------------------------------------------

export const IMAGE = {
  amgBlack,
  amgWhite,
  tyreBg,
  logoLoading,
  carBlockedIcon,
  carLocationIcon,
};

export type ImageMap = typeof IMAGE;
export type ImageKey = keyof ImageMap;
