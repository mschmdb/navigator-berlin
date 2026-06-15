<!--
	Story 2.11 T3: Open-Block — Daten-Quellen-Vertrauens-Sektion auf der
	Landing. Listet 6 zentrale offene Daten-Anbieter mit Lizenz-Marker
	damit Besucher sofort sehen: alles nachvollziehbar, alles offen.

	Story 2.12 ersetzt durch `src/lib/content/home-data-sources.ts` (6-10
	dynamisch); bis dahin hardcoded.
-->
<script lang="ts">
	import { HOME_DATA_SOURCES } from '$lib/content/home-data-sources.js';
</script>

<section data-testid="home-open-block" class="space-y-6">
	<header class="space-y-2">
		<h2 class="font-serif text-2xl text-ink md:text-3xl">{HOME_DATA_SOURCES.length} zentrale Quellen</h2>
		<p class="font-serif text-base text-ink-muted">
			Alle aus öffentlichen Datensätzen mit Open-Data-Lizenz. Kein Scraping,
			kein Abo, keine Werbung.
		</p>
	</header>
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each HOME_DATA_SOURCES as s (s.name)}
			<li class="space-y-1 border-l-2 border-rule pl-4">
				<p class="font-serif text-base font-semibold text-ink">{s.name}</p>
				<p class="font-serif text-sm text-ink-muted">{s.description}</p>
				<p class="font-mono text-xs uppercase tracking-wider text-ink-subtle">
					{s.license}
				</p>
			</li>
		{/each}
	</ul>
	<a
		class="inline-flex font-mono text-xs uppercase tracking-wider text-accent hover:text-ink"
		href="/lizenzen"
	>
		Alle Quellen mit Lizenz
	</a>
</section>
