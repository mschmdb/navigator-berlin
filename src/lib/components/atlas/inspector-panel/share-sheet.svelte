<script lang="ts" module>
	const FEEDBACK_RESET_MS = 1800;
</script>

<script lang="ts">
	import { Check, Link2, Printer, Share2, Sparkles, X } from '@lucide/svelte';
	import { approximateTokens } from '$lib/utils/llm-export-builder.js';
	import { canNativeShare, nativeShare } from '$lib/utils/native-share.js';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';
	import { formatCount, formatDecimal } from '$lib/i18n/format.js';

	type FeedbackState = 'idle' | 'done';
	type Variant = 'popover' | 'sheet';

	type Props = {
		open: boolean;
		onClose: () => void;
		permalinkUrl: string;
		llmExportText: string;
		ogImageUrl: string | null;
		addressName: string;
		variant?: Variant;
		nativeShareData?: ShareData;
		lang?: Locale;
	};

	let {
		open,
		onClose,
		permalinkUrl,
		llmExportText,
		ogImageUrl,
		addressName,
		variant = 'popover',
		nativeShareData,
		lang
	}: Props = $props();

	const locale = $derived(lang ?? getLocale());
	const localeOpts = $derived({ locale });

	let linkState = $state<FeedbackState>('idle');
	let llmState = $state<FeedbackState>('idle');
	let liveText = $state('');
	let sheetEl: HTMLElement | undefined = $state();
	let linkTimer: ReturnType<typeof setTimeout> | null = null;
	let llmTimer: ReturnType<typeof setTimeout> | null = null;
	// Phase-1: /api/og/share liefert 503 (Stub), bis Native-Pipeline aktiv ist.
	// Vermeidet broken-image-Icon im UI.
	let imgFailed = $state(false);

	const tokenCount = $derived(approximateTokens(llmExportText));
	// Grössenordnungs-Angabe ("≈ 2,3k Tokens" / "≈ 2.3k tokens"), keine exakte
	// Zahl -- `formatDecimal` ersetzt den vormals fest verdrahteten
	// `.replace('.', ',')`-Hack (i18n Block B3b).
	function formatTokensApprox(count: number): string {
		if (count >= 1000) {
			// `minimumFractionDigits: 1` erzwingt (wie vormals `.toFixed(1)`)
			// immer eine Nachkommastelle, z. B. "2,0k" statt "2k" (Review-Fund).
			const k = formatDecimal(count / 1000, {
				...localeOpts,
				maximumFractionDigits: 1,
				minimumFractionDigits: 1
			});
			return `${k}k`;
		}
		return formatCount(count, localeOpts);
	}
	const tokenLabel = $derived(
		m.inspector_share_tokens_approx({ count: formatTokensApprox(tokenCount) }, localeOpts)
	);
	const nativeSupported = $derived(canNativeShare(nativeShareData));

	function resetLink(): void {
		linkState = 'idle';
		liveText = '';
		linkTimer = null;
	}

	function resetLlm(): void {
		llmState = 'idle';
		liveText = '';
		llmTimer = null;
	}

	async function copyPermalink(): Promise<void> {
		if (typeof navigator === 'undefined' || !navigator.clipboard) return;
		try {
			await navigator.clipboard.writeText(permalinkUrl);
		} catch {
			return;
		}
		linkState = 'done';
		liveText = m.inspector_share_live_link_copied(undefined, localeOpts);
		if (linkTimer) clearTimeout(linkTimer);
		linkTimer = setTimeout(resetLink, FEEDBACK_RESET_MS);
	}

	async function copyLlm(): Promise<void> {
		if (typeof navigator === 'undefined' || !navigator.clipboard) return;
		try {
			await navigator.clipboard.writeText(llmExportText);
		} catch {
			return;
		}
		llmState = 'done';
		liveText = m.inspector_share_live_llm_copied({ tokens: tokenLabel }, localeOpts);
		if (llmTimer) clearTimeout(llmTimer);
		llmTimer = setTimeout(resetLlm, FEEDBACK_RESET_MS);
	}

	function doPrint(): void {
		if (typeof window === 'undefined') return;
		onClose();
		// Close sheet before printing so it doesn't overlay the printed inspector.
		setTimeout(() => window.print(), 50);
	}

	async function doNativeShare(): Promise<void> {
		const data = nativeShareData ?? { url: permalinkUrl, title: addressName };
		await nativeShare(data);
	}

	function focusableElements(root: HTMLElement): HTMLElement[] {
		return Array.from(
			root.querySelectorAll<HTMLElement>(
				'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => el.offsetParent !== null || el === document.activeElement);
	}

	function onKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
			return;
		}
		if (e.key !== 'Tab' || !sheetEl) return;
		const items = focusableElements(sheetEl);
		if (items.length === 0) return;
		const first = items[0]!;
		const last = items[items.length - 1]!;
		const active = document.activeElement;
		if (e.shiftKey && active === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	}

	function onDocumentPointer(e: PointerEvent): void {
		if (!open || !sheetEl) return;
		if (e.target instanceof Node && !sheetEl.contains(e.target)) onClose();
	}

	$effect(() => {
		if (!open || !sheetEl) return;
		const items = focusableElements(sheetEl);
		items[0]?.focus();
	});

	$effect(() => {
		if (!open) return;
		const handler = (e: PointerEvent): void => onDocumentPointer(e);
		const raf = requestAnimationFrame(() => {
			document.addEventListener('pointerdown', handler, true);
		});
		return () => {
			cancelAnimationFrame(raf);
			document.removeEventListener('pointerdown', handler, true);
		};
	});

	$effect(() => {
		return () => {
			if (linkTimer) clearTimeout(linkTimer);
			if (llmTimer) clearTimeout(llmTimer);
		};
	});

	const sheetClass = $derived(
		variant === 'sheet'
			? 'fixed inset-x-2 bottom-2 z-50 max-h-[80vh] overflow-auto rounded-lg border border-rule-strong bg-bg-elevated shadow-xl'
			: 'fixed right-4 bottom-4 z-50 w-80 max-w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-rule-strong bg-bg-elevated shadow-xl'
	);
</script>

{#if open}
	<div
		bind:this={sheetEl}
		role="dialog"
		aria-modal="true"
		aria-labelledby="share-sheet-title"
		data-testid="share-sheet"
		data-variant={variant}
		class={sheetClass}
		tabindex="-1"
		onkeydown={onKeydown}
	>
		<header class="flex items-center justify-between gap-2 border-b border-rule px-4 py-3">
			<h2 id="share-sheet-title" class="font-mono text-xs tracking-wide text-ink-muted uppercase">
				{m.inspector_share_title(undefined, localeOpts)}
			</h2>
			<button
				type="button"
				onclick={onClose}
				aria-label={m.inspector_share_close_aria(undefined, localeOpts)}
				data-testid="share-sheet-close"
				class="rounded-sm p-1 text-ink-muted hover:text-ink"
			>
				<X size={16} aria-hidden="true" />
			</button>
		</header>

		{#if ogImageUrl && !imgFailed}
			<div class="px-4 pt-3">
				<img
					src={ogImageUrl}
					alt={m.inspector_share_preview_aria({ address: addressName }, localeOpts)}
					loading="lazy"
					data-testid="share-og-preview"
					class="block w-full rounded border border-rule shadow-sm"
					width="320"
					height="168"
					onerror={() => (imgFailed = true)}
				/>
			</div>
		{/if}

		<ul class="flex flex-col gap-1 p-2">
			<li>
				<button
					type="button"
					onclick={copyPermalink}
					data-testid="share-option-permalink"
					class="flex min-h-10 w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-rule/30"
				>
					{#if linkState === 'done'}
						<Check size={18} aria-hidden="true" class="text-state-success" />
						<span class="font-mono">{m.inspector_share_permalink_done(undefined, localeOpts)}</span>
					{:else}
						<Link2 size={18} aria-hidden="true" />
						<span class="font-mono">{m.inspector_share_permalink_idle(undefined, localeOpts)}</span>
					{/if}
				</button>
			</li>
			<li>
				<button
					type="button"
					onclick={copyLlm}
					data-testid="share-option-llm"
					class="flex min-h-10 w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-rule/30"
				>
					{#if llmState === 'done'}
						<Check size={18} aria-hidden="true" class="text-state-success" />
						<span class="font-mono">{m.inspector_share_llm_done(undefined, localeOpts)}</span>
					{:else}
						<Sparkles size={18} aria-hidden="true" />
						<span class="font-mono">{m.inspector_share_llm_idle(undefined, localeOpts)}</span>
					{/if}
					<span
						data-testid="share-option-llm-tokens"
						class="ms-auto font-mono text-xs text-ink-subtle"
					>
						{tokenLabel}
					</span>
				</button>
			</li>
			<li>
				<button
					type="button"
					onclick={doPrint}
					data-testid="share-option-print"
					class="flex min-h-10 w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-rule/30"
				>
					<Printer size={18} aria-hidden="true" />
					<span class="font-mono">{m.inspector_share_print(undefined, localeOpts)}</span>
				</button>
			</li>
			{#if nativeSupported}
				<li>
					<button
						type="button"
						onclick={doNativeShare}
						data-testid="share-option-native"
						class="flex min-h-10 w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-rule/30"
					>
						<Share2 size={18} aria-hidden="true" />
						<span class="font-mono">{m.inspector_share_native(undefined, localeOpts)}</span>
					</button>
				</li>
			{/if}
		</ul>

		<div data-testid="share-sheet-live" aria-live="polite" aria-atomic="true" class="sr-only">
			{liveText}
		</div>
	</div>
{/if}
