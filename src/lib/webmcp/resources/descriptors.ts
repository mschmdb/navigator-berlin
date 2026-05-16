/**
 * Resource-Descriptors für das Manifest. Halten die `navigator://`-URIs
 * + LLM-lesbare Beschreibungen.
 */

import type { WebMcpResourceDescriptor } from './resource-types.js';

export const RESOURCE_DESCRIPTORS: readonly WebMcpResourceDescriptor[] = [
	{
		uriTemplate: 'navigator://address/current',
		name: 'active-address',
		description:
			'The address currently selected in the navigator.berlin Inspector (display name, lat/lng, Bezirk, Kiez, postcode). Empty when no address is active.'
	},
	{
		uriTemplate: 'navigator://layers/active',
		name: 'loaded-layers',
		description:
			'Currently active and soft-hidden layer slugs in the live UI state. Reflects user-toggled data layers in real time.'
	},
	{
		uriTemplate: 'navigator://bezirk/{slug}',
		name: 'bezirk-profile-ref',
		description:
			'Read-only reference to a Berlin Bezirk by slug. Fetch the actual profile via the `get_kiez_profile` tool (Bezirk-level via separate tool).'
	},
	{
		uriTemplate: 'navigator://kiez/{slug}',
		name: 'kiez-profile-ref',
		description:
			'Read-only reference to a Berlin Kiez (LOR Bezirksregion) by slug. Fetch the actual profile via the `get_kiez_profile` tool.'
	}
] as const;
