import { describe, expect, it } from 'vitest';
import {
	resolveAppMode,
	isHitzeMode,
	hitzeReroute,
	kaelteReroute,
	storiesReroute,
	pageviewPathFor,
	isLayerAvailableInMode,
	modeForLayer,
	resolveLayerModeCatchUp,
	resolveExplorerEntry
} from './app-mode.js';

describe('kaelte-Subdomain', () => {
	it('erkennt kaelte.-Subdomain als eigenen Modus', () => {
		expect(resolveAppMode('kaelte.navigator.berlin')).toBe('kaelte');
		expect(resolveAppMode('KAELTE.navigator.berlin')).toBe('kaelte');
	});

	it('?mode=kaelte schaltet den Kälte-Modus auch auf der Hauptdomain ein', () => {
		expect(resolveAppMode('navigator.berlin', 'kaelte')).toBe('kaelte');
		expect(resolveAppMode('hitze.navigator.berlin', 'kaelte')).toBe('kaelte');
	});

	it('?mode=default überschreibt den Kälte-Host', () => {
		expect(resolveAppMode('kaelte.navigator.berlin', 'default')).toBe('default');
	});

	it('kaelteReroute rewritet die Wurzel auf /kaelte', () => {
		expect(kaelteReroute(new URL('https://kaelte.navigator.berlin/'))).toBe('/kaelte');
	});

	it('kaelteReroute lässt andere Pfade und Hosts unangetastet', () => {
		expect(kaelteReroute(new URL('https://kaelte.navigator.berlin/explore'))).toBeNull();
		expect(kaelteReroute(new URL('https://kaelte.navigator.berlin/kaelte'))).toBeNull();
		expect(kaelteReroute(new URL('https://navigator.berlin/'))).toBeNull();
		expect(kaelteReroute(new URL('https://hitze.navigator.berlin/'))).toBeNull();
	});

	it('hitzeReroute greift nicht auf der kaelte-Subdomain', () => {
		expect(hitzeReroute(new URL('https://kaelte.navigator.berlin/'))).toBeNull();
	});
});

describe('pageviewPathFor', () => {
	it('meldet die Kälte-Wurzel als /kaelte', () => {
		expect(pageviewPathFor(new URL('https://kaelte.navigator.berlin/'))).toBe('/kaelte');
	});

	it('meldet die Hitze-Wurzel als /hitze', () => {
		expect(pageviewPathFor(new URL('https://hitze.navigator.berlin/'))).toBe('/hitze');
	});

	it('lässt andere Pfade der Subdomains unverändert', () => {
		expect(pageviewPathFor(new URL('https://kaelte.navigator.berlin/explore'))).toBeUndefined();
		expect(pageviewPathFor(new URL('https://hitze.navigator.berlin/explore'))).toBeUndefined();
	});

	it('lässt die Hauptdomain unverändert', () => {
		expect(pageviewPathFor(new URL('https://navigator.berlin/'))).toBeUndefined();
	});
});

describe('resolveAppMode', () => {
	it('erkennt hitze.-Subdomain', () => {
		expect(resolveAppMode('hitze.navigator.berlin')).toBe('hitze');
		expect(resolveAppMode('HITZE.navigator.berlin')).toBe('hitze');
	});

	it('default für die Hauptdomain', () => {
		expect(resolveAppMode('navigator.berlin')).toBe('default');
		expect(resolveAppMode('www.navigator.berlin')).toBe('default');
	});

	it('Override schlägt Host (lokales Testen)', () => {
		expect(resolveAppMode('navigator.berlin', 'hitze')).toBe('hitze');
		expect(resolveAppMode('hitze.navigator.berlin', 'default')).toBe('default');
	});

	it('unbekannter Override wird ignoriert, Fallback auf Host', () => {
		expect(resolveAppMode('hitze.navigator.berlin', 'quatsch')).toBe('hitze');
		expect(resolveAppMode('navigator.berlin', '')).toBe('default');
	});

	it('null/leerer Host ist default', () => {
		expect(resolveAppMode(null)).toBe('default');
		expect(resolveAppMode(undefined)).toBe('default');
		expect(resolveAppMode('')).toBe('default');
	});

	it('isHitzeMode', () => {
		expect(isHitzeMode('hitze')).toBe(true);
		expect(isHitzeMode('default')).toBe(false);
	});
});

