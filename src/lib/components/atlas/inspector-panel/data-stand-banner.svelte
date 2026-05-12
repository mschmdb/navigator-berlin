<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import {
		shortenSource,
		shortenLicense,
		isOutdated,
		formatYearMonth
	} from './internal/source-shortener.js';

	type Props = { hit: LayerHit };
	let { hit }: Props = $props();

	const sourceShort = $derived(shortenSource(hit.source));
	const licenseShort = $derived(shortenLicense(hit.license));
	const formattedDate = $derived(formatYearMonth(hit.updatedAt));
	const outdated = $derived(isOutdated(hit.updatedAt));
</script>

<p
	class="font-mono text-xs text-ink-subtle flex flex-wrap items-baseline gap-x-2"
	data-testid="data-stand-banner"
>
	<span data-testid="banner-text">
		Stand: {formattedDate} · Quelle: {sourceShort} · {licenseShort}
	</span>
	{#if outdated}
		<span
			data-testid="banner-outdated"
			class="ml-auto inline-flex items-center rounded-sm bg-state-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-state-warning"
			title={`Datenstand: ${hit.updatedAt}`}
		>
			Veraltet
		</span>
	{/if}
</p>
