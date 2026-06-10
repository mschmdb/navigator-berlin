<!--
	Story 2.11 Hook-Section nach dem Hero. Screenshot + 2 Sätze: Lärmpegel
	einer Adresse, Hitze-Klasse eines Kiezes, ÖPNV-Dichte pro Bezirk. Story
	2.12 ersetzt `screenshotSrc` durch eine Browser-Capture-Pipeline; bis
	dahin Brand-Card als Fallback.
-->
<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import { HOME_SCREENSHOTS } from '$lib/content/screenshot-manifest.js';

	const HERO = HOME_SCREENSHOTS.heroHook;

	interface Props {
		readonly mapHref?: string;
		readonly screenshotSrc?: string;
		readonly screenshotAlt?: string;
	}

	const {
		mapHref = '/explore',
		screenshotSrc = HERO.path,
		screenshotAlt = HERO.alt
	}: Props = $props();
</script>

<section data-testid="home-hook" class="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-start md:gap-10">
	<div class="space-y-5 md:order-2">
		<p class="font-serif text-xl leading-relaxed text-ink md:text-2xl">
			Adresse eingeben. Daten kombinieren.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			Lärmpegel pro Straßenzug. Hitze-Klasse pro Kiez. ÖPNV-Dichte pro Bezirk.
			Werte aus den offenen Daten der Senatsverwaltung. Adressen und Kieze
			direkt vergleichen. Für die Wohnungssuche, den Umzug, die Recherche oder
			den nächsten Streit am Küchentisch.
		</p>
		<a
			href={mapHref}
			class="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-accent hover:text-ink"
		>
			Karte öffnen
			<ArrowRight size={14} aria-hidden="true" />
		</a>
	</div>
	<a
		href={mapHref}
		aria-label="Karte öffnen"
		class="group block overflow-hidden rounded border border-rule bg-bg-soft transition-colors hover:border-ink-muted md:order-1"
	>
		<figure>
			<img
				src={screenshotSrc}
				alt={screenshotAlt}
				class="block h-full w-full object-cover transition-opacity group-hover:opacity-90"
				loading="lazy"
				width={HERO.width}
				height={HERO.height}
			/>
			<figcaption class="sr-only">
				Vorschau der Karte mit Adress-Inspektor und ausgewählten Daten-Schichten.
			</figcaption>
		</figure>
	</a>
</section>
