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
	import { mostCommon, niceDomain, spread, zeroAwareMedian } from '../stats';
	import {
		LABEL_SPECS,
		METRIC_SPECS,
		formatMetric,
		formatMetricNumber,
		hintFor,
		metricLead,
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

	const values = (m: MetricId) => regions.map((r) => r.metrics[m]);
	const lead = $derived(
		metricLead(
			spec.main[0],
			own.name,
			own.metrics[spec.main[0]],
			values(spec.main[0]),
			unitPlural,
			refIsBerlin ? null : { name: refName, value: ref.metrics[spec.main[0]] }
		)
	);
	// Achse über alle gezeigten Werte, auch die Kieze der Spanne (sonst fallen Punkte heraus).
	const domainOf = (m: MetricId) => {
		const xs = [...values(m), ...kieze.map((k) => k.metrics[m])];
		const max = Math.max(...xs.filter((v): v is number => v !== null));
		const step = max > 1000 ? 1000 : max > 100 ? 10 : max > 20 ? 5 : 1;
		return niceDomain(xs, step);
	};
	const items = (rs: readonly RegionSnapshot[], m: MetricId) =>
		rs.map((r) => ({ slug: r.slug, name: r.name, value: r.metrics[m] }));
	const allSide = $derived([...spec.main, ...spec.side]);
	const hintOf = (m: MetricId) =>
		hintFor(
			m,
			own.metrics[m],
			refIsBerlin ? zeroAwareMedian(values(m)).value : ref.metrics[m],
			refIsBerlin ? 'Berlin-Median' : refName
		);
	const leadHint = $derived(hintOf(spec.main[0]));
	// Textfassung für Screenreader und Tabellen-Ansicht: alle Werte, Klassen und die Kiez-Spanne.
	const tableRows = $derived([
		...allSide.map((m) => {
			const b = zeroAwareMedian(values(m));
			return [
				METRIC_SPECS[m].label,
				formatMetric(m, own.metrics[m]),
				formatMetric(m, ref.metrics[m]),
				`${formatMetric(m, b.value)}${b.zerosLeftOut > 0 ? ` (ohne ${b.zerosLeftOut} Nullwerte)` : ''}`
			];
		}),
		...(spec.labels ?? []).map((l) => [
			LABEL_SPECS[l].label,
			own.labels[l] ?? '–',
			ref.labels[l] ?? '–',
			`${mostCommon(regions.map((r) => r.labels[l])) ?? '–'} (häufigste Klasse)`
		]),
		...(kieze.length > 1
			? spec.main.flatMap((m) => {
					const s = spread(kieze, (k) => k.metrics[m]);
					return s
						? [
								[
									`${METRIC_SPECS[m].label}, Spanne der Kieze in ${own.name}`,
									`${formatMetric(m, s.min.metrics[m])} (${s.min.name}) bis ${formatMetric(m, s.max.metrics[m])} (${s.max.name})`,
									'',
									''
								]
							]
						: [];
				})
			: [])
	]);
</script>

<Section id={spec.id} title={spec.title} {mode}>
	{#snippet text()}
		<p>{lead}</p>
		{#if leadHint}<p><Hint hint={leadHint} /></p>{/if}
		<p class="text-sm">
			{METRIC_SPECS[spec.main[0]].what}. Quelle: {METRIC_SPECS[spec.main[0]].source}.
		</p>
		{#if mapHref}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<p><a class="text-accent underline" href={mapHref}>Auf der Karte ansehen</a></p>
		{/if}
	{/snippet}
	{#snippet chart()}
		<!-- Abstände: zwischen Grafiken im Kapitel 4rem, Bezirk und Kieze 2rem, Grafik zu Tabelle 3rem -->
		<div class="flex flex-col gap-12">
			<div class="flex flex-col gap-16">
				{#each spec.main as m (m)}
					<div class="flex flex-col gap-8">
						<div>
							<p
								class="flex items-baseline justify-between gap-3 border-b border-rule pb-1 text-sm font-semibold text-ink"
							>
								<span>{METRIC_SPECS[m].label}, {METRIC_SPECS[m].unit}</span>
								<!-- Richtung ohne Legende lesbar: links weniger, rechts mehr -->
								<span
									class="shrink-0 text-dense-label font-normal text-ink-subtle"
									aria-hidden="true">← {METRIC_SPECS[m].lower}&emsp;{METRIC_SPECS[m].higher} →</span
								>
							</p>
							<StripChart
								items={items(regions, m)}
								domain={domainOf(m)}
								format={(v) => formatMetric(m, v)}
								axisFormat={(v) => formatMetricNumber(m, v)}
								unit={METRIC_SPECS[m].unit}
								ownSlug={own.slug}
								{highlight}
								{highlightLabel}
								refSlug={refIsLine ? null : ref.slug}
								refLine={refIsLine ? { value: ref.metrics[m], label: refName } : null}
								medianLabel={`Median der ${regions.length} ${unitPlural}`}
								zeroName={METRIC_SPECS[m].zeroName}
								zeroMedianLabel={METRIC_SPECS[m].zeroMedianLabel}
								{unitPlural}
								ownHint={hintOf(m)}
								r={regions.length < 20 ? 6 : 2.9}
								{onpick}
							/>
						</div>
						{#if kieze.length > 1}
							{@const s = spread(kieze, (k) => k.metrics[m])}
							{#if s}
								<div>
									<p class="text-sm text-ink">
										Die {kieze.length} Kieze in {own.name}: von {formatMetric(m, s.min.metrics[m])} in
										{s.min.name} bis {formatMetric(m, s.max.metrics[m])} in {s.max.name}.
									</p>
									<StripChart
										items={items(kieze, m)}
										domain={domainOf(m)}
										format={(v) => formatMetric(m, v)}
										axisFormat={(v) => formatMetricNumber(m, v)}
										unit={METRIC_SPECS[m].unit}
										ownSlug={null}
										highlight={new Set([s.min.slug, s.max.slug])}
										highlightLabel={`${s.min.name} und ${s.max.name}`}
										refSlug={null}
										refLine={{ value: own.metrics[m], label: `${own.name} gesamt` }}
										medianLabel={`Median der Kieze in ${own.name}`}
										unitPlural="Kieze"
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
			caption="{spec.title}: {own.name}, {refName} und Berlin (Median, bei Klassen die häufigste Klasse)"
			head={['Wert', own.name, refName, 'Berlin, Median']}
			rows={tableRows}
		/>
	{/snippet}
	{#snippet sources()}
		<ul class="flex flex-col gap-1">
			{#each allSide as m (m)}
				<li>{METRIC_SPECS[m].label}: {METRIC_SPECS[m].source}</li>
			{/each}
		</ul>
	{/snippet}
</Section>
