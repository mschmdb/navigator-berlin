<!--
	Story 2.11 T3: Open-Block — Daten-Quellen-Vertrauens-Sektion auf der
	Landing. Listet 6 zentrale offene Daten-Anbieter mit Lizenz-Marker
	damit Besucher sofort sehen: alles nachvollziehbar, alles offen.

	Story 2.12 ersetzt durch `src/lib/content/home-data-sources.ts` (6-10
	dynamisch); bis dahin hardcoded.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { HOME_DATA_SOURCES, homeDataSourceDescription } from '$lib/content/home-data-sources.js';
</script>

<section data-testid="home-open-block" class="space-y-6">
	<header class="space-y-2">
		<h2 class="font-serif text-2xl text-ink md:text-3xl">
			{(HOME_DATA_SOURCES.length === 1
				? m.home_open_block_heading_singular
				: m.home_open_block_heading_plural)({ count: HOME_DATA_SOURCES.length })}
		</h2>
		<p class="font-serif text-base text-ink-muted">
			{m.home_open_block_lead()}
		</p>
	</header>
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each HOME_DATA_SOURCES as s (s.id)}
			<li class="space-y-1 border-l-2 border-rule pl-4">
				<p class="font-serif text-base font-semibold text-ink">{s.name}</p>
				<p class="font-serif text-sm text-ink-muted">{homeDataSourceDescription(s.id)}</p>
				<p class="font-mono text-xs tracking-wider text-ink-subtle uppercase">
					{s.license}
				</p>
			</li>
		{/each}
	</ul>
	<a
		class="inline-flex font-mono text-xs tracking-wider text-accent uppercase hover:text-ink"
		href={localizedHref('/lizenzen')}
	>
		{m.home_open_block_link()}
	</a>
</section>
