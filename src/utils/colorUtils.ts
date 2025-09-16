export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function opacity(color: string, alpha: number): string {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mix(
  color1: string,
  color2: string,
  percentage: number
): string {
  const { r: r1, g: g1, b: b1 } = hexToRgb(color1);
  const { r: r2, g: g2, b: b2 } = hexToRgb(color2);

  const r = Math.round(r1 + (r2 - r1) * percentage);
  const g = Math.round(g1 + (g2 - g1) * percentage);
  const b = Math.round(b1 + (b2 - b1) * percentage);

  return rgbToHex(r, g, b);
}

export function lighten(color: string, percentage: number): string {
  return mix(color, '#ffffff', percentage);
}

export function darken(color: string, percentage: number): string {
  return mix(color, '#000000', percentage);
}

export function adjustHue(color: string, degrees: number): string {
  const { r, g, b } = hexToRgb(color);

  // Convert RGB to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / delta + 2) / 6;
    } else {
      h = ((rNorm - gNorm) / delta + 4) / 6;
    }
  }

  // Adjust hue
  h = ((h * 360 + degrees) % 360) / 360;

  // Convert back to RGB
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let rNew, gNew, bNew;

  if (h < 1 / 6) {
    rNew = c;
    gNew = x;
    bNew = 0;
  } else if (h < 2 / 6) {
    rNew = x;
    gNew = c;
    bNew = 0;
  } else if (h < 3 / 6) {
    rNew = 0;
    gNew = c;
    bNew = x;
  } else if (h < 4 / 6) {
    rNew = 0;
    gNew = x;
    bNew = c;
  } else if (h < 5 / 6) {
    rNew = x;
    gNew = 0;
    bNew = c;
  } else {
    rNew = c;
    gNew = 0;
    bNew = x;
  }

  return rgbToHex(
    Math.round((rNew + m) * 255),
    Math.round((gNew + m) * 255),
    Math.round((bNew + m) * 255)
  );
}

export function getContrastColor(background: string): string {
  const { r, g, b } = hexToRgb(background);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
