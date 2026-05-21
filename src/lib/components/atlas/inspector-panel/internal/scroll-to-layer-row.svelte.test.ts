import { describe, expect, it, vi } from 'vitest';
import { scrollToLayerHitRow } from './scroll-to-layer-row.js';

function createRow(layer: string, testid = 'layer-hit-row'): HTMLElement {
	const el = document.createElement('div');
	el.setAttribute('data-testid', testid);
	el.setAttribute('data-layer', layer);
	el.scrollIntoView = vi.fn();
	return el;
}

describe('scrollToLayerHitRow', () => {
	it('liefert false wenn container null ist', () => {
		expect(scrollToLayerHitRow(null, 'stolpersteine')).toBe(false);
	});

	it('liefert false wenn slug null ist', () => {
		const c = document.createElement('div');
		expect(scrollToLayerHitRow(c, null)).toBe(false);
	});

	it('liefert false wenn keine matching Row gefunden wird', () => {
		const c = document.createElement('div');
		c.appendChild(createRow('bezirke'));
		expect(scrollToLayerHitRow(c, 'stolpersteine')).toBe(false);
	});

	it('ruft scrollIntoView auf der matching Row und liefert true', () => {
		const c = document.createElement('div');
		const target = createRow('stolpersteine');
		c.appendChild(createRow('bezirke'));
		c.appendChild(target);
		const result = scrollToLayerHitRow(c, 'stolpersteine');
		expect(result).toBe(true);
		expect(target.scrollIntoView).toHaveBeenCalled();
	});

	it('respektiert prefers-reduced-motion-Option (behavior=auto statt smooth)', () => {
		const c = document.createElement('div');
		const target = createRow('kitas-2024');
		c.appendChild(target);
		scrollToLayerHitRow(c, 'kitas-2024', { reducedMotion: true });
		expect(target.scrollIntoView).toHaveBeenCalledWith(
			expect.objectContaining({ behavior: 'auto' })
		);
	});

	it('findet auch LayerCard-Variante (data-testid=layer-card)', () => {
		const c = document.createElement('div');
		const target = createRow('kitas-2024', 'layer-card');
		c.appendChild(target);
		expect(scrollToLayerHitRow(c, 'kitas-2024')).toBe(true);
		expect(target.scrollIntoView).toHaveBeenCalled();
	});

	it('default behavior ist smooth', () => {
		const c = document.createElement('div');
		const target = createRow('schulen-2024');
		c.appendChild(target);
		scrollToLayerHitRow(c, 'schulen-2024');
		expect(target.scrollIntoView).toHaveBeenCalledWith(
			expect.objectContaining({ behavior: 'smooth' })
		);
	});
});
