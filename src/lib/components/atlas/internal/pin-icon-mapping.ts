import type { ColorToken } from './colors.js';

export interface SvgNode {
	readonly tag: 'path' | 'circle' | 'rect' | 'line';
	readonly attrs: Readonly<Record<string, string | number>>;
}

export interface PinIconSpec {
	/** Lucide-Icon-Name (kebab-case, identisch zur @lucide/svelte-Datei). */
	readonly iconName: string;
	/** COLORS-Key in internal/colors.ts. */
	readonly colorToken: ColorToken;
	/** SVG-Elemente innerhalb von viewBox="0 0 24 24". Aus @lucide/svelte iconNode kopiert (ISC). */
	readonly svgNodes: readonly SvgNode[];
}

// Quelle: @lucide/svelte v1.14.0 iconNode-Daten (ISC-Lizenz). Inline-Kopie ermoeglicht
// Runtime-Canvas-Rendering ohne Build-Step (Story 1.15 Scope-Pivot 2026-05-14).
export const PIN_ICON_MAP: Readonly<Record<string, PinIconSpec>> = {
	stolpersteine: {
		iconName: 'bookmark',
		colorToken: 'memorialStolperstein',
		svgNodes: [
			{
				tag: 'path',
				attrs: {
					d: 'M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z'
				}
			}
		]
	},
	trinkbrunnen: {
		iconName: 'droplet',
		colorToken: 'umweltTrinkbrunnen',
		svgNodes: [
			{
				tag: 'path',
				attrs: {
					d: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z'
				}
			}
		]
	},
	'kuehle-orte': {
		iconName: 'snowflake',
		colorToken: 'umweltKuehleOrte',
		svgNodes: [
			{ tag: 'path', attrs: { d: 'm10 20-1.25-2.5L6 18' } },
			{ tag: 'path', attrs: { d: 'M10 4 8.75 6.5 6 6' } },
			{ tag: 'path', attrs: { d: 'm14 20 1.25-2.5L18 18' } },
			{ tag: 'path', attrs: { d: 'm14 4 1.25 2.5L18 6' } },
			{ tag: 'path', attrs: { d: 'm17 21-3-6h-4' } },
			{ tag: 'path', attrs: { d: 'm17 3-3 6 1.5 3' } },
			{ tag: 'path', attrs: { d: 'M2 12h6.5L10 9' } },
			{ tag: 'path', attrs: { d: 'm20 10-1.5 2 1.5 2' } },
			{ tag: 'path', attrs: { d: 'M22 12h-6.5L14 15' } },
			{ tag: 'path', attrs: { d: 'm4 10 1.5 2L4 14' } },
			{ tag: 'path', attrs: { d: 'm7 21 3-6-1.5-3' } },
			{ tag: 'path', attrs: { d: 'm7 3 3 6h4' } }
		]
	},
	'kitas-2024': {
		iconName: 'baby',
		colorToken: 'sozialKita',
		svgNodes: [
			{ tag: 'path', attrs: { d: 'M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5' } },
			{ tag: 'path', attrs: { d: 'M15 12h.01' } },
			{
				tag: 'path',
				attrs: {
					d: 'M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1'
				}
			},
			{ tag: 'path', attrs: { d: 'M9 12h.01' } }
		]
	},
	'schulen-2024': {
		iconName: 'school',
		colorToken: 'sozialSchule',
		svgNodes: [
			{ tag: 'path', attrs: { d: 'M14 21v-3a2 2 0 0 0-4 0v3' } },
			{ tag: 'path', attrs: { d: 'M18 4.933V21' } },
			{ tag: 'path', attrs: { d: 'm4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6' } },
			{
				tag: 'path',
				attrs: {
					d: 'm6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11'
				}
			},
			{ tag: 'path', attrs: { d: 'M6 4.933V21' } },
			{ tag: 'circle', attrs: { cx: '12', cy: '9', r: '2' } }
		]
	},
	'krankenhaeuser-plan': {
		iconName: 'plus',
		colorToken: 'sozialKrankenhaus',
		svgNodes: [
			{ tag: 'path', attrs: { d: 'M5 12h14' } },
			{ tag: 'path', attrs: { d: 'M12 5v14' } }
		]
	},
	'krankenhaeuser-weitere': {
		iconName: 'plus',
		colorToken: 'sozialKrankenhausSecondary',
		svgNodes: [
			{ tag: 'path', attrs: { d: 'M5 12h14' } },
			{ tag: 'path', attrs: { d: 'M12 5v14' } }
		]
	},
	'sportanlagen-2024': {
		iconName: 'dumbbell',
		colorToken: 'sozialSport',
		svgNodes: [
			{
				tag: 'path',
				attrs: {
					d: 'M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z'
				}
			},
			{ tag: 'path', attrs: { d: 'm2.5 21.5 1.4-1.4' } },
			{ tag: 'path', attrs: { d: 'm20.1 3.9 1.4-1.4' } },
			{
				tag: 'path',
				attrs: {
					d: 'M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z'
				}
			},
			{ tag: 'path', attrs: { d: 'm9.6 14.4 4.8-4.8' } }
		]
	},
	schwimmbaeder: {
		iconName: 'waves',
		colorToken: 'sozialSchwimmbad',
		svgNodes: [
			{ tag: 'path', attrs: { d: 'M2 12q2.5 2 5 0t5 0 5 0 5 0' } },
			{ tag: 'path', attrs: { d: 'M2 19q2.5 2 5 0t5 0 5 0 5 0' } },
			{ tag: 'path', attrs: { d: 'M2 5q2.5 2 5 0t5 0 5 0 5 0' } }
		]
	},
	'ubahn-stationen': {
		iconName: 'train-front',
		colorToken: 'mobilityUbahn',
		svgNodes: [
			{ tag: 'path', attrs: { d: 'M8 3.1V7a4 4 0 0 0 8 0V3.1' } },
			{ tag: 'path', attrs: { d: 'm9 15-1-1' } },
			{ tag: 'path', attrs: { d: 'm15 15 1-1' } },
			{ tag: 'path', attrs: { d: 'M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z' } },
			{ tag: 'path', attrs: { d: 'm8 19-2 3' } },
			{ tag: 'path', attrs: { d: 'm16 19 2 3' } }
		]
	},
	'sbahn-stationen': {
		iconName: 'train-track',
		colorToken: 'mobilitySbahn',
		svgNodes: [
			{ tag: 'path', attrs: { d: 'M2 17 17 2' } },
			{ tag: 'path', attrs: { d: 'm2 14 8 8' } },
			{ tag: 'path', attrs: { d: 'm5 11 8 8' } },
			{ tag: 'path', attrs: { d: 'm8 8 8 8' } },
			{ tag: 'path', attrs: { d: 'm11 5 8 8' } },
			{ tag: 'path', attrs: { d: 'm14 2 8 8' } },
			{ tag: 'path', attrs: { d: 'M7 22 22 7' } }
		]
	},
	'tram-haltestellen': {
		iconName: 'tram-front',
		colorToken: 'mobilityTram',
		svgNodes: [
			{ tag: 'rect', attrs: { width: '16', height: '16', x: '4', y: '3', rx: '2' } },
			{ tag: 'path', attrs: { d: 'M4 11h16' } },
			{ tag: 'path', attrs: { d: 'M12 3v8' } },
			{ tag: 'path', attrs: { d: 'm8 19-2 3' } },
			{ tag: 'path', attrs: { d: 'm18 22-2-3' } },
			{ tag: 'path', attrs: { d: 'M8 15h.01' } },
			{ tag: 'path', attrs: { d: 'M16 15h.01' } }
		]
	},
	'bus-haltestellen': {
		iconName: 'bus',
		colorToken: 'mobilityBus',
		svgNodes: [
			{ tag: 'path', attrs: { d: 'M8 6v6' } },
			{ tag: 'path', attrs: { d: 'M15 6v6' } },
			{ tag: 'path', attrs: { d: 'M2 12h19.6' } },
			{
				tag: 'path',
				attrs: {
					d: 'M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3'
				}
			},
			{ tag: 'circle', attrs: { cx: '7', cy: '18', r: '2' } },
			{ tag: 'path', attrs: { d: 'M9 18h5' } },
			{ tag: 'circle', attrs: { cx: '16', cy: '18', r: '2' } }
		]
	}
};

export const PIN_LAYER_SLUGS: ReadonlySet<string> = new Set(Object.keys(PIN_ICON_MAP));

export function getPinIcon(slug: string): PinIconSpec | null {
	return PIN_ICON_MAP[slug] ?? null;
}

export function hasPinIcon(slug: string): boolean {
	return PIN_LAYER_SLUGS.has(slug);
}
