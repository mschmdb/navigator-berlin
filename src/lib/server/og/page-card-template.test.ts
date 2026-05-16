import { describe, it, expect } from 'vitest';
import {
	buildBezirkCardVdom,
	buildKiezCardVdom,
	buildLayerCardVdom,
	type BezirkCardParams,
	type KiezCardParams,
	type LayerCardParams
} from './page-card-template.js';
import type { ScoreCardData } from './score-card-data.js';

function collectText(node: unknown): string[] {
	const result: string[] = [];
	function walk(n: unknown): void {
		if (n === null || n === undefined) return;
		if (typeof n === 'string') {
			result.push(n);
			return;
		}
		if (Array.isArray(n)) {
			for (const item of n) walk(item);
			return;
		}
		if (typeof n === 'object' && 'props' in (n as Record<string, unknown>)) {
			const props = (n as { props?: { children?: unknown } }).props;
			if (props && 'children' in props) walk(props.children);
		}
	}
	walk(node);
	return result;
}

function collectImgSources(node: unknown): string[] {
	const result: string[] = [];
	function walk(n: unknown): void {
		if (n === null || n === undefined) return;
		if (Array.isArray(n)) {
			for (const item of n) walk(item);
			return;
		}
		if (typeof n === 'object' && 'type' in (n as Record<string, unknown>)) {
			const obj = n as { type: string; props?: { src?: unknown; children?: unknown } };
			if (obj.type === 'img' && typeof obj.props?.src === 'string') {
				result.push(obj.props.src);
			}
			if (obj.props?.children !== undefined) walk(obj.props.children);
		}
	}
	walk(node);
	return result;
}

const fullScoreCard: ScoreCardData = {
	composite: 43,
	dims: [
		{ label: 'Ruhe', value: 27 },
		{ label: 'Grün', value: 31 },
		{ label: 'Mob.', value: 35 },
		{ label: 'Vers.', value: 62 }
	]
};

const emptyScoreCard: ScoreCardData = {
	composite: null,
	dims: [
		{ label: 'Ruhe', value: null },
		{ label: 'Grün', value: null },
		{ label: 'Mob.', value: null },
		{ label: 'Vers.', value: null }
	]
};

describe('buildBezirkCardVdom', () => {
	const params: BezirkCardParams = {
		bezirkName: 'Mitte',
		slug: 'mitte',
		scoreCard: fullScoreCard,
		scoreUpdatedAt: 'Mai 2026'
	};

	it('renders Bezirks-Name as headline', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		expect(texts.some((t) => t.includes('Mitte'))).toBe(true);
	});

	it('renders composite-score + all 4 dim values', () => {
		const joined = collectText(buildBezirkCardVdom(params)).join('|');
		expect(joined).toContain('43');
		expect(joined).toContain('Ruhe');
		expect(joined).toContain('27');
		expect(joined).toContain('Grün');
		expect(joined).toContain('31');
		expect(joined).toContain('Mob.');
		expect(joined).toContain('35');
		expect(joined).toContain('Vers.');
		expect(joined).toContain('62');
		expect(joined.toLowerCase()).toContain('kiez-score');
	});

	it('never renders Soziale Lage on OG-card (stigma protection)', () => {
		const joined = collectText(buildBezirkCardVdom(params)).join('|');
		expect(joined.toLowerCase()).not.toContain('soziale');
		expect(joined.toLowerCase()).not.toContain('mss');
	});

	it('renders navigator.berlin brand-line', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		expect(texts.some((t) => t.toLowerCase().includes('navigator.berlin'))).toBe(true);
	});

	it('renders Bezirks-Page-URL suffix', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		expect(texts.some((t) => t.includes('/bezirk/mitte'))).toBe(true);
	});

	it('renders Sub-Label „Bezirk Berlin"', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		expect(texts.some((t) => /Bezirk Berlin/i.test(t))).toBe(true);
	});

	it('falls back to en-dash when composite is null', () => {
		const joined = collectText(
			buildBezirkCardVdom({ ...params, scoreCard: emptyScoreCard })
		).join('|');
		expect(joined).toContain('–');
		expect(joined).not.toMatch(/—/);
	});

	it('never contains em-dash (U+2014)', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		for (const t of texts) {
			expect(t).not.toMatch(/—/);
		}
	});

	it('never contains the banned word „lebenswert"', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		for (const t of texts) {
			expect(t.toLowerCase()).not.toContain('lebenswert');
		}
	});

	it('returns a 1200×630 root container', () => {
		const vdom = buildBezirkCardVdom(params);
		const style = (vdom as unknown as { props: { style: { width: number; height: number } } })
			.props.style;
		expect(style.width).toBe(1200);
		expect(style.height).toBe(630);
	});

	it('renders logo <img> when logoDataUri is provided', () => {
		const dataUri = 'data:image/svg+xml;base64,FAKE_BASE64_LOGO';
		const sources = collectImgSources(
			buildBezirkCardVdom({ ...params, logoDataUri: dataUri })
		);
		expect(sources).toContain(dataUri);
	});

	it('renders no <img> when logoDataUri is omitted', () => {
		const sources = collectImgSources(buildBezirkCardVdom(params));
		expect(sources).toEqual([]);
	});
});

