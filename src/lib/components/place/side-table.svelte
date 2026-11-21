<!--
	„Weitere Werte“ eines Kapitels, gemeinsame Tabelle beider Seiten.
	Kopf zweizeilig: Name, darunter klein die Art des Werts. Einheit einmal in der Zeile,
	Zellen nur Zahlen (Sans mit tabular-nums, rechtsbündig, feste Breite, damit die Spalten zwischen den
	Kapiteln fluchten). Mobil gestapelt statt gequetscht. Große Nullstapel lässt der Median aus.
-->
<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { mostCommon, zeroAwareMedian } from '#lib/place/stats.ts';
	import {
		METRIC_SPECS,
		formatMetricValue,
		hintFor,
		labelText,
		labelValueText,
		metricText,
		zeroPileNote,
		type Hint as HintData,
		type LabelId,
		type MetricId
	} from '#lib/place/topics.ts';
	import type { ReferenceProfile, RegionSnapshot } from '#lib/place/types.ts';
	import Hint from './reading-hint.svelte';

	interface Props {
		metrics: readonly MetricId[];
		labels: readonly LabelId[];
		regions: readonly RegionSnapshot[];
		own: RegionSnapshot;
		ref: ReferenceProfile;
		/** Kopf des Vergleichs: Name und Art, etwa „Neukölln“ / „gesamt“. */
		refHead: { readonly name: string; readonly sub: string } | null;
		unitPlural: string;
		/** Kompaktes Muster: kein „dieser Ort“, Hinweise direkt unter der Überschrift, Tönung statt Badge. */
		compact?: boolean;
	}
	let {
		metrics,
		labels,
		regions,
		own,
		ref,
		refHead,
		unitPlural,
		compact = false
	}: Props = $props();
	const typicalTitle = $derived(
		m.place_typical_title({ count: regions.length, units: unitPlural })
	);
	// Ebene aus der Zahl der Orte: 143 Kieze oder 12 Bezirke.
	const typical = $derived(
		regions.length > 20 ? m.place_side_typical_kiez() : m.place_side_typical_bezirk()
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
			const b = zeroAwareMedian(
				regions.map((r) => r.metrics[id]),
				METRIC_SPECS[id].zeroPile === true
			);
			const text = metricText(id, opts);
			const count = METRIC_SPECS[id].unitKind === 'count';
			const hint = refHead
				? hintFor(id, own.metrics[id], ref.metrics[id], refHead.name, opts)
				: hintFor(id, own.metrics[id], b.value, m.place_ref_berlin_median_text(), opts);
			return {
				key: id,
				count,
				label: text.label,
				unit: count ? '' : text.unit,
				what: count ? (id === 'kulturorte' ? m.place_m_kulturorte_short() : '') : text.what,
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
			unit: m.place_side_class(),
			what: labelText(l, opts).what,
			own: classText(own.labels[l]),
			ref: classText(ref.labels[l]),
			berlin: classText(mostCommon(regions.map((r) => r.labels[l]))),
			hint: null,
			count: false
		}))
	]);
	const hasCounts = $derived(rows.some((r) => r.count));
	// Kompakt: gemeinsame Einheit einmal unter der Überschrift statt in jeder Zeile.
	const sharedUnit = $derived(
		compact && rows.length > 1 && rows.every((r) => r.unit && r.unit === rows[0].unit)
			? rows[0].unit
			: null
	);
	const showUnit = (r: { unit: string }) => r.unit && !sharedUnit;
	// Kompakt: Beschreibung nur, wenn sie etwas Eigenes sagt (was zu Kulturorten zählt).
	const showWhat = (r: { label: string; what: string }) =>
		r.what && (!compact || r.what !== r.label);
	const whatOf = (r: { what: string }) => r.what;
	// Lange Pflicht-Erläuterung (Kriminalität): mobil erster Satz, der Rest zum Aufklappen.
	const splitWhat = (w: string) => {
		const i = w.indexOf('. ');
		return w.length > 140 && i > 0
			? { first: w.slice(0, i + 1), rest: w.slice(i + 2) }
			: { first: w, rest: '' };
	};
	// Kompakt: Richtung nur als kurzer Text ohne Farbe, und nur bei Werten mit klarer Richtung.
	const arrowOf = (h: HintData) => (h.dir === 'higher' ? '↑' : h.dir === 'lower' ? '↓' : '≈');
	const zeroNotes = $derived(
		metrics
			.map((id) => {
				const vs = regions.map((r) => r.metrics[id]);
				const z = zeroAwareMedian(vs, METRIC_SPECS[id].zeroPile === true).zerosLeftOut;
				return { id, z, withValue: vs.filter((v) => v !== null).length - z };
			})
			.filter((e) => e.z > 0)
			.map((e) => zeroPileNote(e.id, e.withValue, typical, unitPlural, opts))
	);
</script>

<!-- Ab sm: Tabelle mit festen Zahlenspalten -->
<table
	class="hidden w-full table-fixed border-collapse text-left [overflow-wrap:break-word] sm:table"
