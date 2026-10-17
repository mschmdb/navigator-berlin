<!--
	Hitze- und Kälte-Teaser in saisonaler Reihenfolge. In der Kältehilfe-Saison
	(1.10. bis 30.4.) steht der Kälte-Teaser groß oben, sonst der Hitze-Teaser.
	Der andere Teaser folgt kompakt darunter.
-->
<script lang="ts">
	import { isKaelteSaison } from '$lib/utils/berlin-time.js';
	import HomeHitzeTeaser from './home-hitze-teaser.svelte';
	import HomeKaelteTeaser from './home-kaelte-teaser.svelte';

	let { now = new Date() }: { now?: Date } = $props();

	const kaelteZuerst = $derived(isKaelteSaison(now));
</script>

<div class="space-y-8" data-testid="home-saison-teasers">
	{#if kaelteZuerst}
		<HomeKaelteTeaser />
		<HomeHitzeTeaser compact />
	{:else}
		<HomeHitzeTeaser />
		<HomeKaelteTeaser compact />
	{/if}
</div>
