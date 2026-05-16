/**
 * Build a canonical URL from an origin and pathname.
 *
 * Strips query strings, hash fragments, and trailing slashes (except on root).
 * Normalizes the origin and pathname so the result has exactly one slash between them.
 *
 * Per AC-2 in story 2.1: query parameters and hash fragments must never appear
 * in a canonical URL. URL state like `?bbox=...&layers=...` is a client-only concern.
 */
export function buildCanonical(origin: string, pathname: string): string {
	const trimmedOrigin = origin.replace(/\/+$/, '');
	let path = pathname;
	const queryIdx = path.indexOf('?');
	if (queryIdx !== -1) path = path.slice(0, queryIdx);
	const hashIdx = path.indexOf('#');
	if (hashIdx !== -1) path = path.slice(0, hashIdx);
	if (!path.startsWith('/')) path = `/${path}`;
	if (path.length > 1) path = path.replace(/\/+$/, '');
	return `${trimmedOrigin}${path}`;
}