describe('hitzeReroute', () => {
	it('rewritet die Wurzel der Hitze-Subdomain auf /hitze', () => {
		expect(hitzeReroute(new URL('https://hitze.navigator.berlin/'))).toBe('/hitze');
	});

	it('lässt andere Pfade der Hitze-Subdomain unangetastet', () => {
		expect(hitzeReroute(new URL('https://hitze.navigator.berlin/explore'))).toBeNull();
		expect(hitzeReroute(new URL('https://hitze.navigator.berlin/hitze'))).toBeNull();
	});

	it('greift nicht auf der Hauptdomain', () => {
		expect(hitzeReroute(new URL('https://navigator.berlin/'))).toBeNull();
	});

	it('Override erlaubt lokales Testen (localhost als hitze)', () => {
		expect(hitzeReroute(new URL('http://localhost:5174/'), 'hitze')).toBe('/hitze');
	});
});

describe('Layer-Verfügbarkeit je Modus', () => {
	it('kuehle-orte nur im Hitze-Modus', () => {
		expect(isLayerAvailableInMode('kuehle-orte', 'hitze')).toBe(true);
		expect(isLayerAvailableInMode('kuehle-orte', 'default')).toBe(false);
		expect(isLayerAvailableInMode('kuehle-orte', 'kaelte')).toBe(false);
	});

	it('waerme-orte nur im Kälte-Modus', () => {
		expect(isLayerAvailableInMode('waerme-orte', 'kaelte')).toBe(true);
		expect(isLayerAvailableInMode('waerme-orte', 'default')).toBe(false);
		expect(isLayerAvailableInMode('waerme-orte', 'hitze')).toBe(false);
	});

	it('alle anderen Layer überall', () => {
		for (const mode of ['default', 'hitze', 'kaelte'] as const) {
			expect(isLayerAvailableInMode('laerm-den', mode)).toBe(true);
		}
	});

	it('modeForLayer liefert den Modus nur für die beiden Orte-Layer', () => {
		expect(modeForLayer('kuehle-orte')).toBe('hitze');
		expect(modeForLayer('waerme-orte')).toBe('kaelte');
		expect(modeForLayer('laerm-den')).toBeNull();
	});
});

describe('resolveLayerModeCatchUp', () => {
	it('zieht den Modus vom ersten passenden Layer nach', () => {
		expect(resolveLayerModeCatchUp(['laerm-den', 'kuehle-orte'])).toBe('hitze');
		expect(resolveLayerModeCatchUp(['waerme-orte', 'kuehle-orte'])).toBe('kaelte');
	});

	it('liefert null ohne Orte-Layer', () => {
		expect(resolveLayerModeCatchUp(['laerm-den'])).toBeNull();
		expect(resolveLayerModeCatchUp([])).toBeNull();
	});
});

describe('modeForLayer Prototyp-Schlüssel', () => {
	it('liefert null für constructor und __proto__', () => {
		expect(modeForLayer('constructor')).toBeNull();
		expect(modeForLayer('__proto__')).toBeNull();
	});
});

