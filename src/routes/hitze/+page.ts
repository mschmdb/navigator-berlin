import type { PageLoad } from './$types';

// Hitze-Subdomain-Home (via reroute an der Wurzel gerendert). Dynamisch, nicht prerendered,
// damit die Host-Weiche greift und der Content unabhängig von der Haupt-Home lebt.
export const prerender = false;

export const load: PageLoad = () => {
	return {};
};
