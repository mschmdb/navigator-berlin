<!--
	Story 2.2 T2.3: JSON-LD-Wrapper-Komponente.

	Rendert <script type="application/ld+json">{data}</script> in <svelte:head>,
	XSS-sicher via serializeJsonLd ('</' wird zu '<\/').

	Konsumenten: Page-Templates und Root-Layout. JSON-LD bleibt explizit OUTSIDE
	SeoHead (siehe Story 2.1 AC-7).
-->
<script lang="ts">
	import { serializeJsonLd } from '#lib/seo/serialize-jsonld.js';

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
	// Closing-Tag geteilt, sonst beendet er den Script-Block bzw. irritiert den Parser.
	const closeTag = '</' + 'script>';
	const plainTag = $derived(`<script type="application/ld+json">${serialized}${closeTag}`);
	const testidTag = $derived(
		`<script type="application/ld+json" data-testid="${testid}">${serialized}${closeTag}`
	);
</script>

<svelte:head>
	{#if testid}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- serializeJsonLd escaped '</', Inhalt ist eigenes JSON-LD -->
		{@html testidTag}
	{:else}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- serializeJsonLd escaped '</', Inhalt ist eigenes JSON-LD -->
		{@html plainTag}
	{/if}
</svelte:head>
