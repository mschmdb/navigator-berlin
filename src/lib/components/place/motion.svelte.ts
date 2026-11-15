import { MediaQuery } from 'svelte/reactivity';

const reduced = new MediaQuery('(prefers-reduced-motion: reduce)');

/** LayerChart kennt kein prefers-reduced-motion: Bewegung nur, wenn die Nutzerin sie zulässt. */
export function chartMotion(duration = 500) {
	return reduced.current ? ({ type: 'none' } as const) : ({ type: 'tween', duration } as const);
}

export function prefersReducedMotion(): boolean {
	return reduced.current;
}
