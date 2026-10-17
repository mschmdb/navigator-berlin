import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
	buildBezirkCardVdom,
	buildKiezCardVdom,
	buildLayerCardVdom,
	buildPageCardVdom,
	buildWahlCardVdom,
	type SatoriNode
} from './page-card-template.js';
import { buildOgCardVdom, loadDefaultOgFonts } from '$lib/utils/og-card-renderer.js';
import type { ScoreCardData } from './score-card-data.js';

// #132: OG-Karten folgen der Typografie aus #87. Plex Sans mit Gewichtsstufen,
// keine Serif, kein Mono, keine Versalien-Labels, kein Mittelpunkt als Trenner.

interface Collected {
	styles: Record<string, unknown>[];
	texts: string[];
}

function collect(root: unknown): Collected {
	const styles: Record<string, unknown>[] = [];
	const texts: string[] = [];
	function walk(n: unknown): void {
		if (n === null || n === undefined) return;
		if (typeof n === 'string') {
			texts.push(n);
			return;
		}
		if (Array.isArray(n)) {
			for (const item of n) walk(item);
			return;
		}
		if (typeof n === 'object' && 'props' in (n as Record<string, unknown>)) {
			const props = (n as SatoriNode).props;
			if (props.style) styles.push(props.style);
			walk(props.children);
		}
	}
	walk(root);
	return { styles, texts };
}

const scoreCard: ScoreCardData = {
	composite: 43,
	dims: [
		{ label: 'Ruhe', value: 27 },
		{ label: 'Grün', value: 31 },
		{ label: 'Mobilität', value: 35 },
		{ label: 'Versorgung', value: 62 }
	]
};

const cards: Array<[string, SatoriNode]> = [
	[
		'bezirk',
		buildBezirkCardVdom({
			bezirkName: 'Mitte',
			slug: 'mitte',
			scoreCard,
			scoreUpdatedAt: 'Mai 2026'
		})
	],
	[
		'kiez',
		buildKiezCardVdom({
			kiezName: 'Südliche Luisenstadt',
			slug: 'suedliche-luisenstadt',
			parentBezirkName: 'Friedrichshain-Kreuzberg',
			scoreCard,
			scoreUpdatedAt: 'Mai 2026'
		})
	],
	[
		'layer',
		buildLayerCardVdom({
			layerSlug: 'laerm-2023',
			layerLabel: 'Lärmbelastung 2023',
			bundleGroup: 'C: Umwelt',
			authority: 'SenMVKU',
			license: 'dl-de/by-2.0',
			sourceUpdatedAt: 'Juni 2024'
		})
	],
	[
		'page',
		buildPageCardVdom({
			headline: 'Methodik',
			subline: 'Kiez-Score aus fünf Dimensionen',
			body: 'So entsteht der Kiez-Score.',
			footerUrl: '/methodik'
		})
	],
	[
		'wahl',
		buildWahlCardVdom({
			title: 'Abgeordnetenhaus 2026, Zweitstimme',
			subline: 'Berlin gesamt, Top-5-Parteien',
			slug: '2026-agh-zweitstimme',
			top5: [
				{ kurzname: 'CDU', anteil: 0.25, farbeHex: '#000000' },
				{ kurzname: 'GRÜNE', anteil: 0.18, farbeHex: '#1AA037' }
			],
			sourceName: 'Landeswahlleiterin Berlin',
			license: 'dl-de/by-2.0'
		})
	],
	[
		'share',
		buildOgCardVdom({
			address: 'Wiener Straße 20',
			lat: 52.49845,
			lng: 13.43177,
			bezirk: 'Friedrichshain-Kreuzberg',
			topLayers: ['Lärm: gering', 'Grün: hoch'],
			generatedDate: '17.10.2026'
		})
	]
];

describe.each(cards)('OG-Karte %s', (_name, vdom) => {
	const { styles, texts } = collect(vdom);

	it('nutzt nur Plex Sans', () => {
		const families = styles
			.map((s) => s.fontFamily)
			.filter((f): f is string => typeof f === 'string');
		expect(families.length).toBeGreaterThan(0);
		expect(new Set(families)).toEqual(new Set(['Plex Sans']));
	});

	it('setzt keine Versalien-Labels', () => {
		expect(styles.filter((s) => s.textTransform === 'uppercase')).toEqual([]);
	});

	it('nutzt keinen Mittelpunkt als Trenner', () => {
		expect(texts.filter((t) => t.includes('·'))).toEqual([]);
	});

	it('setzt Gewichte nur aus 400, 600 und 700', () => {
		const weights = styles.map((s) => s.fontWeight).filter((w) => w !== undefined);
		for (const w of weights) expect([400, 600, 700]).toContain(w);
	});
});

describe('OG-Überschrift', () => {
	it('steht in Plex Sans 700', () => {
		const { styles } = collect(cards[0][1]);
		const headline = styles.find((s) => s.fontSize === 64);
		expect(headline?.fontFamily).toBe('Plex Sans');
		expect(headline?.fontWeight).toBe(700);
	});
});

describe('loadDefaultOgFonts', () => {
	it('lädt nur Plex Sans in 400, 600 und 700', async () => {
		const fonts = await loadDefaultOgFonts();
		expect(new Set(fonts.map((f) => f.name))).toEqual(new Set(['Plex Sans']));
		expect(fonts.map((f) => f.weight).sort()).toEqual([400, 600, 700]);
	});
});

describe('generate-og-images.ts', () => {
	it('enthält keine Mittelpunkt-Trenner in Sublines oder Titeln', () => {
		const source = readFileSync(resolve('scripts/generate-og-images.ts'), 'utf8');
		expect(source.includes('·')).toBe(false);
	});
});
