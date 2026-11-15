import { describe, expect, it } from 'vitest';
import { renderScoreMapSvg } from './score-map-svg';
import { PLACE_MAP_FILLS } from './map-classes';

const outline = {
	viewBox: '0 0 100 50',
	width: 100,
	height: 50,
	paths: [
		{ id: 'own', d: 'M0 0L10 0L10 10Z' },
		{ id: 'other', d: 'M20 0L30 0L30 10Z' },
		{ id: 'none', d: 'M40 0L50 0L50 10Z' }
	]
};
const scores = new Map([
	['own', { name: 'Eigen', composite: 80 }],
	['other', { name: 'Ander & Co', composite: 10 }]
]);

describe('renderScoreMapSvg', () => {
	const svg = renderScoreMapSvg({ outline, scores, ownSlug: 'own' });
	it('is a standalone SVG with the outline view box', () => {
		expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"')).toBe(
			true
		);
	});
	it('fills by score class and greys places without score', () => {
		expect(svg).toContain(`fill="${PLACE_MAP_FILLS[3]}"`);
		expect(svg).toContain(`fill="${PLACE_MAP_FILLS[0]}"`);
		expect(svg).toContain('fill="#c8c6bb"');
	});
	it('draws the own place last with a thick dark outline', () => {
		const last = svg.lastIndexOf('<path');
		expect(svg.slice(last)).toContain('stroke="#141414" stroke-width="4"');
		expect(svg.slice(last)).toContain('d="M0 0L10 0L10 10Z"');
	});
	it('escapes names in titles', () => {
		expect(svg).toContain('<title>Ander &amp; Co: 10</title>');
	});
	it('plain mode: own place dark, the rest muted', () => {
		const plain = renderScoreMapSvg({ outline, scores, ownSlug: 'own', plain: true });
		expect(plain).toContain('fill="#141414"');
		expect(plain).not.toContain(PLACE_MAP_FILLS[3]);
	});
});
