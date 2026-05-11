import { describe, expect, it, vi } from 'vitest';
import { handleMapKeydown, type MapHandle } from './map-keyboard.js';
import { BERLIN_BBOX_ARRAY } from '$lib/data/constants.js';

type Mocked = {
	[K in keyof MapHandle]: ReturnType<typeof vi.fn>;
};

function makeHandle(): Mocked {
	return {
		panBy: vi.fn(),
		zoomIn: vi.fn(),
		zoomOut: vi.fn(),
		fitBounds: vi.fn(),
		jumpTo: vi.fn(),
		getCanvasWidth: vi.fn(() => 800),
		getCanvasHeight: vi.fn(() => 600)
	};
}

function asHandle(m: Mocked): MapHandle {
	return m as unknown as MapHandle;
}

function ev(key: string): { key: string; preventDefault: () => void; defaultPrevented: boolean } {
	let prevented = false;
	return {
		key,
		preventDefault: () => {
			prevented = true;
		},
		get defaultPrevented() {
			return prevented;
		}
	};
}

describe('handleMapKeydown', () => {
	it('ArrowUp → panBy ~10% canvas-Hoehe nach Norden (negative y)', () => {
		const handle = makeHandle();
		const e = ev('ArrowUp');
		handleMapKeydown(e, asHandle(handle), false);
		expect(handle.panBy).toHaveBeenCalledTimes(1);
		const [[dx, dy]] = handle.panBy.mock.calls[0] as [[number, number]];
		expect(dx).toBe(0);
		expect(dy).toBeCloseTo(-60, 0);
	});

	it('ArrowDown → positive y', () => {
		const handle = makeHandle();
		handleMapKeydown(ev('ArrowDown'), asHandle(handle), false);
		const [[, dy]] = handle.panBy.mock.calls[0] as [[number, number]];
		expect(dy).toBeCloseTo(60, 0);
	});

	it('ArrowLeft → negative x', () => {
		const handle = makeHandle();
		handleMapKeydown(ev('ArrowLeft'), asHandle(handle), false);
		const [[dx]] = handle.panBy.mock.calls[0] as [[number, number]];
		expect(dx).toBeCloseTo(-80, 0);
	});

	it('ArrowRight → positive x', () => {
		const handle = makeHandle();
		handleMapKeydown(ev('ArrowRight'), asHandle(handle), false);
		const [[dx]] = handle.panBy.mock.calls[0] as [[number, number]];
		expect(dx).toBeCloseTo(80, 0);
	});

	it('+ und = → zoomIn', () => {
		const handle = makeHandle();
		handleMapKeydown(ev('+'), asHandle(handle), false);
		handleMapKeydown(ev('='), asHandle(handle), false);
		expect(handle.zoomIn).toHaveBeenCalledTimes(2);
	});

	it('- → zoomOut', () => {
		const handle = makeHandle();
		handleMapKeydown(ev('-'), asHandle(handle), false);
		expect(handle.zoomOut).toHaveBeenCalledTimes(1);
	});

	it('Home → fitBounds Berlin', () => {
		const handle = makeHandle();
		handleMapKeydown(ev('Home'), asHandle(handle), false);
		expect(handle.fitBounds).toHaveBeenCalledWith(BERLIN_BBOX_ARRAY);
	});

	it('Escape → onClearSelection', () => {
		const handle = makeHandle();
		const onClear = vi.fn();
		handleMapKeydown(ev('Escape'), asHandle(handle), false, onClear);
		expect(onClear).toHaveBeenCalledTimes(1);
	});

	it('reduced-motion: zoomIn nutzt animate:false', () => {
		const handle = makeHandle();
		handleMapKeydown(ev('+'), asHandle(handle), true);
		expect(handle.zoomIn).toHaveBeenCalledWith({ animate: false });
	});

	it('unbekannter Key → no-op + nicht preventDefault', () => {
		const handle = makeHandle();
		const e = ev('a');
		handleMapKeydown(e, asHandle(handle), false);
		expect(handle.panBy).not.toHaveBeenCalled();
		expect(e.defaultPrevented).toBe(false);
	});

	it('bekannter Key → preventDefault', () => {
		const handle = makeHandle();
		const e = ev('ArrowUp');
		handleMapKeydown(e, asHandle(handle), false);
		expect(e.defaultPrevented).toBe(true);
	});
});
