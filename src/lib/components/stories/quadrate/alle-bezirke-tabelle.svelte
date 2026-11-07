<!--
	Tabellen-Alternative der Gesamtansicht für Bildschirmleser (#191): je Wahlart eine Tabelle
	mit einer Zeile pro sichtbarem Bezirk und sichtbarer Wahl. Sie folgt Schwelle, Sortierung
	und Ausblendungen. Die Quadrate verzichten dafür auf ihre eigenen Tabellen.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { toElectionShares } from '$lib/stories/wahl-quadrate/eingabe';
	import { bezirkAn, sichtbareJahre, wahlTypen } from '$lib/stories/wahl-quadrate/gesamt';
	import { derive, formatShare } from '$lib/stories/wahl-quadrate/grau';
	import { ORDER, wahlSlug, type WahlTyp } from '$lib/stories/wahl-quadrate/parteien';
	import type { BezirkWahlen } from '$lib/stories/wahl-quadrate/types';
	import type { GesamtState } from '$lib/stories/wahl-quadrate/url-state';
	import { aktuelleSprache, ganzeProzent } from './format';
	import { partyName } from './namen';

	interface Props {
		readonly state: GesamtState;
		/** Bereits sortiert. */
		readonly bezirke: readonly BezirkWahlen[];
		readonly typNamen: Readonly<Record<WahlTyp, string>>;
	}

	let { state: s, bezirke, typNamen }: Props = $props();

	const lang = aktuelleSprache();

	interface Zeile {
		key: string;
		titel: string;
		zellen: string[];
		beteiligung: string;
	}

	function zeilen(typ: WahlTyp): Zeile[] {
		const jahre = sichtbareJahre(s, typ);
		return bezirke
			.filter((b) => bezirkAn(s, b.nr))
			.flatMap((b) =>
				jahre.flatMap((jahr) => {
					const slug = wahlSlug(typ, jahr);
					const z = slug ? b.wahlen[slug] : undefined;
					if (!z) return [];
					const d = derive(toElectionShares(z), s.schwelle / 100);
					return [
						{
							key: `${b.nr}-${jahr}`,
							titel: m.bq_all_square_title({ district: b.name, set: typNamen[typ], year: jahr }),
							zellen: ORDER.map((k) =>
								d.disp[k] > 0 ? formatShare(d.disp[k], lang) : m.bq_all_table_in_grey()
							),
							beteiligung: formatShare(z.wahlbeteiligung, lang)
						}
					];
				})
			);
	}

	const tabellen = $derived(
		wahlTypen(s.wahl)
			.map((typ) => ({ typ, rows: zeilen(typ) }))
			.filter((t) => t.rows.length > 0)
	);
	const greyHead = $derived(m.bq_grey_row({ threshold: ganzeProzent(s.schwelle) }));
</script>

<div class="bq-sr">
	{#each tabellen as t (t.typ)}
		<table>
			<caption>{m.bq_all_table_caption({ set: typNamen[t.typ] })}</caption>
			<thead>
				<tr>
					<th scope="col">{m.bq_all_table_row()}</th>
					{#each ORDER as k (k)}
						<th scope="col">{k === 'rest' ? greyHead : partyName(k)}</th>
					{/each}
					<th scope="col">{m.bq_turnout()}</th>
				</tr>
			</thead>
			<tbody>
				{#each t.rows as r (r.key)}
					<tr>
						<th scope="row">{r.titel}</th>
						{#each r.zellen as c, i (ORDER[i])}
							<td>{c}</td>
						{/each}
						<td>{r.beteiligung}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/each}
</div>
