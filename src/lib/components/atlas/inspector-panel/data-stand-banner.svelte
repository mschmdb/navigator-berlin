<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import { Info } from '@lucide/svelte';
	import {
		shortenSourceCompact,
		shortenLicense,
		isOutdated,
		formatYearMonth
	} from './internal/source-shortener.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';

	type Props = { hit: LayerHit; lang?: Locale };
	let { hit, lang }: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	const sourceShort = $derived(shortenSourceCompact(hit.source));
	const licenseShort = $derived(shortenLicense(hit.license));
	const formattedDate = $derived(formatYearMonth(hit.updatedAt));
	const outdated = $derived(isOutdated(hit.updatedAt));

	let hostname = $derived.by(() => {
		try {
			return new URL(hit.source).hostname;
		} catch {
			return hit.source;
		}
	});
</script>

<p
	class="flex flex-wrap items-baseline gap-x-2 font-mono text-[10px] text-ink-subtle"
	data-testid="data-stand-banner"
>
	<span data-testid="banner-text">
		{formattedDate} · {sourceShort} · {licenseShort}
	</span>
	<span
		data-testid="banner-source-info"
		role="img"
		class="inline-flex items-center text-ink-subtle hover:text-ink-muted"
		title={m.inspector_data_stand_source_info({ hostname }, localeOpts)}
		aria-label={m.inspector_data_stand_source_info({ hostname }, localeOpts)}
	>
		<Info size={10} aria-hidden="true" />
	</span>
	{#if outdated}
		<span
			data-testid="banner-outdated"
			class="ml-auto inline-flex items-center rounded-sm bg-state-warning/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-state-warning uppercase"
			title={m.inspector_data_stand_outdated_title({ date: hit.updatedAt }, localeOpts)}
		>
			{m.inspector_data_stand_outdated(undefined, localeOpts)}
		</span>
	{/if}
</p>
