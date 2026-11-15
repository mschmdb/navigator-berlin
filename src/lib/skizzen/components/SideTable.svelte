<!--
	„Weitere Werte“ eines Kapitels, gemeinsame Tabelle beider Seiten.
	Kopf zweizeilig: Name, darunter klein die Art des Werts. Einheit einmal in der Zeile,
	Zellen nur Zahlen (Plex Mono, rechtsbündig, feste Breite, damit die Spalten zwischen den
	Kapiteln fluchten). Mobil gestapelt statt gequetscht. Große Nullstapel lässt der Median aus.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { mostCommon, zeroAwareMedian } from '../stats';
	import {
		METRIC_SPECS,
		formatMetricValue,
		hintFor,
		labelText,
		labelValueText,
		metricText,
		type Hint as HintData,
		type LabelId,
		type MetricId
	} from '../topics';
	import type { ReferenceProfile, RegionSnapshot } from '../types';
	import Hint from './Hint.svelte';

	interface Props {
		metrics: readonly MetricId[];
		labels: readonly LabelId[];
		regions: readonly RegionSnapshot[];
		own: RegionSnapshot;
		ref: ReferenceProfile;
		/** Kopf des Vergleichs: Name und Art, etwa „Neukölln“ / „gesamt“. */
		refHead: { readonly name: string; readonly sub: string } | null;
		unitPlural: string;
	}
	let { metrics, labels, regions, own, ref, refHead, unitPlural }: Props = $props();
	// Ebene aus der Zahl der Orte: 143 Kieze oder 12 Bezirke.
	const typical = $derived(
		regions.length > 20 ? m.skizze_side_typical_kiez() : m.skizze_side_typical_bezirk()
	);
	const opts = $derived({ locale: getLocale() });
	const classText = (v: string | null | undefined) => (v ? labelValueText(v, opts) : '–');

	interface Row {
		key: string;
		label: string;
		unit: string;
		what: string;
		own: string;
		ref: string;
		berlin: string;
		hint: HintData | null;
		/** Zählwert ohne Wertung: Hinweis zur Gebietsgröße steht einmal über der Gruppe. */
		count: boolean;
	}
	const rows = $derived<Row[]>([
		...metrics.map((id) => {
			const b = zeroAwareMedian(regions.map((r) => r.metrics[id]));
			const text = metricText(id, opts);
			const count = METRIC_SPECS[id].unitKind === 'count';
			const hint = refHead
				? hintFor(id, own.metrics[id], ref.metrics[id], refHead.name, opts)
				: hintFor(id, own.metrics[id], b.value, m.skizze_ref_berlin_median(), opts);
			return {
				key: id,
				count,
				label: text.label,
				unit: count ? '' : text.unit,
				what: count ? (id === 'kulturorte' ? m.skizze_m_kulturorte_short() : '') : text.what,
				own: formatMetricValue(id, own.metrics[id], opts),
				// Zählwert eines ganzen Bezirks neben einem Kiez sagt nichts: dann kein Vergleichswert.
				ref:
					count && ref.slug === null && regions.length > 20
						? '–'
						: formatMetricValue(id, ref.metrics[id], opts),
				berlin: `${formatMetricValue(id, b.value, opts)}${b.zerosLeftOut > 0 ? '¹' : ''}`,
				// Lesehilfe nur, wo sie etwas sagt: Zählwerte und neutrale Werte ohne Badge.
				hint: hint && hint.tone !== 'neutral' ? hint : null
			};
		}),
		...labels.map((l) => ({
			key: l,
			label: labelText(l, opts).label,
			unit: m.skizze_side_class(),
			what: labelText(l, opts).what,
			own: classText(own.labels[l]),
			ref: classText(ref.labels[l]),
			berlin: classText(mostCommon(regions.map((r) => r.labels[l]))),
			hint: null,
			count: false
		}))
	]);
	const hasCounts = $derived(rows.some((r) => r.count));
	const zeroNotes = $derived(
		metrics
			.map((id) => ({ id, z: zeroAwareMedian(regions.map((r) => r.metrics[id])).zerosLeftOut }))
			.filter((e) => e.z > 0)
			.map((e) => {
				const text = metricText(e.id, opts);
				return m.skizze_side_zero_note({
					label: text.label,
					count: e.z,
					units: unitPlural,
					zeroName: text.zeroName ?? m.skizze_side_zero_default()
				});
			})
	);
