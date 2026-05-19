<script lang="ts">
	import { Info } from '@lucide/svelte';

	type Props = {
		showBadge: boolean;
		tooltip?: string;
		methodikHref?: string;
		label?: string;
		testid?: string;
	};

	let {
		showBadge,
		tooltip = 'Stimmbezirks-Werte ohne Briefstimmen. Briefwähler nur als Bezirks-Aggregat.',
		methodikHref = '/methodik/wahldaten#wahldaten-briefwahl',
		label = 'Ohne Briefstimmen',
		testid = 'briefwahl-marker'
	}: Props = $props();

	const tooltipId = $derived(`briefwahl-marker-tip-${Math.random().toString(36).slice(2, 8)}`);
	let tooltipVisible = $state(false);

	function onFocus(): void {
		tooltipVisible = true;
	}
	function onBlur(): void {
		tooltipVisible = false;
	}
	function onMouseEnter(): void {
		tooltipVisible = true;
	}
	function onMouseLeave(): void {
		tooltipVisible = false;
	}
	function onKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') tooltipVisible = false;
	}
</script>

{#if showBadge}
	<span class="inline-flex items-baseline gap-1" data-testid={testid}>
		<a
			href={methodikHref}
			aria-describedby={tooltipId}
			onfocus={onFocus}
			onblur={onBlur}
			onmouseenter={onMouseEnter}
			onmouseleave={onMouseLeave}
			onkeydown={onKeydown}
			class="inline-flex items-baseline gap-1 font-mono text-[10px] uppercase tracking-wide text-ink border border-rule rounded-sm px-1.5 py-0.5 hover:bg-bg-muted focus:outline-none focus:ring-2 focus:ring-accent"
			data-testid={`${testid}-trigger`}
		>
			<Info aria-hidden="true" class="h-3 w-3 self-center" />
			<span>{label}</span>
		</a>
		<span
			role="tooltip"
			id={tooltipId}
			data-testid={`${testid}-tooltip`}
			class="font-serif italic text-[10px] text-ink-muted"
			class:sr-only={!tooltipVisible}
		>
			{tooltip}
		</span>
	</span>
{/if}
