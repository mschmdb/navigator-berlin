<!--
	Story 2.12 T2: Quick-Links — 5 Berliner Landmarks als Pre-Adress-Buttons.

	Klick führt auf `/explore?address=lng,lat&q=…`. Atlas (Story 1.7) parsed
	das Address-Query automatisch und rendert mit ausgewählter Adresse +
	geöffnetem Inspector. Probier-Pfad für Erst-Besucher die keinen eigenen
	Adress-Anchor haben.
-->
<script lang="ts">
	import { MapPin } from '@lucide/svelte';
	import { HOME_QUICK_LINKS, buildQuickLinkHref } from '$lib/content/home-quick-links.js';
</script>

<section data-testid="home-quick-links" class="space-y-4">
	<header class="space-y-2">
		<h2 class="font-serif text-2xl text-ink md:text-3xl">5 Adressen zum Probieren</h2>
		<p class="font-serif text-base text-ink-muted">
			Klick öffnet die Karte mit ausgewählter Adresse und allen Daten-Schichten am Punkt.
		</p>
	</header>
	<ul class="flex flex-wrap gap-2">
		{#each HOME_QUICK_LINKS as q (q.label)}
			<li>
				<a
					href={buildQuickLinkHref(q)}
					data-testid={`home-quick-link-${q.label}`}
					class="inline-flex items-center gap-2 rounded border border-rule px-3 py-2 font-sans text-sm text-ink hover:border-accent hover:text-accent"
				>
					<MapPin size={14} aria-hidden="true" />
					{q.label}
				</a>
			</li>
		{/each}
	</ul>
</section>
