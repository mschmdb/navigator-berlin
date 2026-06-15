<script lang="ts">
	import EditorialDisclaimer from './editorial-disclaimer.svelte';
	import { parteiColor } from '$lib/data/partei-farben.js';

	export type WahlVerlaufRow = {
		readonly key: string;
		readonly wahlTypLabel: string;
		readonly stimmtypLabel: string;
		readonly jahre: ReadonlyArray<{ readonly jahr: number; readonly parteiKurzname: string }>;
	};

	type Props = {
		kiezName: string;
		rows: ReadonlyArray<WahlVerlaufRow>;
		methodikHref?: string;
		testid?: string;
	};

	let {
		kiezName,
		rows,
		methodikHref = '/methodik/wahldaten',
		testid = 'kiez-wahl-verlauf'
	}: Props = $props();
</script>

{#if rows.length > 0}
	<section
		aria-labelledby="kiez-wahl-verlauf-heading"
		class="space-y-4 border-l-2 border-rule pl-3"
		data-testid={testid}
	>
		<header class="space-y-1">
			<h2 id="kiez-wahl-verlauf-heading" class="font-serif text-2xl text-ink">Wahl-Verlauf hier</h2>
			<p class="font-serif text-base text-ink-muted">
				Im Kiez {kiezName} verteilten sich die Stimmen bei den letzten Wahlen jeweils so, dass folgende
				Parteien pro Jahr den höchsten Anteil erreichten.
			</p>
		</header>

		<ul class="space-y-5" data-testid={`${testid}-list`}>
			{#each rows as row (row.key)}
				<li class="space-y-2" data-testid={`${testid}-row-${row.key}`}>
					<p class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
						{row.wahlTypLabel} · {row.stimmtypLabel}
					</p>
					<ol
						class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
						aria-label={`Stärkste Partei pro Jahr für ${row.wahlTypLabel}`}
					>
						{#each row.jahre as cell (cell.jahr)}
							<li
								class="flex flex-col gap-1.5 rounded border border-rule bg-bg p-2.5"
								data-testid={`${testid}-${row.key}-${cell.jahr}`}
							>
								<span
									class="font-mono text-[10px] tracking-wide text-ink-muted uppercase tabular-nums"
								>
									{cell.jahr}
								</span>
								<span class="flex items-center gap-2">
									<span
										class="inline-block h-3 w-3 flex-shrink-0 rounded-sm border border-ink/15"
										style="background-color:{parteiColor(cell.parteiKurzname)};"
										aria-hidden="true"
									></span>
									<span class="truncate font-sans text-sm font-medium text-ink">
										{cell.parteiKurzname}
									</span>
								</span>
							</li>
						{/each}
					</ol>
				</li>
			{/each}
		</ul>

		<p
			class="font-mono text-[10px] tracking-wide text-ink-muted uppercase"
			data-testid={`${testid}-source`}
		>
			Wahlbezirksstatistik (Bundeswahlleiterin + Amt für Statistik Berlin-Brandenburg) · Lizenz
			dl-de/by-2-0
		</p>

		<EditorialDisclaimer variant="cross-layer-template" />

		<a
			href={methodikHref}
			class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
			data-testid={`${testid}-methodik-link`}
		>
			Methodik · Wahldaten
		</a>
	</section>
{/if}