</script>

<!-- Ab sm: Tabelle mit festen Zahlenspalten -->
<table
	class="hidden w-full table-fixed border-collapse text-left [overflow-wrap:break-word] sm:table"
>
	<caption class="mb-2 text-left text-sm font-semibold text-ink">{m.skizze_side_caption()}</caption>
	<colgroup>
		<col />
		<col class="w-40" />
		{#if refHead}<col class="w-32" />{/if}
		<col class="w-28" />
	</colgroup>
	<thead>
		<tr class="border-b border-rule align-bottom">
			<th scope="col" class="pb-1.5"><span class="sr-only">{m.skizze_table_value()}</span></th>
			<th scope="col" class="pb-1.5 pl-3 text-right text-sm font-semibold text-accent">
				{own.name.replaceAll('/', '/\u200b')}<span
					class="block text-dense-label font-normal text-ink-subtle"
					>{m.skizze_side_this_place()}</span
				>
			</th>
			{#if refHead}
				<th scope="col" class="pb-1.5 pl-3 text-right text-sm font-normal text-ink">
					{refHead.name}<span class="block text-dense-label text-ink-subtle">{refHead.sub}</span>
				</th>
			{/if}
			<th scope="col" class="pb-1.5 pl-3 text-right text-sm font-normal text-ink">
				{m.skizze_side_berlin()}<span class="block text-dense-label text-ink-subtle">{typical}</span
				>
			</th>
		</tr>
	</thead>
	<tbody>
		{#each rows as r (r.key)}
			<tr class="border-b border-rule align-top">
				<th scope="row" class="py-2 pr-2 text-left text-sm font-normal text-ink">
					{r.label}{#if r.unit}<span class="text-dense-label text-ink-subtle">, {r.unit}</span>{/if}
					{#if r.what}<span class="block text-dense-label text-ink-subtle">{r.what}</span>{/if}
				</th>
				<td class="py-2 pl-3 text-right align-top">
					<span class="block font-mono text-sm whitespace-nowrap text-accent tabular-nums"
						>{r.own}</span
					>
					{#if r.hint}<span class="mt-0.5 block"><Hint hint={r.hint} short /></span>{/if}
				</td>
				{#if refHead}
					<td class="py-2 pl-3 text-right font-mono text-sm whitespace-nowrap tabular-nums"
						>{r.ref}</td
					>
				{/if}
				<td
					class="py-2 pl-3 text-right font-mono text-sm whitespace-nowrap text-ink-muted tabular-nums"
					>{r.berlin}</td
				>
			</tr>
		{/each}
	</tbody>
</table>

<!-- Mobil: eine Zeile je Wert in natürlicher Sprache, Vergleich klein darunter -->
<div class="sm:hidden">
	<p class="text-sm font-semibold text-ink">{m.skizze_side_caption()}</p>
	{#if hasCounts}<p class="text-dense-label text-ink-subtle">{m.skizze_side_count_note()}</p>{/if}
	<ul class="mt-1 flex flex-col">
		{#each rows as r (r.key)}
			<li class="border-b border-rule py-1.5">
				<div class="flex items-baseline justify-between gap-3">
					<span class="text-sm text-ink"
						>{r.label}{#if r.unit}<span class="text-dense-label text-ink-subtle">, {r.unit}</span
							>{/if}</span
					>
					<span class="font-mono text-sm text-accent tabular-nums">{r.own}</span>
				</div>
				{#if r.what}<p class="text-dense-label text-ink-subtle">{r.what}</p>{/if}
				<p
					class="flex flex-wrap items-center gap-x-2 text-dense-label text-ink-subtle tabular-nums"
				>
					{#if refHead}<span>{refHead.name}: {r.ref}</span>{/if}
					<span>{typical}: {r.berlin}</span>
					{#if r.hint}<Hint hint={r.hint} short />{/if}
				</p>
			</li>
		{/each}
	</ul>
</div>
<div class="mt-1 flex flex-col gap-0.5 text-dense-label text-ink-subtle">
	<p class="hidden sm:block">
		{#if hasCounts}{m.skizze_side_count_note()}{/if}
	</p>
	<p>{m.skizze_side_typical_note({ count: regions.length, units: unitPlural })}</p>
	{#each zeroNotes as n (n)}<p>{n}</p>{/each}
</div>
