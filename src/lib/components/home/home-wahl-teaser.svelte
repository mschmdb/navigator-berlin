<!--
	Wahl-Teaser auf der Home-Landing. Drei Schnell-Links auf die jüngsten
	Wahlen plus Verweis auf /wahl-Übersicht und Methodik.
	Screenshot-Slot bereit für spätere Browser-Capture-Pipeline analog
	HomeHook.
-->
<script lang="ts">
	import { ArrowRight, Vote } from '@lucide/svelte';

	type WahlCard = {
		readonly slug: string;
		readonly title: string;
		readonly typLabel: string;
		readonly note: string;
	};

	const CARDS: ReadonlyArray<WahlCard> = [
		{
			slug: '2025-btw-zweitstimme',
			title: 'Bundestagswahl 2025',
			typLabel: 'Zweitstimme',
			note: 'Quelle Bundeswahlleiterin'
		},
		{
			slug: '2023-agh-zweitstimme',
			title: 'Abgeordnetenhaus 2023',
			typLabel: 'Zweitstimme · Wiederholung',
			note: 'Quelle Amt für Statistik Berlin-Brandenburg'
		},
		{
			slug: '2023-bvv',
			title: 'BVV-Wahl 2023',
			typLabel: 'Stimme · Wiederholung',
			note: 'Quelle Amt für Statistik Berlin-Brandenburg'
		}
	];
</script>

<section data-testid="home-wahl-teaser" class="space-y-6">
	<header class="space-y-2">
		<h2 class="font-serif text-2xl text-ink md:text-3xl">Wahlen seit 2011</h2>
		<p class="font-serif text-base text-ink-muted">
			Bundestag, Abgeordnetenhaus, BVV. Pro Adresse die stärkste Partei, pro
			Stimmbezirk eine Karte mit 3500 Polygonen, pro Kiez der Verlauf über
			die letzten Jahre.
		</p>
	</header>

	<ul class="grid gap-4 sm:grid-cols-3">
		{#each CARDS as card (card.slug)}
			<li class="rounded border border-rule p-4">
				<a
					href={`/wahl/${card.slug}`}
					data-testid={`home-wahl-card-${card.slug}`}
					class="flex flex-col gap-2 text-ink hover:text-accent"
				>
					<span class="flex items-center gap-2">
						<Vote size={16} aria-hidden="true" />
						<span class="font-mono text-xs uppercase tracking-wider">
							{card.typLabel}
						</span>
					</span>
					<span class="font-serif text-lg leading-snug">{card.title}</span>
					<span class="font-mono text-xs text-ink-muted">{card.note}</span>
				</a>
			</li>
		{/each}
	</ul>

	<div class="flex flex-wrap items-center gap-x-6 gap-y-2">
		<a
			href="/wahl"
			data-testid="home-wahl-teaser-all"
			class="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-accent hover:text-ink"
		>
			Alle 20 Wahlen
			<ArrowRight size={14} aria-hidden="true" />
		</a>
		<a
			href="/methodik/wahldaten"
			data-testid="home-wahl-teaser-methodik"
			class="font-mono text-sm uppercase tracking-wider text-ink-muted hover:text-ink"
		>
			Methodik · Wahldaten
		</a>
	</div>
</section>
