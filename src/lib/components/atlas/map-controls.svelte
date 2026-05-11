<script lang="ts">
	import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Minus, Plus } from '@lucide/svelte';

	export type PanDirection = 'north' | 'east' | 'south' | 'west';

	type Props = {
		onPan?: (direction: PanDirection) => void;
		onZoom?: (delta: 1 | -1) => void;
	};

	let { onPan, onZoom }: Props = $props();

	const btnBase =
		'flex items-center justify-center border border-rule bg-bg/85 backdrop-blur-sm text-ink hover:bg-bg-elevated';
	const btnSize = 'min-width:44px;min-height:44px;width:44px;height:44px';
</script>

<div
	role="group"
	aria-label="Karten-Steuerung"
	class="absolute right-3 top-3 flex flex-col gap-1"
>
	<div class="grid grid-cols-3 grid-rows-3 place-items-center gap-px">
		<div></div>
		<button
			type="button"
			aria-label="Karte nach Norden verschieben"
			style={btnSize}
			class={btnBase}
			onclick={() => onPan?.('north')}
		>
			<ArrowUp aria-hidden="true" size={16} />
		</button>
		<div></div>
		<button
			type="button"
			aria-label="Karte nach Westen verschieben"
			style={btnSize}
			class={btnBase}
			onclick={() => onPan?.('west')}
		>
			<ArrowLeft aria-hidden="true" size={16} />
		</button>
		<div></div>
		<button
			type="button"
			aria-label="Karte nach Osten verschieben"
			style={btnSize}
			class={btnBase}
			onclick={() => onPan?.('east')}
		>
			<ArrowRight aria-hidden="true" size={16} />
		</button>
		<div></div>
		<button
			type="button"
			aria-label="Karte nach Sueden verschieben"
			style={btnSize}
			class={btnBase}
			onclick={() => onPan?.('south')}
		>
			<ArrowDown aria-hidden="true" size={16} />
		</button>
		<div></div>
	</div>
	<div class="flex flex-col items-center gap-px">
		<button
			type="button"
			aria-label="Hineinzoomen"
			style={btnSize}
			class={btnBase}
			onclick={() => onZoom?.(1)}
		>
			<Plus aria-hidden="true" size={16} />
		</button>
		<button
			type="button"
			aria-label="Herauszoomen"
			style={btnSize}
			class={btnBase}
			onclick={() => onZoom?.(-1)}
		>
			<Minus aria-hidden="true" size={16} />
		</button>
	</div>
</div>
