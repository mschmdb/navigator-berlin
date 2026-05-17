<!--
	Story 2.11 T3: Top-5-Kieze-Teaser auf der Landing.

	Pre-rendered Liste; Daten kommen aus Story 2.9a kiez_score via Server-
	Load (siehe routes/(with-header)/+page.server.ts). Wenn DATABASE_URL
	fehlt: Komponente rendert sich aus (empty-list-Guard) damit die Landing
	auch ohne DB-Anbindung baut.
-->
<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';

	interface TopKiez {
		readonly slug: string;
		readonly displayName: string;
		readonly bezirkName: string | null;
		readonly composite: number | null;
	}

	interface Props {
		readonly items: readonly TopKiez[];
	}

	const { items }: Props = $props();

	function formatScore(value: number | null): string {
		if (value === null || !Number.isFinite(value)) return '–';
		return Math.round(value).toString();
	}
</script>

{#if items.length > 0}
	<section data-testid="home-top-kieze" class="space-y-6">
		<header class="flex items-baseline justify-between gap-4">
			<h2 class="font-serif text-2xl text-ink md:text-3xl">143 Kieze, fünf Dimensionen</h2>
			<a
				href="/wo-lebt-es-sich-gut"
				class="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-accent hover:text-ink"
			>
				Ranking ansehen
				<ArrowUpRight size={14} aria-hidden="true" />
			</a>
		</header>
		<ol class="divide-y divide-rule border-y border-rule">
			{#each items as item, idx (item.slug)}
				<li class="flex items-baseline justify-between gap-4 py-3">
					<span class="flex items-baseline gap-3">
						<span class="font-mono text-xs text-ink-subtle">{idx + 1}</span>
						<a class="font-serif text-base text-ink hover:text-accent" href={`/kiez/${item.slug}`}>
							{item.displayName}
						</a>
						{#if item.bezirkName}
							<span class="font-mono text-xs text-ink-subtle">· {item.bezirkName}</span>
						{/if}
					</span>
					<span class="font-mono text-base text-ink">{formatScore(item.composite)}</span>
				</li>
			{/each}
		</ol>
		<p class="font-serif text-sm text-ink-muted">
			Fünf Dimensionen, gleich gewichtet, 0–100. Beschreibt Verteilung, nicht Wertung
			einzelner Adressen oder Personen.
		</p>
	</section>
{/if}
