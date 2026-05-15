// OKLCH-Interpolation für Choropleth-Skalen. Story 1.31 / AC-10.
// Pure-Function-Module: keine I/O. Build-Time im Style-Pipeline + Run-Time-Snapshot-Tests.

export interface Oklch {
	readonly l: number;
	readonly c: number;
	readonly h: number;
}

interface Rgb {
	readonly r: number;
	readonly g: number;
	readonly b: number;
}

function clamp01(x: number): number {
	return Math.max(0, Math.min(1, x));
}

function hexToRgb(hex: string): Rgb {
	const m = hex.replace('#', '');
	const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
	const r = parseInt(full.substring(0, 2), 16) / 255;
	const g = parseInt(full.substring(2, 4), 16) / 255;
	const b = parseInt(full.substring(4, 6), 16) / 255;
	return { r, g, b };
}

function rgbToHex({ r, g, b }: Rgb): string {
	const to2 = (v: number) =>
		Math.round(clamp01(v) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${to2(r)}${to2(g)}${to2(b)}`;
}

function srgbToLinear(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
	return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function rgbLinear({ r, g, b }: Rgb): Rgb {
	return { r: srgbToLinear(r), g: srgbToLinear(g), b: srgbToLinear(b) };
}

function rgbFromLinear({ r, g, b }: Rgb): Rgb {
	return { r: linearToSrgb(r), g: linearToSrgb(g), b: linearToSrgb(b) };
}

// sRGB linear → OKLab (Björn Ottosson, https://bottosson.github.io/posts/oklab/)
function linearRgbToOklab({ r, g, b }: Rgb): { l: number; a: number; b: number } {
	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
	const l_ = Math.cbrt(l);
	const m_ = Math.cbrt(m);
	const s_ = Math.cbrt(s);
	return {
		l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
		a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
		b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
	};
}

function oklabToLinearRgb({ l, a, b }: { l: number; a: number; b: number }): Rgb {
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;
	const lc = l_ ** 3;
	const mc = m_ ** 3;
	const sc = s_ ** 3;
	return {
		r: +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
		g: -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
		b: -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc
	};
}

export function hexToOklch(hex: string): Oklch {
	const lab = linearRgbToOklab(rgbLinear(hexToRgb(hex)));
	const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
	let h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
	if (h < 0) h += 360;
	return { l: lab.l, c, h };
}

export function oklchToHex({ l, c, h }: Oklch): string {
	const hRad = (h * Math.PI) / 180;
	const a = c * Math.cos(hRad);
	const b = c * Math.sin(hRad);
	const lin = oklabToLinearRgb({ l, a, b });
	const srgb = rgbFromLinear(lin);
	return rgbToHex(srgb);
}

export function interpolateOklchScale(
	startHex: string,
	endHex: string,
	steps: number
): readonly string[] {
	if (steps < 2) throw new Error(`interpolateOklchScale: steps muss ≥ 2 sein (war ${steps})`);
	const start = hexToOklch(startHex);
	const end = hexToOklch(endHex);
	const out: string[] = [];
	for (let i = 0; i < steps; i++) {
		const t = i / (steps - 1);
		const l = start.l + (end.l - start.l) * t;
		const c = start.c + (end.c - start.c) * t;
		// Shortest-Path Hue (modulo 360)
		let dh = end.h - start.h;
		if (dh > 180) dh -= 360;
		if (dh < -180) dh += 360;
		let h = start.h + dh * t;
		h = ((h % 360) + 360) % 360;
		out.push(oklchToHex({ l, c, h }));
	}
	return out;
}

export function relativeLuminance(hex: string): number {
	const { r, g, b } = rgbLinear(hexToRgb(hex));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number {
	const lA = relativeLuminance(hexA);
	const lB = relativeLuminance(hexB);
	const [lighter, darker] = lA >= lB ? [lA, lB] : [lB, lA];
	return (lighter + 0.05) / (darker + 0.05);
}

export function ensureMinContrast(
	candidateHex: string,
	backgroundHex: string,
	minRatio: number,
	maxIterations = 10
): string {
	if (contrastRatio(candidateHex, backgroundHex) >= minRatio) return candidateHex;
	const oklch = hexToOklch(candidateHex);
	// Direction = away from background-luminance. Bg hell → dunkler nachjustieren.
	const bgLum = relativeLuminance(backgroundHex);
	const direction = bgLum >= 0.5 ? -1 : +1;
	const step = 0.08;
	let { l } = oklch;
	for (let i = 0; i < maxIterations; i++) {
		l = clamp01(l + direction * step);
		const hex = oklchToHex({ l, c: oklch.c, h: oklch.h });
		if (contrastRatio(hex, backgroundHex) >= minRatio) return hex;
	}
	throw new Error(
		`oklch-interpolate: kann SC 1.4.11 nicht erfüllen (${candidateHex} vs ${backgroundHex}, minRatio ${minRatio}, nach ${maxIterations} Iterationen)`
	);
}
