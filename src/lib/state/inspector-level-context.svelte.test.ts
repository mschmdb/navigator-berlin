import { describe, expect, it } from 'vitest';
import { mount, unmount } from 'svelte';
import MissingProvider from './inspector-level-missing-provider.svelte';
import {
	createInspectorLevelState,
	getInspectorLevelState,
	setLevel,
	applySpatialContext,
	canResolveLevel,
	type InspectorLevelState
} from './inspector-level-context.svelte.js';
import type { SpatialContext } from '$lib/data/resolve-spatial-level.js';

function makeState(): InspectorLevelState {
	return {
		currentLevel: 'address',
		kiezSlug: null,
		kiezName: null,
		bezirkSlug: null,
		bezirkName: null
	};
}

describe('inspector-level-context', () => {
	it('Default currentLevel = address, Slugs null', () => {
		const s = makeState();
		expect(s.currentLevel).toBe('address');
		expect(s.kiezSlug).toBeNull();
		expect(s.bezirkSlug).toBeNull();
	});

	it('setLevel mutiert currentLevel', () => {
		const s = makeState();
		setLevel(s, 'bezirk');
		expect(s.currentLevel).toBe('bezirk');
		setLevel(s, 'kiez');
		expect(s.currentLevel).toBe('kiez');
	});

	it('applySpatialContext schreibt Slugs + Namen in State', () => {
		const s = makeState();
		const ctx: SpatialContext = {
			kiezSlug: 'tiergarten-sued',
			kiezName: 'Tiergarten Süd',
			bezirkSlug: 'mitte',
			bezirkName: 'Mitte'
		};
		applySpatialContext(s, ctx);
		expect(s.kiezSlug).toBe('tiergarten-sued');
		expect(s.kiezName).toBe('Tiergarten Süd');
		expect(s.bezirkSlug).toBe('mitte');
		expect(s.bezirkName).toBe('Mitte');
	});

	it('canResolveLevel: address+berlin immer true, kiez/bezirk abhängig vom Slug', () => {
		const s = makeState();
		expect(canResolveLevel(s, 'address')).toBe(true);
		expect(canResolveLevel(s, 'berlin')).toBe(true);
		expect(canResolveLevel(s, 'kiez')).toBe(false);
		expect(canResolveLevel(s, 'bezirk')).toBe(false);
		applySpatialContext(s, {
			kiezSlug: 'tiergarten-sued',
			kiezName: 'Tiergarten Süd',
			bezirkSlug: 'mitte',
			bezirkName: 'Mitte'
		});
		expect(canResolveLevel(s, 'kiez')).toBe(true);
		expect(canResolveLevel(s, 'bezirk')).toBe(true);
	});

	it('applySpatialContext mit null-Kontext (außerhalb Berlin) reset auf null', () => {
		const s = makeState();
		applySpatialContext(s, {
			kiezSlug: 'mitte',
			kiezName: 'Mitte',
			bezirkSlug: 'mitte',
			bezirkName: 'Mitte'
		});
		applySpatialContext(s, {
			kiezSlug: null,
			kiezName: null,
			bezirkSlug: null,
			bezirkName: null
		});
		expect(s.kiezSlug).toBeNull();
		expect(s.bezirkSlug).toBeNull();
	});

	it('getInspectorLevelState wirft, wenn kein Provider in Context', () => {
		const host = document.createElement('div');
		expect(() => {
			const cmp = mount(MissingProvider, { target: host });
			unmount(cmp);
		}).toThrow();
	});

	it('Exporte createInspectorLevelState + getInspectorLevelState sind Funktionen', () => {
		expect(typeof createInspectorLevelState).toBe('function');
		expect(typeof getInspectorLevelState).toBe('function');
	});
});
