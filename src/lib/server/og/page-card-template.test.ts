import { describe, it, expect } from 'vitest';
import {
	buildBezirkCardVdom,
	buildKiezCardVdom,
	buildLayerCardVdom,
	type BezirkCardParams,
	type KiezCardParams,
	type LayerCardParams
} from './page-card-template.js';

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

describe('buildBezirkCardVdom', () => {
	const params: BezirkCardParams = {
		bezirkName: 'Mitte',
		slug: 'mitte',
		topStats: [
			{ label: 'Lärm', value: 'Hoch', layer: 'laerm-2023', sourceUpdatedAt: '2023-01-01' },
			{ label: 'PET', value: '32.5 °C', layer: 'klima-pet-2022', sourceUpdatedAt: '2022-08-01' },
			{ label: 'Stationen', value: '8.2/km²', layer: 'oepnv', sourceUpdatedAt: '2025-01-01' }
		]
	};

	it('renders Bezirks-Name as headline', () => {
		const vdom = buildBezirkCardVdom(params);
		const texts = collectText(vdom);
		expect(texts.some((t) => t.includes('Mitte'))).toBe(true);
	});

	it('renders all 3 stat-labels and values', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		const joined = texts.join('|');
		expect(joined).toContain('Lärm');
		expect(joined).toContain('Hoch');
		expect(joined).toContain('PET');
		expect(joined).toContain('32.5 °C');
		expect(joined).toContain('Stationen');
		expect(joined).toContain('8.2/km²');
	});

	it('renders navigator.berlin brand-line', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		expect(texts.some((t) => t.toLowerCase().includes('navigator.berlin'))).toBe(true);
	});

	it('renders Bezirks-Page-URL suffix', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		expect(texts.some((t) => t.includes('/bezirk/mitte'))).toBe(true);
	});

	it('renders Sub-Label „Bezirk Berlin" so reader knows context', () => {
		const texts = collectText(buildBezirkCardVdom(params));
		expect(texts.some((t) => /Bezirk Berlin/i.test(t))).toBe(true);
	});

	it('never contains em-dash (U+2014) in any text node', () => {
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

	it('returns a 1200×630 root container for OG-Card-Format', () => {
		const vdom = buildBezirkCardVdom(params);
		const style = (vdom as unknown as { props: { style: { width: number; height: number } } })
			.props.style;
		expect(style.width).toBe(1200);
		expect(style.height).toBe(630);
	});
});

describe('buildKiezCardVdom', () => {
	const params: KiezCardParams = {
		kiezName: 'Boxhagener Kiez',
		slug: 'boxhagener-kiez',
		parentBezirkName: 'Friedrichshain-Kreuzberg',
		topStats: [
			{ label: 'Lärm', value: '–', layer: null, sourceUpdatedAt: null },
			{ label: 'PET', value: '–', layer: null, sourceUpdatedAt: null },
			{ label: 'Stationen', value: '–', layer: null, sourceUpdatedAt: null }
		]
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

	it('handles all-placeholder stats gracefully', () => {
		const texts = collectText(buildKiezCardVdom(params));
		const placeholders = texts.filter((t) => t === '–');
		expect(placeholders.length).toBeGreaterThanOrEqual(3);
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

	it('renders authority + license + stand-date as info cards (no live-data wording)', () => {
		const texts = collectText(buildLayerCardVdom(params));
		const joined = texts.join('|');
		expect(joined).toContain('Senatsverwaltung für Umwelt');
		expect(joined).toContain('dl-de/zero-2-0');
		expect(joined).toContain('2023-01-01');
		// kein Live-Daten-Wording (memory feedback_no_live_data)
		expect(joined.toLowerCase()).not.toContain('live');
		expect(joined.toLowerCase()).not.toContain('aktuell');
	});

	it('renders Layer-Page-URL suffix', () => {
		const texts = collectText(buildLayerCardVdom(params));
		expect(texts.some((t) => t.includes('/layer/laerm-2023'))).toBe(true);
	});
});
