<!--
	Ein Themenkapitel, immer gleich gebaut: zwei Sätze, Hauptgrafik mit dem eigenen Ort, dem
	Vergleich und dem Median, Nebenwerte als kleine Tabelle, Link „Auf der Karte“.
	Auf der Bezirksseite folgt die Spanne der eigenen Kieze.
-->
<script lang="ts">
	import Section from './place-section.svelte';
	import StripChart from './strip-chart.svelte';
	import DataTable from './data-table.svelte';
	import SideTable from './side-table.svelte';
	import Hint from './reading-hint.svelte';
	import { splitForTint } from '$lib/place/tint';
	import { trackLanding } from '$lib/utils/plausible.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { mostCommon, niceDomain, spread, zeroAwareMedian } from '$lib/place/stats';
	import {
		METRIC_SPECS,
		chapterText,
		formatMetric,
		formatMetricNumber,
		formatMetricValue,
		hintFor,
		labelText,
		labelValueText,
		metricLead,
		metricText,
		type ChapterSpec,
		type MetricId
	} from '$lib/place/topics';
	import type { ReferenceProfile, RegionSnapshot } from '$lib/place/types';

	interface Props {
		spec: ChapterSpec;
		mode: 'erzaehlen' | 'zahlen';
		/** Alle Orte der Ebene (143 Kieze oder 12 Bezirke). */
		regions: readonly RegionSnapshot[];
		own: RegionSnapshot;
		unitPlural: string;
		ref: ReferenceProfile;
		/** Name des Vergleichs in Tabellen: „Berlin-Median“, „Rixdorf“. */
		refName: string;
		/** Vergleich ist ein Gebiet ohne eigenen Punkt (Bezirk auf der Kiezseite). */
		refIsLine: boolean;
		/** Vergleich ist Berlin: der Median ist dann der Vergleich. */
		refIsBerlin: boolean;
		highlight: ReadonlySet<string>;
		highlightLabel: string;
		mapHref: string | null;
		/** Für das Plausible-Ereignis „Landing“ beim Sprung in den Atlas. */
		pageType: 'kiez' | 'bezirk';
		/** Kopf der Vergleichsspalte, zweizeilig. */
		refHeadName?: string;
		refHeadSub?: string;
		/** Bezirksseite: die eigenen Kieze für die Spanne. */
		kieze?: readonly RegionSnapshot[];
		onpick?: (slug: string) => void;
		/** Kompaktes Muster (Probe in einem Kapitel): jede Information genau einmal. */
		compact?: boolean;
	}
	let {
		spec,
		mode,
		regions,
		own,
		unitPlural,
		ref,
		refName,
		refIsLine,
		refIsBerlin,
		highlight,
		highlightLabel,
		mapHref,
		pageType,
		refHeadName = '',
		refHeadSub = '',
		kieze = [],
		onpick,
		compact = true
	}: Props = $props();

	const opts = $derived({ locale: getLocale() });
	const title = $derived(chapterText(spec.id, opts).title);
	const values = (id: MetricId) => regions.map((r) => r.metrics[id]);
	const lead = $derived(
		metricLead(
			spec.main[0],
			own.name,
			own.metrics[spec.main[0]],
			values(spec.main[0]),
			unitPlural,
			refIsBerlin ? null : { name: refName, value: ref.metrics[spec.main[0]] },
			opts
		)
	);
	const fmt = (id: MetricId, v: number | null) => formatMetric(id, v, opts);
	// Achse über alle gezeigten Werte, auch die Kieze der Spanne (sonst fallen Punkte heraus).
	const domainOf = (id: MetricId) => {
		const xs = [...values(id), ...kieze.map((k) => k.metrics[id])];
		const max = Math.max(...xs.filter((v): v is number => v !== null));
		const step = max > 1000 ? 1000 : max > 100 ? 10 : max > 20 ? 5 : 1;
		return niceDomain(xs, step);
	};
	const items = (rs: readonly RegionSnapshot[], id: MetricId) =>
		rs.map((r) => ({ slug: r.slug, name: r.name, value: r.metrics[id] }));
	const allSide = $derived([...spec.main, ...spec.side]);
	const hintOf = (id: MetricId) =>
		hintFor(
			id,
			own.metrics[id],
			refIsBerlin
				? zeroAwareMedian(values(id), METRIC_SPECS[id].zeroPile === true).value
				: ref.metrics[id],
			refIsBerlin ? m.place_ref_berlin_median_text() : refName,
			opts
		);
	const leadHint = $derived(hintOf(spec.main[0]));
	// Kompakt: die Lesehilfe als Tönung um die wertende Phrase im Satz, kein eigenes Badge.
	const leadTint = $derived(
		compact && leadHint && leadHint.tone !== 'neutral' ? splitForTint(lead, leadHint.short) : null
	);
	const typicalLabel = $derived(
		regions.length > 20 ? m.place_side_typical_kiez() : m.place_side_typical_bezirk()
	);
	const classOf = (v: string | null | undefined) => (v ? labelValueText(v, opts) : '–');
	const mainText = $derived(metricText(spec.main[0], opts));
	// Textfassung für Screenreader und Tabellen-Ansicht: alle Werte, Klassen und die Kiez-Spanne.
	const tableRows = $derived([
		...allSide.map((id) => {
			const b = zeroAwareMedian(values(id), METRIC_SPECS[id].zeroPile === true);
			const median = fmt(id, b.value);
			return [
				metricText(id, opts).label,
				fmt(id, own.metrics[id]),
				fmt(id, ref.metrics[id]),
				b.zerosLeftOut > 0
					? m.place_chapter_zero_values({ value: median, count: b.zerosLeftOut })
					: median
			];
		}),
		...(spec.labels ?? []).map((l) => [
			labelText(l, opts).label,
			classOf(own.labels[l]),
			classOf(ref.labels[l]),
			m.place_chapter_most_common({
				value: classOf(mostCommon(regions.map((r) => r.labels[l])))
			})
		]),
		...(kieze.length > 1
			? spec.main.flatMap((id) => {
					const s = spread(kieze, (k) => k.metrics[id]);
					return s
						? [
								[
									m.place_chapter_range_label({
										label: metricText(id, opts).label,
										name: own.name
									}),
									m.place_chapter_range_value({
										min: fmt(id, s.min.metrics[id]),
										minName: s.min.name,
										max: fmt(id, s.max.metrics[id]),
										maxName: s.max.name
									}),
									'',
									''
								]
							]
						: [];
				})
			: [])
	]);
