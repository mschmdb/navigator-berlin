<!--
	Grau unter der Gesamtansicht (#191), Runde 20b/20c: ein sachlicher Satz, darunter je
	Wahlart eine Tabelle mit Wahl, Grauanteil in ganz Berlin und den Parteien darin.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { grauSpanne, grauTabelle, wahlTypen } from '$lib/stories/wahl-quadrate/gesamt';
	import { formatShare, type SmallParty } from '$lib/stories/wahl-quadrate/grau';
	import type { WahlTyp } from '$lib/stories/wahl-quadrate/parteien';
	import type { StoriesWahlData } from '$lib/stories/wahl-quadrate/types';
	import type { GesamtState } from '$lib/stories/wahl-quadrate/url-state';
	import { aktuelleSprache, ganzeProzent } from './format';
	import { partyName } from './namen';

	interface Props {
		readonly data: StoriesWahlData;
		readonly state: GesamtState;
		readonly typNamen: Readonly<Record<WahlTyp, string>>;
	}

	let { data, state: s, typNamen }: Props = $props();

	const lang = aktuelleSprache();

	const tabellen = $derived(
		wahlTypen(s.wahl)
			.map((typ) => ({ typ, rows: grauTabelle(data, typ, s) }))
			.filter((t) => t.rows.length > 0)
	);
	const spanne = $derived(s.nurGrau ? grauSpanne(data, s) : null);
	const schwelle = $derived(ganzeProzent(s.schwelle));

	function darin(parties: readonly SmallParty[]): string {
		if (parties.length === 0) return m.bq_all_grey_others();
		const list = parties.map((p) => `${partyName(p.key)} ${formatShare(p.share, lang)}`).join(', ');
		return m.bq_all_grey_and_others({ parties: list });
	}
</script>

{#if tabellen.length > 0}
	<div class="bq-wnote">
		<p class="bq-greyhead">
			{s.schwelle > 0 ? m.bq_all_grey_head({ threshold: schwelle }) : m.bq_all_grey_head_zero()}
		</p>
		<div class="bq-greytab">
			{#each tabellen as t (t.typ)}
				<table>
					<caption>{m.bq_all_grey_caption({ set: typNamen[t.typ] })}</caption>
					<thead>
						<tr>
							<th scope="col">{m.bq_all_grey_col_election()}</th>
							<th scope="col">{m.bq_all_grey_col_grey()}</th>
							<th scope="col">{m.bq_all_grey_col_within()}</th>
						</tr>
					</thead>
					<tbody>
						{#each t.rows as r (r.jahr)}
							<tr>
								<th scope="row">{r.jahr}</th>
								<td class="num">{ganzeProzent(Math.round(r.grau * 100))}</td>
								<td>{darin(r.darin)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/each}
		</div>
		{#if spanne}
			<p class="bq-note">
				{m.bq_all_nogrey_note({
					threshold: schwelle,
					range:
						spanne.lo === spanne.hi
							? ganzeProzent(spanne.lo)
							: m.bq_all_range({ lo: String(spanne.lo), hi: ganzeProzent(spanne.hi) })
				})}
			</p>
		{/if}
	</div>
{/if}
