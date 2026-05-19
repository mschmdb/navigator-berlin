<script lang="ts">
	type Props = {
		visible: boolean;
		width?: number;
		tooltip?: string;
		testid?: string;
	};

	let {
		visible,
		width = 6,
		tooltip = 'Unsicherheits-Zone: Stimmbezirks-Werte ohne Briefstimmen',
		testid = 'wahl-confidence-hairline'
	}: Props = $props();
</script>

{#if visible}
	<span
		aria-hidden="true"
		class="absolute top-0 right-0 h-full pointer-events-none"
		style:width={`${width}px`}
		style:background-image="repeating-linear-gradient(45deg, rgba(20,20,20,0.45) 0 2px, transparent 2px 4px)"
		title={tooltip}
		data-testid={testid}
	></span>
{/if}