describe('resolveExplorerEntry', () => {
	it('zieht Hitze nach und behält andere Layer', () => {
		expect(resolveExplorerEntry(['kuehle-orte', 'laerm-den'], 'default', null)).toEqual({
			catchUpMode: 'hitze',
			layers: ['kuehle-orte', 'laerm-den'],
			rewrite: true
		});
	});

	it('zieht Kälte nach', () => {
		expect(resolveExplorerEntry(['waerme-orte'], 'default', null)).toEqual({
			catchUpMode: 'kaelte',
			layers: ['waerme-orte'],
			rewrite: true
		});
	});

	it('Stories-Host zieht den Modus wie default nach', () => {
		expect(resolveExplorerEntry(['kuehle-orte', 'laerm-den'], 'stories', null)).toEqual({
			catchUpMode: 'hitze',
			layers: ['kuehle-orte', 'laerm-den'],
			rewrite: true
		});
	});

	it('beide Layer: der erste gewinnt, der andere fällt weg', () => {
		expect(resolveExplorerEntry(['kuehle-orte', 'waerme-orte'], 'default', null)).toEqual({
			catchUpMode: 'hitze',
			layers: ['kuehle-orte'],
			rewrite: true
		});
	});

	it('falscher expliziter Modus: Layer fällt weg, kein Nachzug', () => {
		expect(resolveExplorerEntry(['waerme-orte'], 'hitze', 'hitze')).toEqual({
			catchUpMode: null,
			layers: [],
			rewrite: true
		});
	});

	it('explizites mode=default verhindert den Nachzug', () => {
		expect(resolveExplorerEntry(['kuehle-orte'], 'default', 'default')).toEqual({
			catchUpMode: null,
			layers: [],
			rewrite: true
		});
	});

	it('ungültiger mode-Wert zählt als fehlend', () => {
		expect(resolveExplorerEntry(['kuehle-orte'], 'default', 'foo').catchUpMode).toBe('hitze');
		expect(resolveExplorerEntry(['kuehle-orte'], 'default', '').catchUpMode).toBe('hitze');
	});

	it('ohne Orte-Layer kein Rewrite', () => {
		expect(resolveExplorerEntry(['laerm-den'], 'default', null)).toEqual({
			catchUpMode: null,
			layers: ['laerm-den'],
			rewrite: false
		});
	});
});

describe('stories-Subdomain', () => {
	it('erkennt stories.-Subdomain als eigenen Modus', () => {
		expect(resolveAppMode('stories.navigator.berlin')).toBe('stories');
		expect(resolveAppMode('STORIES.navigator.berlin')).toBe('stories');
	});

	it('?mode=stories ist kein Override, nur der Host entscheidet', () => {
		expect(resolveAppMode('navigator.berlin', 'stories')).toBe('default');
	});

	it('storiesReroute rewritet die Wurzel auf /stories', () => {
		expect(storiesReroute(new URL('https://stories.navigator.berlin/'))).toBe('/stories');
	});

	it('storiesReroute rewritet auch die englische Wurzel', () => {
		expect(storiesReroute(new URL('https://stories.navigator.berlin/en'))).toBe('/stories');
		expect(storiesReroute(new URL('https://stories.navigator.berlin/en/'))).toBe('/stories');
		expect(storiesReroute(new URL('https://navigator.berlin/en'))).toBeNull();
	});

	it('storiesReroute lässt andere Pfade und Hosts unangetastet', () => {
		expect(storiesReroute(new URL('https://stories.navigator.berlin/stories'))).toBeNull();
		expect(storiesReroute(new URL('https://stories.navigator.berlin/explore'))).toBeNull();
		expect(storiesReroute(new URL('https://navigator.berlin/'))).toBeNull();
		expect(storiesReroute(new URL('https://kaelte.navigator.berlin/'))).toBeNull();
	});

	it('hitze- und kaelteReroute greifen nicht auf der stories-Subdomain', () => {
		expect(hitzeReroute(new URL('https://stories.navigator.berlin/'))).toBeNull();
		expect(kaelteReroute(new URL('https://stories.navigator.berlin/'))).toBeNull();
	});

	it('pageviewPathFor meldet die Stories-Wurzel als /stories', () => {
		expect(pageviewPathFor(new URL('https://stories.navigator.berlin/'))).toBe('/stories');
		expect(pageviewPathFor(new URL('https://stories.navigator.berlin/stories/x'))).toBeUndefined();
	});

	it('der Stories-Modus schaltet keine Layer frei', () => {
		expect(isLayerAvailableInMode('kuehle-orte', 'stories')).toBe(false);
		expect(isLayerAvailableInMode('waerme-orte', 'stories')).toBe(false);
		expect(isLayerAvailableInMode('laerm-den', 'stories')).toBe(true);
	});
});
