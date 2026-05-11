import { BERLIN_BBOX_ARRAY } from '$lib/data/constants.js';

export interface MapHandle {
	panBy(offset: [number, number], options?: { animate?: boolean }): void;
	zoomIn(options?: { animate?: boolean }): void;
	zoomOut(options?: { animate?: boolean }): void;
	fitBounds(bbox: [number, number, number, number]): void;
	jumpTo(options: { center?: [number, number]; zoom?: number }): void;
	getCanvasWidth(): number;
	getCanvasHeight(): number;
}

interface MinimalKeyEvent {
	key: string;
	preventDefault(): void;
}

const PAN_FRACTION = 0.1;
const PAN_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const ZOOM_IN_KEYS = new Set(['+', '=']);
const ZOOM_OUT_KEYS = new Set(['-', '_']);

export function handleMapKeydown(
	event: MinimalKeyEvent,
	map: MapHandle,
	reducedMotion: boolean,
	onClearSelection?: () => void
): void {
	if (PAN_KEYS.has(event.key)) {
		event.preventDefault();
		const dx =
			event.key === 'ArrowLeft'
				? -map.getCanvasWidth() * PAN_FRACTION
				: event.key === 'ArrowRight'
					? map.getCanvasWidth() * PAN_FRACTION
					: 0;
		const dy =
			event.key === 'ArrowUp'
				? -map.getCanvasHeight() * PAN_FRACTION
				: event.key === 'ArrowDown'
					? map.getCanvasHeight() * PAN_FRACTION
					: 0;
		map.panBy([dx, dy], { animate: !reducedMotion });
		return;
	}

	if (ZOOM_IN_KEYS.has(event.key)) {
		event.preventDefault();
		map.zoomIn({ animate: !reducedMotion });
		return;
	}

	if (ZOOM_OUT_KEYS.has(event.key)) {
		event.preventDefault();
		map.zoomOut({ animate: !reducedMotion });
		return;
	}

	if (event.key === 'Home') {
		event.preventDefault();
		map.fitBounds(BERLIN_BBOX_ARRAY);
		return;
	}

	if (event.key === 'Escape') {
		event.preventDefault();
		onClearSelection?.();
		return;
	}
}
