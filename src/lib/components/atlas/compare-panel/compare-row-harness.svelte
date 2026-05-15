<script lang="ts">
	import type { LayerHit } from '$lib/data';
	import CompareRow from './compare-row.svelte';

	type Props = {
		slug: string;
		layerName: string;
		hitA: LayerHit | null;
		hitB: LayerHit | null;
	};

	let { slug, layerName, hitA, hitB }: Props = $props();
</script>

<table>
	<tbody>
		<CompareRow {slug} {layerName} {hitA} {hitB} />
	</tbody>
</table>
