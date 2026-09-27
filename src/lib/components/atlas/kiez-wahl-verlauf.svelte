<script lang="ts">
	import EditorialDisclaimer from './editorial-disclaimer.svelte';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { sourceDisplayLabel } from '$lib/data/wahl-labels.js';

	type WahlVerlaufTyp = 'btw' | 'agh' | 'bvv';
	type WahlVerlaufStimmtyp = 'zweitstimme' | 'einstimme';

	export type WahlVerlaufRow = {
		readonly key: string;
		readonly typ: WahlVerlaufTyp;
		readonly stimmtyp: WahlVerlaufStimmtyp;
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

	const localeOpts = $derived({ locale: getLocale() });

	// i18n Block B4a: eigene, PLURAL-Messages (Bundestagswahlen/Zweitstimmen)
	// statt `wahl-labels.ts` (das SINGULAR liefert, Bundestagswahl/Zweitstimme,
	// für Seitentitel/H1) -- Wiederverwendung hätte hier Numerus gebrochen
	// (DE-Paritäts-Boundary, analog `finder_election_label` aus B3c).
	function wahlVerlaufTypLabel(typ: WahlVerlaufTyp): string {
		if (typ === 'btw') return m.kiez_wahl_verlauf_typ_btw(undefined, localeOpts);
		if (typ === 'agh') return m.kiez_wahl_verlauf_typ_agh(undefined, localeOpts);
		return m.kiez_wahl_verlauf_typ_bvv(undefined, localeOpts);
	}

	function wahlVerlaufStimmtypLabel(stimmtyp: WahlVerlaufStimmtyp): string {
		if (stimmtyp === 'einstimme')
			return m.kiez_wahl_verlauf_stimmtyp_einstimme(undefined, localeOpts);
		return m.kiez_wahl_verlauf_stimmtyp_zweitstimme(undefined, localeOpts);
	}
</script>

{#if rows.length > 0}
	<section
		aria-labelledby="kiez-wahl-verlauf-heading"
		class="space-y-4 border-l-2 border-rule pl-3"
		data-testid={testid}
	>
		<header class="space-y-1">
			<h2 id="kiez-wahl-verlauf-heading" class="font-serif text-2xl text-ink">
				{m.kiez_wahl_verlauf_heading()}
			</h2>
			<p class="font-serif text-base text-ink-muted">
				{m.kiez_wahl_verlauf_intro({ kiezName })}
			</p>
		</header>

		<ul class="space-y-5" data-testid={`${testid}-list`}>
			{#each rows as row (row.key)}
				<li class="space-y-2" data-testid={`${testid}-row-${row.key}`}>
					<p class="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
						{wahlVerlaufTypLabel(row.typ)} · {wahlVerlaufStimmtypLabel(row.stimmtyp)}
					</p>
					<ol
						class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
						aria-label={m.kiez_wahl_verlauf_ol_aria({ typLabel: wahlVerlaufTypLabel(row.typ) })}
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
			{m.kiez_wahl_verlauf_source({
				quelle1: sourceDisplayLabel('Bundeswahlleiterin', localeOpts),
				quelle2: sourceDisplayLabel('Amt für Statistik Berlin-Brandenburg', localeOpts)
			})} ·
			{m.wahl_portal_lizenz_suffix({ license: 'dl-de/by-2-0' }, localeOpts)}
		</p>

		<EditorialDisclaimer variant="cross-layer-template" />

		<a
			href={localizedHref(methodikHref)}
			class="hover:text-accent-strong inline-block font-mono text-xs text-accent underline underline-offset-2"
			data-testid={`${testid}-methodik-link`}
		>
			{m.wahl_detail_methodik_link_label()}
		</a>
	</section>
{/if}
