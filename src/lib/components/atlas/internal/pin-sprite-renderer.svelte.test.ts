import { describe, expect, it } from 'vitest';
import { loadPinImage, registerPinIcons, pinImageId } from './pin-sprite-renderer.js';
import { PIN_ICON_MAP } from './pin-icon-mapping.js';
import { COLORS } from './colors.js';

describe('pin-sprite-renderer.loadPinImage (browser)', () => {
	it('liefert ein HTMLImageElement nach Load', async () => {
		const spec = PIN_ICON_MAP['stolpersteine'];
		const img = await loadPinImage(spec, COLORS[spec.colorToken]);
		expect(img).toBeInstanceOf(HTMLImageElement);
		expect(img.complete).toBe(true);
		expect(img.naturalWidth).toBeGreaterThan(0);
	});
});

describe('pin-sprite-renderer.registerPinIcons', () => {
	function createFakeMap() {
		const added: Record<string, unknown> = {};
		return {
			added,
			hasImage: (id: string) => id in added,
			addImage: (id: string, img: unknown) => {
				added[id] = img;
			}
		};
	}

	it('registriert ein Image pro Slug mit pinImageId-Key', async () => {
		const map = createFakeMap();
		await registerPinIcons(map, PIN_ICON_MAP, (token) => COLORS[token]);
		for (const slug of Object.keys(PIN_ICON_MAP)) {
			expect(map.added[pinImageId(slug)]).toBeInstanceOf(HTMLImageElement);
		}
	});

	it('skipt bereits registrierte IDs (Idempotenz)', async () => {
		const map = createFakeMap();
		await registerPinIcons(map, PIN_ICON_MAP, (token) => COLORS[token]);
		const before = map.added[pinImageId('kitas-2024')];
		await registerPinIcons(map, PIN_ICON_MAP, (token) => COLORS[token]);
		const after = map.added[pinImageId('kitas-2024')];
		expect(after).toBe(before);
	});
});
