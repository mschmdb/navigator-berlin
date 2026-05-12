<script lang="ts">
	import type { Snippet } from 'svelte';
	import AddressSearch from './address-search.svelte';
	import type { GeocodeSuggestion } from '$lib/data';

	type Props = {
		geocode: (q: string) => Promise<GeocodeSuggestion[]>;
		onSelect?: (suggestion: GeocodeSuggestion) => void;
		langSwitcher?: Snippet;
	};

	let { geocode, onSelect, langSwitcher }: Props = $props();
</script>

<header
	style="min-height: var(--header-height, 56px)"
	class="sticky top-0 z-30 border-b border-rule bg-bg/95 py-2"
>
	<div class="mx-auto flex max-w-[1440px] items-center gap-4 px-4">
		<a href="/" aria-label="navigator.berlin Startseite" class="flex shrink-0 items-center gap-2">
			<img src="/logo-mark.svg" alt="" class="h-8 w-8" />
			<span class="font-sans text-base font-light tracking-wide text-ink">navigator.berlin</span>
		</a>
		<div class="min-w-0 flex-1">
			<AddressSearch variant="header" {geocode} {onSelect} />
		</div>
		{#if langSwitcher}
			<div class="shrink-0">{@render langSwitcher()}</div>
		{/if}
	</div>
</header>
