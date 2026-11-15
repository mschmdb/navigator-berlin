<!--
	Ein Themenkapitel, immer gleich gebaut: zwei Sätze, Hauptgrafik mit dem eigenen Ort, dem
	Vergleich und dem Median, Nebenwerte als kleine Tabelle, Link „Auf der Karte“.
	Auf der Bezirksseite folgt die Spanne der eigenen Kieze.
-->
<script lang="ts">
	import Section from './Section.svelte';
	import StripChart from './StripChart.svelte';
	import DataTable from './DataTable.svelte';
	import SideTable from './SideTable.svelte';
	import Hint from './Hint.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime';
	import { mostCommon, niceDomain, spread, zeroAwareMedian } from '../stats';
	import {
		chapterText,
		formatMetric,
		formatMetricNumber,
		hintFor,
		labelText,
		labelValueText,
		metricLead,
		metricText,
		type ChapterSpec,
		type MetricId
	} from '../topics';
	import type { ReferenceProfile, RegionSnapshot } from '../types';

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
		/** Kopf der Vergleichsspalte, zweizeilig. */
		refHeadName?: string;
		refHeadSub?: string;
		/** Bezirksseite: die eigenen Kieze für die Spanne. */
		kieze?: readonly RegionSnapshot[];
		onpick?: (slug: string) => void;
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
		refHeadName = '',
		refHeadSub = '',
		kieze = [],
		onpick
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
			refIsBerlin ? zeroAwareMedian(values(id)).value : ref.metrics[id],
			refIsBerlin ? m.skizze_ref_berlin_median() : refName,
			opts
		);
	const leadHint = $derived(hintOf(spec.main[0]));
	const classOf = (v: string | null | undefined) => (v ? labelValueText(v, opts) : '–');
	const mainText = $derived(metricText(spec.main[0], opts));
	// Textfassung für Screenreader und Tabellen-Ansicht: alle Werte, Klassen und die Kiez-Spanne.
	const tableRows = $derived([
		...allSide.map((id) => {
			const b = zeroAwareMedian(values(id));
			const median = fmt(id, b.value);
			return [
				metricText(id, opts).label,
				fmt(id, own.metrics[id]),
				fmt(id, ref.metrics[id]),
				b.zerosLeftOut > 0
					? m.skizze_chapter_zero_values({ value: median, count: b.zerosLeftOut })
					: median
			];
		}),
		...(spec.labels ?? []).map((l) => [
			labelText(l, opts).label,
			classOf(own.labels[l]),
			classOf(ref.labels[l]),
			m.skizze_chapter_most_common({
				value: classOf(mostCommon(regions.map((r) => r.labels[l])))
			})
		]),
		...(kieze.length > 1
			? spec.main.flatMap((id) => {
					const s = spread(kieze, (k) => k.metrics[id]);
					return s
						? [
								[
									m.skizze_chapter_range_label({
										label: metricText(id, opts).label,
										name: own.name
									}),
									m.skizze_chapter_range_value({
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

<Section id={spec.id} {title} {mode}>
	{#snippet text()}
		<p>{lead}</p>
		{#if leadHint}<p><Hint hint={leadHint} /></p>{/if}
		<p class="text-sm">
			{m.skizze_chapter_what_source({ what: mainText.what, source: mainText.source })}
		</p>
		{#if mapHref}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<p>
				<a class="inline-flex min-h-6 items-center text-accent underline" href={mapHref}
					>{m.skizze_chapter_on_map()}</a
				>
			</p>
		{/if}
	{/snippet}
	{#snippet chart()}
		<!-- Abstände: zwischen Grafiken im Kapitel 4rem, Bezirk und Kieze 2rem, Grafik zu Tabelle 3rem -->
		<div class="flex flex-col gap-12">
			<div class="flex flex-col gap-16">
				{#each spec.main as id (id)}
					{@const text = metricText(id, opts)}
					<div class="flex flex-col gap-8">
						<div>
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
							<StripChart
								items={items(regions, id)}
								domain={domainOf(id)}
								format={(v) => fmt(id, v)}
								axisFormat={(v) => formatMetricNumber(id, v, opts)}
								unit={text.unit}
								ownSlug={own.slug}
								{highlight}
								{highlightLabel}
								refSlug={refIsLine ? null : ref.slug}
								refLine={refIsLine ? { value: ref.metrics[id], label: refName } : null}
								medianLabel={m.skizze_chapter_median_of({
									count: regions.length,
									units: unitPlural
								})}
								zeroName={text.zeroName}
								zeroMedianLabel={text.zeroMedianLabel}
								{unitPlural}
								ownHint={hintOf(id)}
								r={regions.length < 20 ? 6 : 2.9}
								{onpick}
							/>
						</div>
						{#if kieze.length > 1}
							{@const s = spread(kieze, (k) => k.metrics[id])}
							{#if s}
								<div>
									<p class="text-sm text-ink">
										{m.skizze_chapter_range_text({
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
										format={(v) => fmt(id, v)}
										axisFormat={(v) => formatMetricNumber(id, v, opts)}
										unit={text.unit}
										ownSlug={null}
										highlight={new Set([s.min.slug, s.max.slug])}
										highlightLabel={m.skizze_and({ a: s.min.name, b: s.max.name })}
										refSlug={null}
										refLine={{
											value: own.metrics[id],
											label: m.skizze_total_of({ name: own.name })
										}}
										medianLabel={m.skizze_chapter_median_kieze_in({ name: own.name })}
										unitPlural={m.skizze_units_kieze()}
										r={4.5}
									/>
								</div>
							{/if}
						{/if}
					</div>
				{/each}
			</div>

			<SideTable
				metrics={spec.side}
				labels={spec.labels ?? []}
				{regions}
				{own}
				{ref}
				refHead={refIsBerlin ? null : { name: refHeadName, sub: refHeadSub }}
				{unitPlural}
			/>
		</div>
	{/snippet}
	{#snippet table(visible)}
		<DataTable
			{visible}
			caption={m.skizze_chapter_caption({ title, own: own.name, ref: refName })}
			head={[m.skizze_table_value(), own.name, refName, m.skizze_table_berlin_median()]}
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
