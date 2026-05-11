import { viewportFromUrl } from '$lib/utils/viewport-from-url.js';
import { parseAddress } from '$lib/utils/url-state.js';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
	const viewport = viewportFromUrl(url);
	const address = parseAddress(url.searchParams);
	return { ...viewport, address };
};
