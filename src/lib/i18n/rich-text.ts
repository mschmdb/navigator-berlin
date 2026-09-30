/**
 * Zerlegt eine Paraglide-Message mit Auszeichnungs-Platzhaltern
 * (`{link_start}Text{link_end}`) in Segmente, die eine Svelte-Komponente
 * ohne `{@html}` rendert.
 *
 * Der Aufrufer füllt die Platzhalter mit den Markern aus `t(name)`:
 * `richSegments((t) => m.key({ link_start: t('link').start, link_end: t('link').end }))`.
 * Marker liegen im Unicode-Private-Use-Bereich und kommen in Message-Texten nicht vor.
 *
 * Verschachtelung wird nicht unterstützt: ein Start-Marker innerhalb eines offenen
 * Tags ersetzt es. Ein End-Marker schließt nur das gleichnamige offene Tag, jeder
 * andere End-Marker bleibt wirkungslos und erscheint nicht im Text.
 */
export interface TagMarkers {
	readonly start: string;
	readonly end: string;
}

export interface RichSegment {
	readonly tag: string | null;
	readonly text: string;
}

const OPEN = '\uE000';
const CLOSE = '\uE001';
const SEGMENT_PATTERN = new RegExp(`${OPEN}([^${OPEN}${CLOSE}]+)${CLOSE}`, 'g');

function markers(name: string): TagMarkers {
	return { start: `${OPEN}${name}${CLOSE}`, end: `${OPEN}/${name}${CLOSE}` };
}

export function richSegments(render: (tag: (name: string) => TagMarkers) => string): RichSegment[] {
	const raw = render(markers);
	const segments: RichSegment[] = [];
	let openTag: string | null = null;
	let cursor = 0;

	const push = (tag: string | null, text: string): void => {
		if (text.length > 0) segments.push({ tag, text });
	};

	for (const match of raw.matchAll(SEGMENT_PATTERN)) {
		const marker = match[1] ?? '';
		const index = match.index ?? 0;
		push(openTag, raw.slice(cursor, index));
		cursor = index + match[0].length;
		if (marker.startsWith('/')) {
			if (marker.slice(1) === openTag) openTag = null;
		} else {
			openTag = marker;
		}
	}
	// Ein am Ende noch offener Tag hat kein Gegenstück: Rest ohne Tag ausgeben.
	push(null, raw.slice(cursor));
	return segments;
}
