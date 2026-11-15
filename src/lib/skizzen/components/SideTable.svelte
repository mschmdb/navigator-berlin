<!--
	„Weitere Werte“ eines Kapitels. Spalten: eigener Ort, gewählter Vergleich, Berlin.
	Berlin heißt Median, bei Kategorien die häufigste Klasse. Große Nullstapel lässt der Median
	aus und sagt das in einer Fußnote (Milieuschutz).
-->
<script lang="ts">
	import { mostCommon, zeroAwareMedian } from '../stats';
	import { LABEL_SPECS, METRIC_SPECS, formatMetric, type LabelId, type MetricId } from '../topics';
	import type { ReferenceProfile, RegionSnapshot } from '../types';

	interface Props {
		metrics: readonly MetricId[];
		labels: readonly LabelId[];
		regions: readonly RegionSnapshot[];
		own: RegionSnapshot;
		ref: ReferenceProfile;
		refName: string;
		refIsBerlin: boolean;
		unitPlural: string;
	}
	let { metrics, labels, regions, own, ref, refName, refIsBerlin, unitPlural }: Props = $props();

	const berlinOf = (m: MetricId) => zeroAwareMedian(regions.map((r) => r.metrics[m]));
	const footnotes = $derived(
		metrics
			.map((m) => ({ m, z: berlinOf(m).zerosLeftOut }))
			.filter((e) => e.z > 0)
			.map(
				(e) =>
					`${METRIC_SPECS[e.m].label}: Median ohne die ${e.z} ${unitPlural} ${METRIC_SPECS[e.m].zeroName ?? 'mit Wert 0'}.`
			)
	);
	const berlinMetric = (m: MetricId) => {
		const b = berlinOf(m);
		return `${formatMetric(m, b.value)}${b.zerosLeftOut > 0 ? '*' : ''}`;
	};
	const berlinLabel = (l: LabelId) => {
		const c = mostCommon(regions.map((r) => r.labels[l]));
		return c ? `${c} (häufigste)` : '–';
	};
	const berlinHead = $derived(
		`Berlin (Median bzw. häufigste Klasse, ${regions.length} ${unitPlural})`
	);
</script>

<table class="w-full border-collapse text-left text-dense-value tabular-nums">
	<caption class="mb-1 text-left text-sm font-semibold text-ink">Weitere Werte</caption>
	<thead>
		<tr class="border-b border-rule-strong align-bottom text-dense-label text-ink-subtle">
			<th scope="col" class="py-1 pr-2 font-normal">Wert</th>
			<th scope="col" class="py-1 pr-2 text-right font-normal">{own.name}</th>
			{#if !refIsBerlin}
				<th scope="col" class="py-1 pr-2 text-right font-normal">{refName}</th>
			{/if}
			<th scope="col" class="max-w-32 py-1 text-right font-normal">{berlinHead}</th>
		</tr>
	</thead>
	<tbody>
		{#each metrics as m (m)}
			<tr class="border-b border-rule">
				<th scope="row" class="py-1.5 pr-2 font-normal text-ink">
					{METRIC_SPECS[m].label}
					<span class="block text-dense-label text-ink-subtle">{METRIC_SPECS[m].what}</span>
				</th>
				<td class="py-1.5 pr-2 text-right font-semibold text-accent"
					>{formatMetric(m, own.metrics[m])}</td
				>
				{#if !refIsBerlin}
					<td class="py-1.5 pr-2 text-right">{formatMetric(m, ref.metrics[m])}</td>
				{/if}
				<td class="py-1.5 text-right text-ink-muted">{berlinMetric(m)}</td>
			</tr>
		{/each}
		{#each labels as l (l)}
			<tr class="border-b border-rule">
				<th scope="row" class="py-1.5 pr-2 font-normal text-ink">
					{LABEL_SPECS[l].label}
					<span class="block text-dense-label text-ink-subtle">{LABEL_SPECS[l].what}</span>
				</th>
				<td class="py-1.5 pr-2 text-right font-semibold text-accent">{own.labels[l] ?? '–'}</td>
				{#if !refIsBerlin}
					<td class="py-1.5 pr-2 text-right">{ref.labels[l] ?? '–'}</td>
				{/if}
				<td class="py-1.5 text-right text-ink-muted">{berlinLabel(l)}</td>
			</tr>
		{/each}
	</tbody>
</table>
{#each footnotes as f (f)}
	<p class="mt-1 text-dense-label text-ink-subtle">* {f}</p>
{/each}
