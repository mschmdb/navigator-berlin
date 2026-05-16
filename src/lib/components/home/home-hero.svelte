<!--
	Story 2.11 T1: Home-Hero-Section auf der Static-Landing-Page „/".

	H1 + Lead + 2 CTAs (Atlas öffnen / Methodik). Hardcoded DE-Strings
	Phase-1 (Memory `project_i18n_phase_1_de_only`); Story 2.12 / 3.x
	migriert auf Paraglide-Messages.
-->
<script lang="ts">
	import { Map as MapIcon, BookOpen } from '@lucide/svelte';

	interface Props {
		readonly atlasHref?: string;
		readonly methodikHref?: string;
	}

	const { atlasHref = '/explore', methodikHref = '/methodik' }: Props = $props();
</script>

<section data-testid="home-hero" class="space-y-6">
	<p class="font-mono text-xs uppercase tracking-wider text-accent">navigator.berlin · Beta</p>
	<h1 class="font-serif text-4xl text-ink md:text-5xl">
		Berliner Datenlagen, zusammengelegt.
	</h1>
	<p class="max-w-prose font-serif text-lg leading-relaxed text-ink-muted">
		Lärm, Klima, Wohnen, Mobilität und Soziale Lage pro Adresse, Kiez und Bezirk.
		Offene Senats-Daten, sauber aggregiert, nachvollziehbar dokumentiert. Kein
		Lebenswert-Score, kein Mietpreis-Glücksrad.
	</p>
	<div class="flex flex-wrap gap-3 pt-2">
		<a
			href={atlasHref}
			data-testid="home-hero-cta-atlas"
			class="inline-flex items-center gap-2 rounded border border-accent bg-accent px-4 py-2 font-mono text-sm uppercase tracking-wider text-bg hover:bg-ink hover:border-ink"
		>
			<MapIcon size={16} aria-hidden="true" />
			Atlas öffnen
		</a>
		<a
			href={methodikHref}
			data-testid="home-hero-cta-methodik"
			class="inline-flex items-center gap-2 rounded border border-rule px-4 py-2 font-mono text-sm uppercase tracking-wider text-ink hover:border-ink"
		>
			<BookOpen size={16} aria-hidden="true" />
			Methodik
		</a>
	</div>
</section>
