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
	<section aria-labelledby="kiez-wahl-verlauf-heading" class="space-y-4" data-testid={testid}>
		<header class="space-y-1">
			<h2 id="kiez-wahl-verlauf-heading" class="text-2xl font-bold text-ink">
				{m.kiez_wahl_verlauf_heading()}
			</h2>
			<p class="text-base text-ink-muted">
				{m.kiez_wahl_verlauf_intro({ kiezName })}
			</p>
		</header>

		<!-- #90: je Wahl eine kompakte Tabelle (Jahre als Spalten, stärkste Partei darunter)
		     statt eines Kachel-Rasters. Linien gliedern, Boxen entfallen. -->
		<div class="space-y-5" data-testid={`${testid}-list`}>
			{#each rows as row (row.key)}
				<div class="overflow-x-auto" data-testid={`${testid}-row-${row.key}`}>
					<table
						class="w-full font-sans text-sm"
						aria-label={m.kiez_wahl_verlauf_ol_aria({ typLabel: wahlVerlaufTypLabel(row.typ) })}
					>
						<caption class="pb-1 text-left text-dense-meta text-ink-muted">
							{wahlVerlaufTypLabel(row.typ)}, {wahlVerlaufStimmtypLabel(row.stimmtyp)}
						</caption>
						<thead>
							<tr class="border-b border-rule">
								{#each row.jahre as cell (cell.jahr)}
									<th
										scope="col"
										class="py-1 pr-4 text-left font-normal text-ink-muted tabular-nums"
										>{cell.jahr}</th
									>
								{/each}
							</tr>
						</thead>
						<tbody>
							<tr class="border-b border-rule">
								{#each row.jahre as cell (cell.jahr)}
									<td class="py-2 pr-4 text-ink" data-testid={`${testid}-${row.key}-${cell.jahr}`}>
										<span class="inline-flex items-center gap-2 font-medium">
											<span
												class="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
												style="background-color:{parteiColor(cell.parteiKurzname)};"
												aria-hidden="true"
											></span>{cell.parteiKurzname}</span
										>
									</td>
								{/each}
							</tr>
						</tbody>
					</table>
				</div>
			{/each}
		</div>

		<p class="text-dense-meta text-ink-muted" data-testid={`${testid}-source`}>
			{m.kiez_wahl_verlauf_source({
				quelle1: sourceDisplayLabel('Bundeswahlleiterin', localeOpts),
				quelle2: sourceDisplayLabel('Amt für Statistik Berlin-Brandenburg', localeOpts)
			})},
			{m.wahl_portal_lizenz_suffix({ license: 'dl-de/by-2-0' }, localeOpts)}
		</p>

		<EditorialDisclaimer variant="cross-layer-template" />

		<a
			href={localizedHref(methodikHref)}
			class="inline-flex min-h-(--target-min) items-center text-xs text-accent underline underline-offset-2 hover:text-accent-strong"
			data-testid={`${testid}-methodik-link`}
		>
			{m.wahl_detail_methodik_link_label()}
		</a>
	</section>
{/if}
