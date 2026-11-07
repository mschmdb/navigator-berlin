import type { StoriesWahlData } from '$lib/stories/wahl-quadrate/types';
import type { PageLoad } from './$types';

/** Demo der Bausteine von „Berlin in Quadraten“ (#200) mit den echten Wahldaten. */
export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/data/stories-wahl.json');
	if (!res.ok) throw new Error(`stories-wahl.json: ${res.status}`);
	return { data: (await res.json()) as StoriesWahlData };
};
