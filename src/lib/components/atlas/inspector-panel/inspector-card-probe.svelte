<script lang="ts">
	import InspectorCard from './inspector-card.svelte';

	type Props = { defaultExpanded?: boolean };
	let { defaultExpanded = false }: Props = $props();
</script>

<InspectorCard title="Test-Card" {defaultExpanded}>
	{#snippet summary()}
		<p data-testid="probe-summary">Summary-Visual</p>
	{/snippet}
	{#snippet detail()}
		<p data-testid="probe-detail">Detail-Inhalt</p>
	{/snippet}
</InspectorCard>
