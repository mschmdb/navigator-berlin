<!--
	Story 2.2 T2.3: JSON-LD-Wrapper-Komponente.

	Rendert <script type="application/ld+json">{data}</script> in <svelte:head>,
	XSS-sicher via serializeJsonLd ('</' wird zu '<\/').

	Konsumenten: Page-Templates und Root-Layout. JSON-LD bleibt explizit OUTSIDE
	SeoHead (siehe Story 2.1 AC-7).
-->
<script lang="ts">
	import { serializeJsonLd } from '$lib/seo/serialize-jsonld.js';

	/**
	 * Minimal JSON-LD-Object-Constraint. Wir akzeptieren jedes Object mit
	 * `@context: 'https://schema.org'` und `@type: string`. Spezifische Leaf-Types
	 * (z. B. `WebSiteLeafJsonLd`, `DatasetLeafJsonLd`) erfuellen das ohne explizite
	 * Index-Signature. Wir vermeiden die schema-dts-Union `WithContext<Thing>`
	 * als Prop-Type, weil deren `string`-Branches Subtype-Assignability brechen.
	 */
	interface JsonLdObject {
		'@context': 'https://schema.org';
		'@type': string;
	}

	interface Props {
		readonly data: JsonLdObject;
		/** Optionaler `data-testid` zur Selektion in Tests. */
		readonly testid?: string;
	}

	const { data, testid }: Props = $props();
	const serialized = $derived(serializeJsonLd(data));
</script>

<svelte:head>
	{#if testid}
		{@html `<script type="application/ld+json" data-testid="${testid}">${serialized}</script>`}
	{:else}
		{@html `<script type="application/ld+json">${serialized}</script>`}
	{/if}
</svelte:head>
