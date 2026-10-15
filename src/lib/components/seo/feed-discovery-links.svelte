<script lang="ts">
	/**
	 * Auto-Discovery-Links für RSS, Atom, JSON-Feed im Page-Head.
	 *
	 * Die Feeds existieren nur auf Deutsch unter `/updates/*` (kein EN-Feed). Sie
	 * sind keine Sprachalternativen der Seite, deshalb tragen die Links kein
	 * `hreflang`. Auf EN weist der `title` stattdessen auf die deutsche Sprache hin.
	 */
	import { m } from '$lib/paraglide/messages.js';

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
		title={m.updates_feed_title_rss()}
		href={`${cleanOrigin}/updates/rss.xml`}
	/>
	<link
		rel="alternate"
		type="application/atom+xml"
		title={m.updates_feed_title_atom()}
		href={`${cleanOrigin}/updates/atom.xml`}
	/>
	<link
		rel="alternate"
		type="application/feed+json"
		title={m.updates_feed_title_json()}
		href={`${cleanOrigin}/updates/feed.json`}
	/>
</svelte:head>
