<!--
	„Weitere Werte“ eines Kapitels, gemeinsame Tabelle beider Seiten.
	Kopf zweizeilig: Name, darunter klein die Art des Werts. Einheit einmal in der Zeile,
	Zellen nur Zahlen (Plex Mono, rechtsbündig, feste Breite, damit die Spalten zwischen den
	Kapiteln fluchten). Mobil gestapelt statt gequetscht. Große Nullstapel lässt der Median aus.
-->
<script lang="ts">
	import { mostCommon, zeroAwareMedian } from '../stats';
	import {
		LABEL_SPECS,
		METRIC_SPECS,
		formatMetricValue,
		type LabelId,
		type MetricId
	} from '../topics';
	import type { ReferenceProfile, RegionSnapshot } from '../types';

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

	interface Row {
		key: string;
		label: string;
		unit: string;
		what: string;
		own: string;
		ref: string;
		berlin: string;
	}
	const rows = $derived<Row[]>([
		...metrics.map((m) => {
			const b = zeroAwareMedian(regions.map((r) => r.metrics[m]));
			return {
				key: m,
				label: METRIC_SPECS[m].label,
				unit: METRIC_SPECS[m].unit,
				what: METRIC_SPECS[m].what,
				own: formatMetricValue(m, own.metrics[m]),
				ref: formatMetricValue(m, ref.metrics[m]),
				berlin: `${formatMetricValue(m, b.value)}${b.zerosLeftOut > 0 ? '*' : ''}`
			};
		}),
		...labels.map((l) => ({
			key: l,
			label: LABEL_SPECS[l].label,
			unit: 'Klasse',
			what: LABEL_SPECS[l].what,
			own: own.labels[l] ?? '–',
			ref: ref.labels[l] ?? '–',
			berlin: `${mostCommon(regions.map((r) => r.labels[l])) ?? '–'}†`
		}))
	]);
	const zeroNotes = $derived(
		metrics
			.map((m) => ({ m, z: zeroAwareMedian(regions.map((r) => r.metrics[m])).zerosLeftOut }))
			.filter((e) => e.z > 0)
			.map(
				(e) =>
					`* ${METRIC_SPECS[e.m].label}: Median ohne die ${e.z} ${unitPlural} ${METRIC_SPECS[e.m].zeroName ?? 'mit Wert 0'}.`
			)
	);
	const berlinSub = $derived(`Median der ${regions.length} ${unitPlural}`);
</script>

<!-- Ab sm: Tabelle mit festen Zahlenspalten -->
<table
	class="hidden w-full table-fixed border-collapse text-left [overflow-wrap:break-word] sm:table"
>
	<caption class="mb-2 text-left text-sm font-semibold text-ink">Weitere Werte</caption>
	<colgroup>
		<col />
		<col class="w-32" />
		{#if refHead}<col class="w-32" />{/if}
		<col class="w-32" />
	</colgroup>
	<thead>
		<tr class="border-b border-rule align-bottom">
			<th scope="col" class="pb-1.5"><span class="sr-only">Wert</span></th>
			<th scope="col" class="pb-1.5 pl-3 text-right text-sm font-semibold text-accent">
				{own.name.replaceAll('/', '/\u200b')}<span
					class="block text-dense-label font-normal text-ink-subtle">dieser Ort</span
				>
			</th>
			{#if refHead}
				<th scope="col" class="pb-1.5 pl-3 text-right text-sm font-normal text-ink">
					{refHead.name}<span class="block text-dense-label text-ink-subtle">{refHead.sub}</span>
				</th>
			{/if}
			<th scope="col" class="pb-1.5 pl-3 text-right text-sm font-normal text-ink">
				Berlin<span class="block text-dense-label text-ink-subtle">{berlinSub}</span>
			</th>
		</tr>
	</thead>
	<tbody>
		{#each rows as r (r.key)}
			<tr class="border-b border-rule align-top">
				<th scope="row" class="py-2 pr-2 text-left text-sm font-normal text-ink">
					{r.label}<span class="font-mono text-dense-label text-ink-subtle">, {r.unit}</span>
					<span class="block text-dense-label text-ink-subtle">{r.what}</span>
				</th>
				<td
					class="py-2 pl-3 text-right font-mono text-sm whitespace-nowrap text-accent tabular-nums"
					>{r.own}</td
				>
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

<!-- Mobil: Zeile gestapelt, Werte darunter in gleich breiten Spalten -->
<div class="sm:hidden">
	<p class="mb-2 text-sm font-semibold text-ink">Weitere Werte</p>
	<ul class="flex flex-col">
		{#each rows as r (r.key)}
			<li class="border-b border-rule py-2">
				<p class="text-sm text-ink">
					{r.label}<span class="font-mono text-dense-label text-ink-subtle">, {r.unit}</span>
				</p>
				<p class="text-dense-label text-ink-subtle">{r.what}</p>
				<dl class="mt-1.5 grid {refHead ? 'grid-cols-3' : 'grid-cols-2'} gap-2">
					<div>
						<dt class="truncate text-dense-label text-accent">{own.name}</dt>
						<dd class="font-mono text-sm text-accent tabular-nums">{r.own}</dd>
					</div>
					{#if refHead}
						<div>
							<dt class="truncate text-dense-label text-ink-subtle">{refHead.name}</dt>
							<dd class="font-mono text-sm tabular-nums">{r.ref}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-dense-label text-ink-subtle">Berlin</dt>
						<dd class="font-mono text-sm text-ink-muted tabular-nums">{r.berlin}</dd>
					</div>
				</dl>
			</li>
		{/each}
	</ul>
</div>
<div class="mt-1.5 flex flex-col gap-0.5 text-dense-label text-ink-subtle">
	<p>Berlin: Median der {regions.length} {unitPlural}. † Bei Klassen die häufigste Klasse.</p>
	{#each zeroNotes as n (n)}<p>{n}</p>{/each}
</div>