</script>

<!-- mapHref kommt fertig lokalisiert von der Seite (localizedHref('/explore') plus Query). -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

<Section id={spec.id} {title} {mode}>
	{#snippet text()}
		{#if leadTint}
			<p>
				{leadTint.before}<span
					class="-mx-0.5 rounded-sm box-decoration-clone px-0.5 {leadHint?.tone === 'good'
						? 'bg-[var(--hint-good-bg)]'
						: 'bg-[var(--hint-bad-bg)]'}">{leadTint.tinted}</span
				>{leadTint.after}
			</p>
		{:else}
			<p>{lead}</p>
			{#if leadHint && !compact}<p><Hint hint={leadHint} /></p>{/if}
		{/if}
		<p class="text-sm">
			{m.place_chapter_what_source({ what: mainText.what, source: mainText.source })}
		</p>
		{#if mapHref}
			<p>
				<a
					class="inline-flex min-h-6 items-center text-accent underline"
					href={mapHref}
					onclick={() => trackLanding('map_button', pageType)}>{m.place_chapter_on_map()}</a
				>
			</p>
		{/if}
	{/snippet}
	{#snippet chart()}
		<!-- Abstände: zwischen Grafiken im Kapitel 4rem, Bezirk und Kieze 2rem, Grafik zu Tabelle 3rem -->
		<div class="flex flex-col {compact ? 'gap-8' : 'gap-12'}">
			<div class="flex flex-col gap-16">
				{#each spec.main as id (id)}
					{@const text = metricText(id, opts)}
					<div class="flex flex-col gap-8">
						<div>
							{#if compact}
								<p class="border-b border-rule pb-1 text-sm font-semibold text-ink">
									{text.label}
									<span class="ml-1 text-dense-label font-normal text-ink-subtle">{text.unit}</span>
								</p>
							{:else}
								<p
									class="flex items-baseline justify-between gap-3 border-b border-rule pb-1 text-sm font-semibold text-ink"
								>
									<span>{text.label}, {text.unit}</span>
									<!-- Richtung ohne Legende lesbar: links weniger, rechts mehr -->
									<span
										class="shrink-0 text-dense-label font-normal text-ink-subtle"
										aria-hidden="true">← {text.lower}&emsp;{text.higher} →</span
									>
								</p>
							{/if}
							<StripChart
								items={items(regions, id)}
								domain={domainOf(id)}
								format={compact ? (v) => formatMetricValue(id, v, opts) : (v) => fmt(id, v)}
								axisFormat={(v) => formatMetricNumber(id, v, opts)}
								unit={compact ? '' : text.unit}
								ends={compact ? [m.place_axis_less(), m.place_axis_more()] : null}
								ownSlug={own.slug}
								{highlight}
								{highlightLabel}
								refSlug={refIsLine ? null : ref.slug}
								refLine={refIsLine ? { value: ref.metrics[id], label: refName } : null}
								medianLabel={compact
									? typicalLabel
									: m.place_chapter_median_of({
											count: regions.length,
											units: unitPlural
										})}
								zeroName={text.zeroName}
								zeroMedianLabel={text.zeroMedianLabel}
								{unitPlural}
								zeroPile={METRIC_SPECS[id].zeroPile === true}
								ownHint={compact ? null : hintOf(id)}
								r={regions.length < 20 ? 6 : 2.9}
								{onpick}
							/>
						</div>
						{#if kieze.length > 1}
							{@const s = spread(kieze, (k) => k.metrics[id])}
							{#if s}
								<div>
									<p class="text-sm text-ink">
										{m.place_chapter_range_text({
											count: kieze.length,
											name: own.name,
											min: fmt(id, s.min.metrics[id]),
											minName: s.min.name,
											max: fmt(id, s.max.metrics[id]),
											maxName: s.max.name
										})}
									</p>
									<StripChart
										items={items(kieze, id)}
										domain={domainOf(id)}
										format={compact ? (v) => formatMetricValue(id, v, opts) : (v) => fmt(id, v)}
										axisFormat={(v) => formatMetricNumber(id, v, opts)}
										unit={compact ? '' : text.unit}
										ends={compact ? [m.place_axis_less(), m.place_axis_more()] : null}
										ownSlug={null}
										highlight={new Set([s.min.slug, s.max.slug])}
										highlightLabel={m.place_and({ a: s.min.name, b: s.max.name })}
										refSlug={null}
										refLine={{
											value: own.metrics[id],
											label: m.place_total_of({ name: own.name })
										}}
										medianLabel={m.place_chapter_median_kieze_in({ name: own.name })}
										unitPlural={m.place_units_kieze()}
										r={4.5}
									/>
								</div>
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/snippet}
	{#snippet afterChart()}
		<!-- Außerhalb der aria-hidden-Grafik: die Tabelle hat fokussierbare Aufklapper. -->
		<SideTable
			metrics={spec.side}
			labels={spec.labels ?? []}
			{regions}
			{own}
			{ref}
			refHead={refIsBerlin ? null : { name: refHeadName, sub: refHeadSub }}
			{unitPlural}
			{compact}
		/>
	{/snippet}
	{#snippet table(visible)}
		<DataTable
			{visible}
			caption={m.place_chapter_caption({ title, own: own.name, ref: refName })}
			head={[m.place_table_value(), own.name, refName, m.place_table_berlin_median()]}
			rows={tableRows}
		/>
	{/snippet}
	{#snippet sources()}
		<ul class="flex flex-col gap-1">
			{#each allSide as id (id)}
				{@const text = metricText(id, opts)}
				<li>{text.label}: {text.source}</li>
			{/each}
		</ul>
	{/snippet}
</Section>
