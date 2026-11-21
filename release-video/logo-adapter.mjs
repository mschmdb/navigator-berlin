// Adapter for the navigator.berlin pixel logo. Mirrors pixel-logo.svelte, variant one-shot:
// the grid stands still, each tick recolors `PER_TICK` cells. Seeded, so every tick is reproducible.
import {
	buildGeometry,
	initialFills,
	PALETTE,
	PRESET,
	seededRandom
} from '../src/lib/data/pixel-logo-geometry.ts';

const PER_TICK = 11;
const geometry = buildGeometry(PRESET);
const count = geometry.cells.length;
const base = initialFills(count);
const random = seededRandom(PRESET.seed + 1);
// Tight viewBox around the cells, so the logo fills its box.
const xs = geometry.cells.map((c) => c.x);
const ys = geometry.cells.map((c) => c.y);
const minX = Math.min(...xs);
const minY = Math.min(...ys);
const viewBox = `${minX} ${minY} ${Math.max(...xs) + geometry.size - minX} ${Math.max(...ys) + geometry.size - minY}`;
/** fills[k] = colors after k ticks; computed once, in order. */
const states = [base];

function stateAt(tick) {
	while (states.length <= tick) {
		const next = [...states[states.length - 1]];
		for (let i = 0; i < PER_TICK; i++) {
			next[Math.floor(random() * count)] = PALETTE[Math.floor(random() * PALETTE.length)];
		}
		states.push(next);
	}
	return states[tick];
}

export function frame(tick) {
	const fills = stateAt(tick);
	const cells = geometry.cells
		.map(
			(c, i) =>
				`<rect x="${c.x}" y="${c.y}" width="${geometry.size}" height="${geometry.size}" rx="${geometry.radius}" fill="${fills[i]}"/>`
		)
		.join('');
	return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`;
}
