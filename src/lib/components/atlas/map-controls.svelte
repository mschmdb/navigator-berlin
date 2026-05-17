<script lang="ts">
	import {
		ArrowDown,
		ArrowLeft,
		ArrowRight,
		ArrowUp,
		Compass,
		LocateFixed,
		Minus,
		Plus
	} from '@lucide/svelte';

	export type PanDirection = 'north' | 'east' | 'south' | 'west';

	type Props = {
		onPan?: (direction: PanDirection) => void;
		onZoom?: (delta: 1 | -1) => void;
		onLocate?: () => void;
		/** Optional state-flag wenn Geolocation gerade lädt. */
		locating?: boolean;
	};

	let { onPan, onZoom, onLocate, locating = false }: Props = $props();
	let popoutOpen = $state(false);

	function togglePopout(): void {
		popoutOpen = !popoutOpen;
	}

	function closePopout(): void {
		popoutOpen = false;
	}

	const panBase =
		'flex items-center justify-center rounded-sm border border-rule bg-bg/95 backdrop-blur-sm text-ink-muted hover:bg-bg-elevated hover:text-ink';
	const panSize = 'min-width:44px;min-height:44px;width:44px;height:44px';
	const compactBase =
		'flex items-center justify-center rounded-sm bg-bg/85 backdrop-blur-sm text-ink-muted hover:bg-bg-elevated hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus';
	const compactSize = 'min-width:32px;min-height:32px;width:32px;height:32px';
</script>

<div
	role="group"
	aria-label="Karten-Steuerung"
	class="absolute right-3 top-3 flex flex-col items-end gap-2"
>
	<div class="relative">
		<button
			type="button"
			aria-label="Karten-Pan-Steuerung öffnen"
			aria-expanded={popoutOpen}
			aria-haspopup="menu"
			data-testid="compass-trigger"
			style={compactSize}
			class={compactBase}
			onclick={togglePopout}
		>
			<Compass aria-hidden="true" size={16} />
		</button>
		{#if popoutOpen}
			<div
				role="menu"
				data-testid="compass-popout"
				style="width:148px;height:148px"
				class="absolute right-9 top-0 z-20 rounded-md border border-rule bg-bg-elevated/95 backdrop-blur-sm"
			>
				<button
					type="button"
					role="menuitem"
					aria-label="Karte nach Norden verschieben"
					style="position:absolute;top:4px;left:50%;transform:translateX(-50%);{panSize}"
					class={panBase}
					onclick={() => onPan?.('north')}
				>
					<ArrowUp aria-hidden="true" size={16} />
				</button>
				<button
					type="button"
					role="menuitem"
					aria-label="Karte nach Westen verschieben"
					style="position:absolute;top:50%;left:4px;transform:translateY(-50%);{panSize}"
					class={panBase}
					onclick={() => onPan?.('west')}
				>
					<ArrowLeft aria-hidden="true" size={16} />
				</button>
				<button
					type="button"
					role="menuitem"
					aria-label="Karte nach Osten verschieben"
					style="position:absolute;top:50%;right:4px;transform:translateY(-50%);{panSize}"
					class={panBase}
					onclick={() => onPan?.('east')}
				>
					<ArrowRight aria-hidden="true" size={16} />
				</button>
				<button
					type="button"
					role="menuitem"
					aria-label="Karte nach Sueden verschieben"
					style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);{panSize}"
					class={panBase}
					onclick={() => onPan?.('south')}
				>
					<ArrowDown aria-hidden="true" size={16} />
				</button>
			</div>
		{/if}
	</div>
	<div class="flex flex-col gap-1">
		<button
			type="button"
			aria-label="Hineinzoomen"
			style={compactSize}
			class={compactBase}
			onclick={() => onZoom?.(1)}
		>
			<Plus aria-hidden="true" size={16} />
		</button>
		<button
			type="button"
			aria-label="Herauszoomen"
			style={compactSize}
			class={compactBase}
			onclick={() => onZoom?.(-1)}
		>
			<Minus aria-hidden="true" size={16} />
		</button>
	</div>
	{#if onLocate}
		<button
			type="button"
			data-testid="map-locate-trigger"
			aria-label="Mein Standort"
			aria-busy={locating}
			disabled={locating}
			style={compactSize}
			class="{compactBase} disabled:opacity-50"
			onclick={onLocate}
		>
			<LocateFixed aria-hidden="true" size={16} />
		</button>
	{/if}
</div>
