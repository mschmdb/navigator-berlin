/**
 * scripts/generate-organization-logo.ts
 *
 * Rendert `static/logo-pixel.svg` als 512x512-PNG nach
 * `static/logo-organization.png`. Die Organization-JSON-LD verweist darauf,
 * weil Google für das Logo ein Rasterbild verlangt.
 *
 * Run: `pnpm logo:organization`
 */

import { isMainEntry } from './lib/is-main-entry.js';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

import { ORGANIZATION_LOGO_SIZE as LOGO_SIZE } from '../src/lib/seo/organization-logo.js';

export { LOGO_SIZE };
const BACKGROUND = '#ECEAE0';

export function renderOrganizationLogo(svg: string): Buffer {
	const resvg = new Resvg(svg, {
		background: BACKGROUND,
		fitTo: { mode: 'width', value: LOGO_SIZE }
	});
	const rendered = resvg.render();
	if (rendered.width !== LOGO_SIZE || rendered.height !== LOGO_SIZE) {
		throw new Error(
			`Logo muss ${LOGO_SIZE}x${LOGO_SIZE} sein, erhalten ${rendered.width}x${rendered.height}`
		);
	}
	return rendered.asPng();
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (isMainEntry(import.meta.url, process.argv[1])) {
	const svg = readFileSync(path.join(root, 'static', 'logo-pixel.svg'), 'utf-8');
	writeFileSync(path.join(root, 'static', 'logo-organization.png'), renderOrganizationLogo(svg));
}
