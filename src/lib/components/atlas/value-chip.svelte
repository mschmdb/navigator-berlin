<script lang="ts">
	import type { Component } from 'svelte';
	import type { SeverityLevel } from './inspector-panel/internal/value-severity-mapping.js';

	type Props = {
		severity: SeverityLevel;
		value: string | number;
		unit?: string;
		layerName: string;
		numeric?: boolean;
		icon?: Component<{ size?: number | string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
	};

	let { severity, value, unit, layerName, numeric, icon: IconCmp }: Props = $props();

	const SEVERITY_DESCRIPTIONS: Record<SeverityLevel, string> = {
		success: 'günstige Belastung',
		'success-soft': 'leicht günstige Belastung',
		neutral: 'neutrale Einstufung',
		warning: 'erhöhte Belastung',
		danger: 'hohe kritische Belastung'
	};

	const SEVERITY_CLASSES: Record<SeverityLevel, string> = {
		success: 'bg-severity-success-bg text-severity-success',
		'success-soft': 'bg-severity-success-soft-bg text-severity-success-soft',
		neutral: 'bg-severity-neutral-bg text-severity-neutral',
		warning: 'bg-severity-warning-bg text-severity-warning',
		danger: 'bg-severity-danger-bg text-severity-danger'
	};

	const isNumeric = $derived(numeric ?? typeof value === 'number');
	const description = $derived(SEVERITY_DESCRIPTIONS[severity]);
	const ariaLabel = $derived(`${layerName}: ${value}${unit ? ' ' + unit : ''} (${description})`);
</script>

<span
	role="status"
	data-testid="value-chip"
	data-severity={severity}
	aria-label={ariaLabel}
	class={[
		'inline-flex min-h-8 items-center gap-1.5 rounded-sm px-2 py-1 font-sans text-sm font-semibold',
		SEVERITY_CLASSES[severity]
	].join(' ')}
>
	{#if IconCmp}
		<span data-testid="value-chip-icon" class="inline-flex shrink-0 items-center" aria-hidden="true">
			<IconCmp size={14} aria-hidden="true" />
		</span>
	{/if}
	<span
		data-testid="value-chip-value"
		class={['leading-none', isNumeric && 'font-mono tabular-nums'].filter(Boolean).join(' ')}
	>
		{value}{#if unit}
			<span class="ml-1 font-mono text-xs">{unit}</span>
		{/if}
	</span>
</span>
