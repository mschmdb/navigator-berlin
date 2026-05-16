/**
 * Resource-URI-Parser für das `navigator://`-Custom-Scheme.
 *
 * Erwartete Patterns:
 *   navigator://address/{slug-or-coords}
 *   navigator://layers/active
 *   navigator://bezirk/{slug}
 *   navigator://kiez/{slug}
 *
 * Bei unbekanntem Type oder ungültiger URI liefert die Funktion `null`.
 * Pure-Function. Keine Side-Effects.
 */

export type ResourceRef =
	| { type: 'address'; ref: string }
	| { type: 'layers'; ref: 'active' }
	| { type: 'bezirk'; slug: string }
	| { type: 'kiez'; slug: string };

const SCHEME = 'navigator://';

export function parseResourceUri(uri: string): ResourceRef | null {
	if (typeof uri !== 'string' || !uri.startsWith(SCHEME)) return null;
	const rest = uri.slice(SCHEME.length);
	const slashIdx = rest.indexOf('/');
	if (slashIdx < 0) return null;
	const type = rest.slice(0, slashIdx);
	const ref = rest.slice(slashIdx + 1);
	if (ref.length === 0) return null;

	switch (type) {
		case 'address':
			return { type: 'address', ref };
		case 'layers':
			if (ref !== 'active') return null;
			return { type: 'layers', ref: 'active' };
		case 'bezirk':
			return { type: 'bezirk', slug: ref };
		case 'kiez':
			return { type: 'kiez', slug: ref };
		default:
			return null;
	}
}
