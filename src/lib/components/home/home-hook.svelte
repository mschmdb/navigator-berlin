<!--
	Story 2.11 Hook-Section nach dem Hero. Screenshot + 2 Sätze: Lärmpegel
	einer Adresse, Hitze-Klasse eines Kiezes, ÖPNV-Dichte pro Bezirk. Story
	2.12 ersetzt `screenshotSrc` durch eine Browser-Capture-Pipeline; bis
	dahin Brand-Card als Fallback.
-->
<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';

	interface Props {
		readonly mapHref?: string;
		readonly screenshotSrc?: string;
		readonly screenshotAlt?: string;
	}

	const {
		mapHref = '/explore',
		screenshotSrc = '/berlin-navigator-laermbelastung2.webp',
		screenshotAlt = 'Karten-Ansicht von navigator.berlin mit aktiver Lärmbelastungs-Schicht'
	}: Props = $props();
</script>

<section data-testid="home-hook" class="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-center md:gap-10">
	<div class="space-y-5">
		<p class="font-serif text-xl leading-relaxed text-ink md:text-2xl">
			Adresse eingeben. Daten kombinieren. Quelle direkt daneben.
		</p>
		<p class="font-serif text-base leading-relaxed text-ink-muted">
			Lärmpegel pro Straßenzug. Hitze-Klasse pro Kiez. ÖPNV-Dichte pro Bezirk.
			Werte mit Stand-Datum, alles aus den offenen Daten der Senatsverwaltung.
		</p>
		<a
			href={mapHref}
			class="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-accent hover:text-ink"
		>
			Karte öffnen
			<ArrowRight size={14} aria-hidden="true" />
		</a>
	</div>
	<figure class="overflow-hidden rounded border border-rule bg-bg-soft">
		<img
			src={screenshotSrc}
			alt={screenshotAlt}
			class="block h-full w-full object-cover"
			loading="lazy"
			width="1200"
			height="630"
		/>
		<figcaption class="sr-only">
			Vorschau der Karte mit Adress-Inspektor und ausgewählten Daten-Schichten.
		</figcaption>
	</figure>
</section>
