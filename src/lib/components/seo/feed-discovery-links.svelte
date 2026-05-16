<script lang="ts">
	/**
	 * Story 2.13 AC-8: Auto-Discovery-Links für RSS, Atom, JSON-Feed im Page-Head.
	 *
	 * Verwendung: in `<svelte:head>` der Updates-Index, Detail-Page und Hero-Landing
	 * `/` einbinden, damit Feed-Reader die Drei-Format-Subscription anbieten.
	 *
	 * Phase 1 DE-only (memory `project_i18n_phase_1_de_only`): Feeds existieren nur
	 * unter `/updates/*` ohne Locale-Prefix.
	 */
	type Props = {
		/** Absolute Origin der Site (page.url.origin). */
		origin: string;
	};
	let { origin }: Props = $props();
	const cleanOrigin = $derived(origin.replace(/\/+$/, ''));
</script>

<svelte:head>
	<link
		rel="alternate"
		type="application/rss+xml"
		title="Navigator Berlin Updates (RSS)"
		href={`${cleanOrigin}/updates/rss.xml`}
	/>
	<link
		rel="alternate"
		type="application/atom+xml"
		title="Navigator Berlin Updates (Atom)"
		href={`${cleanOrigin}/updates/atom.xml`}
	/>
	<link
		rel="alternate"
		type="application/feed+json"
		title="Navigator Berlin Updates (JSON Feed)"
		href={`${cleanOrigin}/updates/feed.json`}
	/>
</svelte:head>
