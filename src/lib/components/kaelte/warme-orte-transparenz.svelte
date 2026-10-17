<script lang="ts">
	import { ExternalLink, TriangleAlert } from '@lucide/svelte';
	import { Phone } from '@lucide/svelte';
	import RichText from '$lib/components/rich-text.svelte';
	import { richSegments } from '$lib/i18n/rich-text.js';
	import { KAELTEHILFE_WEGWEISER_URL } from '$lib/kaelte/hilfe-dienste.js';
	import { m } from '$lib/paraglide/messages.js';

	const OSM_COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';

	const quellen = $derived([
		{
			name: m.kaelte_orte_transparenz_osm_name(),
			lizenz: m.kaelte_orte_transparenz_osm_lizenz(),
			detail: m.kaelte_orte_transparenz_osm_detail()
		},
		{
			name: m.kaelte_orte_transparenz_red_name(),
			lizenz: '',
			detail: m.kaelte_orte_transparenz_red_detail()
		},
		{
			name: m.kaelte_orte_transparenz_dwd_name(),
			lizenz: '',
			detail: m.kaelte_orte_transparenz_dwd_detail()
		}
	]);

	const wegweiserSegments = $derived(
		richSegments((t) =>
			m.kaelte_orte_transparenz_wegweiser({ de_start: t('de').start, de_end: t('de').end })
		)
	);

	const linkClass =
		'hover:text-accent-strong inline-flex min-h-11 w-fit items-center gap-1.5 font-sans text-sm text-accent underline underline-offset-2';
</script>

<section
	aria-labelledby="waerme-transparenz-h"
	data-testid="waerme-transparenz"
	class="flex flex-col gap-4"
>
	<h2 id="waerme-transparenz-h" class="font-sans text-2xl font-semibold text-ink">
		{m.kaelte_orte_transparenz_heading()}
	</h2>

	<p
		data-testid="waerme-transparenz-notfall"
		class="flex items-start gap-2 rounded border-2 border-accent px-3 py-2.5 font-sans text-sm font-medium text-ink"
	>
		<TriangleAlert size={18} aria-hidden="true" class="mt-0.5 shrink-0" />
		<span class="flex flex-wrap items-center gap-x-3 gap-y-1">
			{m.kaelte_orte_transparenz_notfall()}
			<a
				href="tel:112"
				data-testid="waerme-transparenz-112"
				class="inline-flex min-h-11 items-center gap-1.5 text-accent underline underline-offset-2"
			>
				<Phone size={16} aria-hidden="true" />
				{m.kaelte_notfall_112()}
			</a>
		</span>
	</p>

	<p class="font-serif text-base leading-body text-ink-muted">
		{m.kaelte_orte_transparenz_haltung()}
	</p>

	<ul class="flex flex-col gap-3">
		{#each quellen as quelle (quelle.name)}
			<li class="flex flex-col gap-0.5 rounded border border-rule bg-bg-elevated px-3 py-2.5">
				<span class="flex flex-wrap items-baseline gap-2">
					<span class="font-sans text-sm font-medium text-ink">{quelle.name}</span>
					{#if quelle.lizenz}
						<span class="font-mono text-dense-meta text-ink-subtle">{quelle.lizenz}</span>
					{/if}
				</span>
				<span class="font-serif text-sm text-ink-muted">{quelle.detail}</span>
			</li>
		{/each}
	</ul>

	<div class="flex flex-col">
		<a href={OSM_COPYRIGHT_URL} target="_blank" rel="noopener noreferrer" class={linkClass}>
			{m.kaelte_orte_transparenz_osm_link()}
			<ExternalLink size={12} aria-hidden="true" />
			<span class="sr-only">{m.kaelte_new_tab_hint()}</span>
		</a>
		<a
			href={KAELTEHILFE_WEGWEISER_URL}
			target="_blank"
			rel="noopener noreferrer"
			data-testid="waerme-wegweiser-link"
			class={linkClass}
		>
			<span>
				<RichText segments={wegweiserSegments}>
					{#snippet tag(text)}<span lang="de">{text}</span>{/snippet}
				</RichText>
			</span>
			<ExternalLink size={12} aria-hidden="true" />
			<span class="sr-only">{m.kaelte_new_tab_hint()}</span>
		</a>
	</div>
</section>
