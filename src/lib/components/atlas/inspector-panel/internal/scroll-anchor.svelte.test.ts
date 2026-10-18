import { afterEach, describe, expect, it } from 'vitest';
import {
	anchorOf,
	captureScrollAnchor,
	createAnchorKeeper,
	findScrollContainer,
	restoreScrollAnchor
} from './scroll-anchor.js';

/**
 * Baut einen scrollbaren Container mit Blöcken fester Höhe. Jeder Block trägt
 * `data-scroll-anchor`; Blöcke mit `children` verschachteln Anker wie im
 * Inspector (Abschnitt > Datensatz).
 */
type Block = { key: string; height: number; children?: Block[] };

function renderBlock(block: Block): HTMLElement {
	const el = document.createElement('div');
	el.dataset.scrollAnchor = block.key;
	if (block.children) {
		for (const child of block.children) el.appendChild(renderBlock(child));
	} else {
		el.style.height = `${block.height}px`;
	}
	return el;
}

function mount(blocks: Block[], height = 300): HTMLElement {
	const container = document.createElement('div');
	container.style.height = `${height}px`;
	container.style.overflowY = 'auto';
	container.dataset.testid = 'container';
	for (const b of blocks) container.appendChild(renderBlock(b));
	document.body.appendChild(container);
	return container;
}

function topOf(container: HTMLElement, key: string): number {
	const el = container.querySelector<HTMLElement>(`[data-scroll-anchor="${key}"]`)!;
	return el.getBoundingClientRect().top - container.getBoundingClientRect().top;
}

const LAYOUT: Block[] = [
	{ key: 'score', height: 400 },
	{ key: 'wahl', height: 300 },
	{
		key: 'section:umwelt',
		height: 0,
		children: [
			{ key: 'hit:laerm-2023', height: 200 },
			{ key: 'hit:luft-2023', height: 200 }
		]
	},
	{
		key: 'section:klima',
		height: 0,
		children: [{ key: 'hit:klima-pet-2022', height: 400 }]
	}
];

afterEach(() => {
	document.body.innerHTML = '';
});

describe('captureScrollAnchor', () => {
	it('liefert null, solange der Container oben steht', () => {
		const c = mount(LAYOUT);
		expect(captureScrollAnchor(c)).toBeNull();
	});

	it('merkt sich den innersten Anker an der Oberkante samt Versatz und die äußeren als Rückfall', () => {
		const c = mount(LAYOUT);
		// score 400 + wahl 300 = 700: Lärm beginnt bei 700. 720 → Lärm ragt 20 px über die Kante.
		c.scrollTop = 720;
		const anchor = captureScrollAnchor(c);
		expect(anchor?.map((a) => a.key)).toEqual(['hit:laerm-2023', 'section:umwelt']);
		expect(anchor?.[0].offset).toBe(-20);
	});
});

describe('anchorOf', () => {
	it('baut die Anker-Kette für ein gezieltes Element samt Versatz', () => {
		const c = mount(LAYOUT);
		c.scrollTop = 800;
		const luft = c.querySelector<HTMLElement>('[data-scroll-anchor="hit:luft-2023"]')!;
		const anchor = anchorOf(c, luft);
		expect(anchor.map((a) => a.key)).toEqual(['hit:luft-2023', 'section:umwelt']);
		expect(anchor[0].offset).toBe(100);
	});
});

describe('restoreScrollAnchor', () => {
	it('stellt denselben Datensatz an dieselbe Stelle, wenn Inhalt darüber schrumpft', () => {
		const c = mount(LAYOUT);
		c.scrollTop = 720;
		const anchor = captureScrollAnchor(c)!;
		// Neue Adresse: Score und Wahl noch nicht geladen, also kaum Höhe.
		c.querySelector<HTMLElement>('[data-scroll-anchor="score"]')!.style.height = '40px';
		c.querySelector<HTMLElement>('[data-scroll-anchor="wahl"]')!.style.height = '0px';
		expect(restoreScrollAnchor(c, anchor)).toBe(true);
		expect(topOf(c, 'hit:laerm-2023')).toBe(-20);
	});

	it('weicht auf den Abschnitt aus und zeigt dessen Anfang, wenn der Datensatz fehlt', () => {
		const c = mount(LAYOUT);
		// Tief im Abschnitt: Luft beginnt bei 900, Kante bei 950.
		c.scrollTop = 950;
		const anchor = captureScrollAnchor(c)!;
		expect(anchor[0].key).toBe('hit:luft-2023');
		c.querySelector('[data-scroll-anchor="hit:luft-2023"]')!.remove();
		expect(restoreScrollAnchor(c, anchor)).toBe(true);
		// Der kürzere Abschnitt darf nicht über die Kante rutschen: sein Anfang steht oben.
		expect(topOf(c, 'section:umwelt')).toBe(0);
	});

	it('meldet false, wenn keiner der Anker mehr existiert', () => {
		const c = mount(LAYOUT);
		c.scrollTop = 720;
		const anchor = captureScrollAnchor(c)!;
		c.querySelector('[data-scroll-anchor="section:umwelt"]')!.remove();
		expect(restoreScrollAnchor(c, anchor)).toBe(false);
	});
});

describe('findScrollContainer', () => {
	it('findet den nächsten scrollbaren Vorfahren', () => {
		const c = mount(LAYOUT);
		const inner = c.querySelector<HTMLElement>('[data-scroll-anchor="hit:luft-2023"]')!;
		expect(findScrollContainer(inner)).toBe(c);
	});

	it('nimmt das Element selbst, wenn es scrollt', () => {
		const c = mount(LAYOUT);
		expect(findScrollContainer(c)).toBe(c);
	});
});

describe('createAnchorKeeper', () => {
	it('hält den Anker bei jedem Nachladen, bis die Person selbst scrollt', async () => {
		const c = mount(LAYOUT);
		c.scrollTop = 720;
		const anchor = captureScrollAnchor(c)!;
		const keeper = createAnchorKeeper(c, anchor, { maxMs: 5000 });

		const score = c.querySelector<HTMLElement>('[data-scroll-anchor="score"]')!;
		score.style.height = '40px';
		keeper.reapply();
		expect(topOf(c, 'hit:laerm-2023')).toBe(-20);

		score.style.height = '600px';
		keeper.reapply();
		expect(topOf(c, 'hit:laerm-2023')).toBe(-20);

		c.dispatchEvent(new WheelEvent('wheel', { deltaY: 50 }));
		score.style.height = '100px';
		keeper.reapply();
		expect(keeper.active).toBe(false);
		keeper.stop();
	});
});