describe('buildKiezCardVdom', () => {
	const params: KiezCardParams = {
		kiezName: 'Boxhagener Kiez',
		slug: 'boxhagener-kiez',
		parentBezirkName: 'Friedrichshain-Kreuzberg',
		scoreCard: fullScoreCard
	};

	it('renders Kiez-Name as headline', () => {
		const texts = collectText(buildKiezCardVdom(params));
		expect(texts.some((t) => t.includes('Boxhagener Kiez'))).toBe(true);
	});

	it('renders parent-bezirk as sub-line', () => {
		const texts = collectText(buildKiezCardVdom(params));
		expect(texts.some((t) => t.includes('Friedrichshain-Kreuzberg'))).toBe(true);
	});

	it('renders Kiez-Page-URL suffix', () => {
		const texts = collectText(buildKiezCardVdom(params));
		expect(texts.some((t) => t.includes('/kiez/boxhagener-kiez'))).toBe(true);
	});

	it('handles empty score-card gracefully', () => {
		const joined = collectText(
			buildKiezCardVdom({ ...params, scoreCard: emptyScoreCard })
		).join('|');
		expect((joined.match(/–/g) ?? []).length).toBeGreaterThanOrEqual(5);
	});
});

describe('buildLayerCardVdom', () => {
	const params: LayerCardParams = {
		layerSlug: 'laerm-2023',
		layerLabel: 'Lärm 2023',
		bundleGroup: 'C: Umwelt',
		authority: 'Senatsverwaltung für Umwelt',
		license: 'dl-de/zero-2-0',
		sourceUpdatedAt: '2023-01-01'
	};

	it('renders Layer-Label as headline', () => {
		const texts = collectText(buildLayerCardVdom(params));
		expect(texts.some((t) => t.includes('Lärm 2023'))).toBe(true);
	});

	it('renders Bundle-Group as sub-line', () => {
		const texts = collectText(buildLayerCardVdom(params));
		expect(texts.some((t) => t.includes('C: Umwelt'))).toBe(true);
	});

	it('renders authority + license + stand-date as info cards', () => {
		const joined = collectText(buildLayerCardVdom(params)).join('|');
		expect(joined).toContain('Senatsverwaltung für Umwelt');
		expect(joined).toContain('dl-de/zero-2-0');
		expect(joined).toContain('2023-01-01');
		expect(joined.toLowerCase()).not.toContain('live');
		expect(joined.toLowerCase()).not.toContain('aktuell');
	});

	it('renders Layer-Page-URL suffix', () => {
		const texts = collectText(buildLayerCardVdom(params));
		expect(texts.some((t) => t.includes('/layer/laerm-2023'))).toBe(true);
	});

	it('renders logo when provided', () => {
		const dataUri = 'data:image/svg+xml;base64,LAYER_LOGO';
		const sources = collectImgSources(
			buildLayerCardVdom({ ...params, logoDataUri: dataUri })
		);
		expect(sources).toContain(dataUri);
	});
});
