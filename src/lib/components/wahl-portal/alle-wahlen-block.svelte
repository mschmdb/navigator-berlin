<!--
	Matze-Entscheidung 24.09. (Review, Intent-Gap „verwaiste Detailseiten"):
	Block im bestehenden Methodik-Kapitel von /berlin-wahlen, der alle
	Detailseiten (/berlin-wahlen/<slug>) verlinkt -- ohne diesen Block gibt es
	keinen internen Link mehr auf die einzelnen Wahl-Detailseiten (nur noch
	die Portal-Deep-Links dorthin zeigen selbst nicht). Kein eigenes Kapitel,
	Daten kommen serverseitig aus `berlin-wahlen/+page.server.ts` (prerendered,
	crawlbar).
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { AlleWahlenEntry } from '../../../routes/(with-header)/berlin-wahlen/+page.server.js';

	type Props = {
		wahlen: readonly AlleWahlenEntry[];
	};

	let { wahlen }: Props = $props();

	const TYP_LABELS: Record<AlleWahlenEntry['typ'], string> = {
		btw: 'Bundestag',
		agh: 'Abgeordnetenhaus',
		bvv: 'BVV'
	};

	const STIMMTYP_LABELS: Record<AlleWahlenEntry['stimmtyp'], string> = {
		erststimme: 'Erststimme',
		zweitstimme: 'Zweitstimme',
		einstimme: 'Stimme'
	};

	const TYP_ORDER: readonly AlleWahlenEntry['typ'][] = ['btw', 'agh', 'bvv'];
	const STIMMTYP_ORDER: readonly AlleWahlenEntry['stimmtyp'][] = [
		'zweitstimme',
		'erststimme',
		'einstimme'
	];

	type Group = {
		readonly typ: AlleWahlenEntry['typ'];
		readonly label: string;
		readonly entries: readonly AlleWahlenEntry[];
	};

	const groups = $derived.by((): Group[] => {
		return TYP_ORDER.map((typ) => ({
			typ,
			label: TYP_LABELS[typ],
			entries: wahlen
				.filter((w) => w.typ === typ)
				.slice()
				.sort((a, b) => {
					if (a.jahr !== b.jahr) return b.jahr - a.jahr;
					return STIMMTYP_ORDER.indexOf(a.stimmtyp) - STIMMTYP_ORDER.indexOf(b.stimmtyp);
				})
		})).filter((g) => g.entries.length > 0);
	});

	/**
	 * Review-Fund: die vorherige Inline-Template-Verschachtelung
	 * (`{#if}...{/if}` direkt im Linktext) ließ Svelte die Einrückung vor dem
	 * „·" als führenden Leerraum trimmen -- Ergebnis „2023· Erststimme" statt
	 * „2023 · Erststimme". Ein Array-Join erzeugt den Trenner explizit, statt
	 * sich auf Template-Whitespace zu verlassen.
	 */
	function entryLabel(entry: AlleWahlenEntry): string {
		const parts = [String(entry.jahr)];
		if (entry.typ !== 'bvv') parts.push(STIMMTYP_LABELS[entry.stimmtyp]);
		if (entry.isRepeatElection) parts.push('Wiederholung');
		return parts.join(' · ');
	}
</script>

<div id="alle-wahlen" class="flex scroll-mt-[var(--header-height,72px)] flex-col gap-3">
	<h3 class="font-sans text-base font-semibold text-ink">Alle Wahlen einzeln</h3>
	{#if groups.length === 0}
		<p class="font-mono text-xs text-ink-muted" data-testid="alle-wahlen-empty">
			Wahl-Liste wird mit dem nächsten Build freigeschaltet.
		</p>
	{:else}
		<div class="flex flex-col gap-4" data-testid="alle-wahlen-block">
			{#each groups as group (group.typ)}
				<div data-testid={`alle-wahlen-gruppe-${group.typ}`}>
					<h4 class="font-mono text-xs tracking-wide text-ink-muted uppercase">
						{group.label}
					</h4>
					<ul class="flex flex-wrap gap-x-4 gap-y-2 pt-1 font-mono text-xs">
						{#each group.entries as entry (entry.slug)}
							<li>
								<a
									href={resolve('/(with-header)/berlin-wahlen/[slug]', { slug: entry.slug })}
									data-testid={`alle-wahlen-link-${entry.slug}`}
									class="hover:text-accent-strong inline-flex min-h-6 items-center text-accent underline underline-offset-2"
								>
									{entryLabel(entry)}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/if}
</div>