>
	<caption class="mb-2 text-left text-sm font-semibold text-ink">
		{m.place_side_caption()}
		{#if compact}
			{#if sharedUnit || hasCounts}<span class="block text-dense-label font-normal text-ink-subtle"
					>{sharedUnit ?? m.place_side_count_note()}</span
				>{/if}
			<span class="block text-dense-label font-normal text-ink-subtle"
				>{m.place_side_typical_line({ typical, count: regions.length, units: unitPlural })}</span
			>
		{/if}
	</caption>
	<colgroup>
		<col />
		<col class="w-40" />
		{#if refHead}<col class="w-32" />{/if}
		<col class="w-28" />
	</colgroup>
	<thead>
		<tr class="border-b border-rule align-bottom">
			<th scope="col" class="pb-1.5"><span class="sr-only">{m.place_table_value()}</span></th>
			<th scope="col" class="pb-1.5 pl-3 text-right text-sm font-semibold text-accent">
				{own.name.replaceAll('/', '/\u200b')}{#if !compact}<span
						class="block text-dense-label font-normal text-ink-subtle"
						>{m.place_side_this_place()}</span
					>{/if}
			</th>
			{#if refHead}
				<th scope="col" class="pb-1.5 pl-3 text-right text-sm font-normal text-ink">
					{refHead.name}<span class="block text-dense-label text-ink-subtle">{refHead.sub}</span>
				</th>
			{/if}
			<th scope="col" class="pr-2 pb-1.5 pl-3 text-right text-sm font-normal text-ink">
				{#if compact}
					<abbr title={typicalTitle} class="no-underline">{typical}</abbr>
				{:else}
					{m.place_side_berlin()}<span class="block text-dense-label text-ink-subtle"
						>{typical}</span
					>
				{/if}
			</th>
		</tr>
	</thead>
	<tbody>
		{#each rows as r (r.key)}
			<tr class="border-b border-rule align-top last:border-b-0">
				<th scope="row" class="py-2 pr-2 text-left text-sm font-normal text-ink">
					{r.label}{#if showUnit(r)}<span class="text-dense-label text-ink-subtle">, {r.unit}</span
						>{/if}
					{#if showWhat(r)}<span class="block text-dense-label text-ink-subtle">{whatOf(r)}</span
						>{/if}
				</th>
				<td class="py-2 pl-3 text-right align-top">
					<span class="text-sm whitespace-nowrap text-accent tabular-nums">{r.own}</span>
					{#if r.hint && !compact}<span class="mt-0.5 block"><Hint hint={r.hint} short /></span
						>{:else if r.hint}<span class="block text-dense-label text-ink-subtle"
							><span aria-hidden="true">{arrowOf(r.hint)}</span> {r.hint.short}</span
						>{/if}
				</td>
				{#if refHead}
					<td class="py-2 pl-3 text-right text-sm whitespace-nowrap tabular-nums">{r.ref}</td>
				{/if}
				<td class="py-2 pr-2 pl-3 text-right text-sm whitespace-nowrap text-ink-muted tabular-nums"
					>{r.berlin}</td
				>
			</tr>
		{/each}
	</tbody>
</table>

<!-- Mobil: eine Zeile je Wert in natürlicher Sprache, Vergleich klein darunter -->
<div class="sm:hidden">
	<p class="text-sm font-semibold text-ink">{m.place_side_caption()}</p>
	{#if sharedUnit}<p class="text-dense-label text-ink-subtle">{sharedUnit}</p>
	{:else if hasCounts}<p class="text-dense-label text-ink-subtle">
			{m.place_side_count_note()}
		</p>{/if}
	{#if compact}<p class="text-dense-label text-ink-subtle">
			{m.place_side_typical_line({ typical, count: regions.length, units: unitPlural })}
		</p>{/if}
	<ul class="mt-1 flex flex-col">
		{#each rows as r (r.key)}
			<li class="border-b border-rule py-1.5 pr-1 last:border-b-0">
				<div class="flex items-baseline justify-between gap-3">
					<span class="text-sm text-ink"
						>{r.label}{#if showUnit(r)}<span class="text-dense-label text-ink-subtle"
								>, {r.unit}</span
							>{/if}</span
					>
					<span class="text-sm text-accent tabular-nums">{r.own}</span>
				</div>
				{#if showWhat(r)}
					{@const w = splitWhat(whatOf(r))}
					<p class="text-dense-label text-ink-subtle">{w.first}</p>
					{#if w.rest}
						<details class="text-dense-label text-ink-subtle">
							<summary class="inline-flex min-h-6 cursor-pointer items-center text-accent underline"
								>{m.place_side_what_more()}</summary
							>
							<p>{w.rest}</p>
						</details>
					{/if}
				{/if}
				<p
					class="flex flex-wrap items-center gap-x-2 text-dense-label text-ink-subtle tabular-nums"
				>
					{#if refHead}<span>{refHead.name}: {r.ref}</span>{/if}
					<span>{typical}: {r.berlin}</span>
					{#if r.hint && !compact}<Hint hint={r.hint} short />{:else if r.hint}<span
							><span aria-hidden="true">{arrowOf(r.hint)}</span> {r.hint.short}</span
						>{/if}
				</p>
			</li>
		{/each}
	</ul>
</div>
{#if !compact || zeroNotes.length > 0}
	<div class="mt-1 flex flex-col gap-0.5 text-dense-label text-ink-subtle">
		{#if !compact}
			<p class="hidden sm:block">
				{#if hasCounts}{m.place_side_count_note()}{/if}
			</p>
			<p>{m.place_side_typical_note({ count: regions.length, units: unitPlural })}</p>
		{/if}
		{#each zeroNotes as n (n)}<p>{n}</p>{/each}
	</div>
{/if}
