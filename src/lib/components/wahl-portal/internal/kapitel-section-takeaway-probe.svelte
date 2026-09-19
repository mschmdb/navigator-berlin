<script lang="ts">
	import KapitelSection from '../kapitel-section.svelte';
</script>

<KapitelSection id="probe" title="Probe" testid="probe-section">
	{#snippet takeaway()}
		Kurzsatz
	{/snippet}
	<p data-testid="probe-section-body">Inhalt</p>
</KapitelSection>
