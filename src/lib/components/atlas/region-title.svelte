<!--
	H1 für Kiez- und Bezirksseiten. Lange Namen wie „Nord 2 - Waidmannslust/Wittenau/Lübars“
	dürfen die Textspalte neben der Lagekarte nicht sprengen: Umbruchstellen nach jedem
	Schrägstrich, Silbentrennung und als letzte Rettung Umbruch im Wort (`.region-title`
	in app.css).
-->
<script lang="ts">
	import { breakAfterSlash } from '$lib/utils/break-after-slash.js';

	interface Props {
		readonly name: string;
	}

	const { name }: Props = $props();
	const parts = $derived(breakAfterSlash(name));
</script>

<h1 class="region-title text-2xl font-bold text-ink sm:text-3xl md:text-4xl">
	{#each parts as part, i (i)}{part}{#if i < parts.length - 1}<wbr />{/if}{/each}
</h1>
