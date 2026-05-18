<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();
</script>

<!--
	Story 5.9 AC-9: Alle Routen unter /_dev/* tragen meta-robots noindex,nofollow.
	Crawl-Budget-Schutz. Komplementiert durch robots.txt Default-Block-Disallow
	und (perspektivisch) X-Robots-Tag-Header.
-->
<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
	<meta name="googlebot" content="noindex,nofollow" />
</svelte:head>

{@render children()}
