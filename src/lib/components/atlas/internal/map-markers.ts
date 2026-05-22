export interface PinMarkerOptions {
	/** Füllfarbe des Pins (Hex). */
	readonly color: string;
	/** Optionaler Buchstabe/Kurzlabel (z. B. "A"/"B" im Vergleich). Ohne Label: weißer Innen-Kreis. */
	readonly label?: string;
}

// Geometrie-Koordinaten (viewBox). Display-Größe darunter separat, damit der Pin
// kleiner gerendert wird ohne die Pfad-Geometrie neu zu berechnen.
const GEO_W = 28;
const GEO_H = 38;
const PIN_W = 22;
const PIN_H = 30;
// Warmes Off-White (--bg-elevated) statt kaltem Pure-White: matcht POI-Pins + Editorial-Palette.
const PIN_RING = '#F5F3EA';
// Teardrop: Kopf-Kreis Zentrum (14,14), Spitze unten (14,37). Bottom-Anchor zeigt exakt auf Punkt.
const TEARDROP_PATH =
	'M14 1C6.82 1 1 6.82 1 14c0 9.75 13 23 13 23s13-13.25 13-23C27 6.82 21.18 1 14 1z';

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Baut deterministisches Teardrop-Pin-SVG. Gefüllt mit `color`, weiße Outline für
 * Kontrast auf wechselndem Basemap-Hintergrund. Mit Label: weißer Buchstabe im Kopf,
 * ohne Label: weißer Innen-Kreis.
 */
export function buildPinSvg({ color, label }: PinMarkerOptions): string {
	const inner = label
		? `<text x="14" y="19" text-anchor="middle" font-size="14" font-weight="700" fill="${PIN_RING}" font-family="system-ui, sans-serif">${escapeXml(label)}</text>`
		: `<circle cx="14" cy="14" r="5" fill="${PIN_RING}" />`;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GEO_W} ${GEO_H}" width="${PIN_W}" height="${PIN_H}">` +
		`<path d="${TEARDROP_PATH}" fill="${color}" stroke="${PIN_RING}" stroke-width="1.5" />` +
		inner +
		'</svg>'
	);
}

/**
 * Baut ein dekoratives Marker-DIV für MapLibre. `pointer-events: none` lässt Klicks
 * zur Karte durch (Toggle-Clear-Logik bleibt funktionsfähig). Adresse wird separat
 * per aria-live announced, daher aria-hidden.
 */
export function createPinMarkerElement(opts: PinMarkerOptions): HTMLDivElement {
	const el = document.createElement('div');
	el.className = 'pin-marker';
	el.setAttribute('aria-hidden', 'true');
	el.style.width = `${PIN_W}px`;
	el.style.height = `${PIN_H}px`;
	el.style.pointerEvents = 'none';
	// Editorial-leise: warmer, knapper Schatten zur Karten-Trennung, kein lautes Schwarz.
	el.style.filter = 'drop-shadow(0 1px 1px rgba(58,52,40,0.22))';
	el.innerHTML = buildPinSvg(opts);
	return el;
}
