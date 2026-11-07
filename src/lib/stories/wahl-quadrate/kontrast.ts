import { contrastRatio } from '$lib/data/partei-farben';
import { STORY_INK, STORY_PAPER } from '../tokens';

/** Textfarbe für eine Zahl im Block: Papier oder Tinte, je nachdem, was stärker kontrastiert. */
export function textOn(fill: string): string {
	return contrastRatio(fill, STORY_PAPER) >= contrastRatio(fill, STORY_INK) ? STORY_PAPER : STORY_INK;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** Lineare Mischung zweier Hex-Farben, `u` = 0 ergibt `a`, `u` = 1 ergibt `b`. */
export function mixHex(a: string, b: string, u: number): string {
	if (!HEX.test(a) || !HEX.test(b)) throw new RangeError(`erwarte #rrggbb: ${a}, ${b}`);
	const ch = (h: string, i: number): number => Number.parseInt(h.slice(i, i + 2), 16);
	return (
		'#' +
		[1, 3, 5]
			.map((i) => Math.round(ch(a, i) * (1 - u) + ch(b, i) * u).toString(16).padStart(2, '0'))
			.join('')
	);
}
