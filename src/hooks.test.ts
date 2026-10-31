import { describe, expect, it } from 'vitest';
import { reroute } from './hooks.js';

type RerouteArg = Parameters<typeof reroute>[0];

function run(url: string): string | void {
	return reroute({ url: new URL(url), fetch } as RerouteArg) as string | void;
}

describe('hooks.ts: reroute', () => {
	it('rendert /kaelte an der Wurzel der Kälte-Subdomain', () => {
		expect(run('https://kaelte.navigator.berlin/')).toBe('/kaelte');
	});

	it('rendert /hitze an der Wurzel der Hitze-Subdomain', () => {
		expect(run('https://hitze.navigator.berlin/')).toBe('/hitze');
	});

	it('rendert /stories an der Wurzel der Stories-Subdomain', () => {
		expect(run('https://stories.navigator.berlin/')).toBe('/stories');
	});

	it('rendert /stories auch an /en und /en/ der Stories-Subdomain', () => {
		expect(run('https://stories.navigator.berlin/en')).toBe('/stories');
		expect(run('https://stories.navigator.berlin/en/')).toBe('/stories');
	});

	it('delokalisiert /en/stories auf der Stories-Subdomain zu /stories', () => {
		expect(run('https://stories.navigator.berlin/en/stories')).toBe('/stories');
	});

	it('lässt die Wurzel der Hauptdomain auf /', () => {
		expect(run('https://navigator.berlin/')).toBe('/');
	});

	it('delokalisiert /en/kaelte auf der Hauptdomain zu /kaelte', () => {
		expect(run('https://navigator.berlin/en/kaelte')).toBe('/kaelte');
	});
});
