import { readFileSync } from 'node:fs';
import path from 'node:path';
import { create, type Font } from 'fontkit';
import type { Measure, Metrics } from '$lib/stories/wahl-quadrate/labels';

export type JostWeight = 400 | 700 | 900;

const FONT_DIR = path.join(process.cwd(), 'node_modules/@fontsource/jost/files');

/** Jost, selbst gehostet über @fontsource (OFL 1.1), statischer woff-Schnitt. */
export function jostFile(weight: JostWeight): string {
	return path.join(FONT_DIR, `jost-latin-${weight}-normal.woff`);
}

const fonts = new Map<JostWeight, Font>();

function load(weight: JostWeight): Font {
	let f = fonts.get(weight);
	if (!f) {
		const created = create(readFileSync(jostFile(weight)));
		if (!('layout' in created))
			throw new TypeError(`Jost ${weight}: Schriftsammlung statt Schrift`);
		f = created;
		fonts.set(weight, f);
	}
	return f;
}

const EMPTY: Metrics = { abl: 0, w: 0, asc: 0, h: 0, adv: 0 };

/**
 * Server-Gegenstück zu Canvas `measureText`: Tinten-Box aus den Glyphen-Umrissen, je
 * Schriftgröße 1. Dieselbe Datei bettet das PDF ein, Messung und Druck stimmen überein.
 */
export function jostMeasure(weight: JostWeight = 900): Measure {
	const font = load(weight);
	const em = font.unitsPerEm;
	const cache = new Map<string, Metrics>();
	return (text) => {
		if (!text) return EMPTY;
		let m = cache.get(text);
		if (!m) {
			const run = font.layout(text);
			const b = run.bbox;
			m = {
				abl: -b.minX / em,
				w: (b.maxX - b.minX) / em,
				asc: b.maxY / em,
				h: (b.maxY - b.minY) / em,
				adv: run.advanceWidth / em
			};
			cache.set(text, m);
		}
		return m;
	};
}
