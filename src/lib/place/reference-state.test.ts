import { beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({ goto: vi.fn() }));
const state = vi.hoisted(() => ({
	page: {
		url: new URL('https://navigator.berlin/kiez/mitte'),
		shallow: null as { url: URL } | null,
		state: {}
	}
}));
vi.mock('$app/navigation', () => ({ goto: nav.goto }));
vi.mock('$app/state', () => ({ page: state.page }));

const { PlaceViewState } = await import('./reference-state.svelte.ts');

const ctx = () => ({
	self: 'mitte',
	hasParent: true,
	neighbors: ['moabit'],
	similar: [],
	all: new Set(['mitte', 'moabit', 'wedding'])
});

beforeEach(() => {
	nav.goto.mockReset();
	state.page.url = new URL('https://navigator.berlin/kiez/mitte');
	state.page.shallow = null;
});

describe('PlaceViewState', () => {
	it('reads vs and lesart from page.url without shallow navigation', () => {
		state.page.url = new URL('https://navigator.berlin/kiez/mitte?vs=moabit&lesart=zahlen');
		const view = new PlaceViewState(ctx);
		view.readPage();
		expect(view.choice).toEqual({ kind: 'nachbar', slug: 'moabit' });
		expect(view.mode).toBe('zahlen');
	});

	it('keeps the comparison after Back to a shallow entry', () => {
		// Kit stellt nach Zurück page.url auf die Ausgangs-URL, die Auswahl steht in page.shallow.url.
		state.page.shallow = {
			url: new URL('https://navigator.berlin/kiez/mitte?vs=bezirk&lesart=zahlen')
		};
		const view = new PlaceViewState(ctx);
		view.readPage();
		expect(view.choice).toEqual({ kind: 'bezirk', slug: null });
		expect(view.mode).toBe('zahlen');
	});

	it('builds the next URL on top of the shallow URL', () => {
		state.page.shallow = {
			url: new URL('https://navigator.berlin/kiez/mitte?vs=moabit&lesart=zahlen')
		};
		const view = new PlaceViewState(ctx);
		view.readPage();
		view.setChoice({ kind: 'frei', slug: 'wedding' });
		const target = nav.goto.mock.calls[0][0] as URL;
		expect(target.searchParams.get('vs')).toBe('wedding');
		expect(target.searchParams.get('lesart')).toBe('zahlen');
		expect(nav.goto.mock.calls[0][1]).toMatchObject({ shallow: true, replace: true });
	});
});
