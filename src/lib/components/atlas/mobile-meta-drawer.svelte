<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { X } from '@lucide/svelte';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import { META_LINK_GROUPS } from './internal/meta-links.js';
	import SocialLinks from './internal/social-links.svelte';
	import MtcLogo from './internal/mtc-logo.svelte';

	type Props = {
		open: boolean;
		onClose: () => void;
		langSwitcher?: Snippet;
	};

	let { open, onClose, langSwitcher }: Props = $props();
	let drawerEl: HTMLElement | null = $state(null);
	let prevActive: Element | null = null;

	$effect(() => {
		if (!open) return;
		prevActive = typeof document !== 'undefined' ? document.activeElement : null;
		queueMicrotask(() => {
			const firstLink = drawerEl?.querySelector('a, button') as HTMLElement | null;
			firstLink?.focus();
		});
	});

	onMount(() => {
		function onKey(e: KeyboardEvent): void {
			if (e.key === 'Escape' && open) {
				e.preventDefault();
				onClose();
				if (prevActive instanceof HTMLElement) prevActive.focus();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#if open}
	<div
		role="presentation"
		data-testid="mobile-meta-drawer-backdrop"
		class="fixed inset-0 z-50 bg-black/40"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={() => {}}
	>
		<div
			bind:this={drawerEl}
			role="dialog"
			aria-modal="true"
			aria-label="Menü"
			data-testid="mobile-meta-drawer"
			class="fixed inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col border-l border-rule-strong bg-bg-elevated"
		>
			<header class="flex shrink-0 items-center justify-between border-b border-rule px-5 py-4">
				<h2 class="font-serif text-lg text-ink">Menü</h2>
				<button
					type="button"
					data-testid="mobile-meta-drawer-close"
					onclick={onClose}
					aria-label="Menü schließen"
					class="rounded-sm p-1 text-ink-muted hover:text-ink"
				>
					<X size={20} aria-hidden="true" />
				</button>
			</header>

			<nav aria-label="Meta-Navigation" class="flex-1 overflow-y-auto px-5 py-5">
				<div class="flex flex-col gap-6">
					{#each META_LINK_GROUPS as group (group.title)}
						<div class="flex flex-col gap-2">
							<h3 class="font-mono text-[10px] tracking-wider text-ink-subtle uppercase">
								{group.title}
							</h3>
							<ul class="flex flex-col">
								{#each group.links as link (link.href)}
									<li>
										<a
											href={link.href}
											onclick={onClose}
											class="block py-2 font-serif text-sm text-ink hover:text-accent"
										>
											{link.label}
										</a>
									</li>
								{/each}
								{#if group.title === 'Sonstiges'}
									<li>
										<a
											href={`mailto:${FEEDBACK_EMAIL}`}
											onclick={onClose}
											class="block py-2 font-serif text-sm text-ink hover:text-accent"
										>
											Kontakt
										</a>
									</li>
								{/if}
							</ul>
						</div>
					{/each}
				</div>
			</nav>

			<footer class="flex shrink-0 items-center justify-end border-t border-rule px-5 py-4">
				{#if langSwitcher}
					<div class="mr-auto font-mono text-xs text-ink-subtle">
						{@render langSwitcher()}
					</div>
				{/if}
				<div class="flex items-center gap-3">
					<SocialLinks size={16} />
					<MtcLogo />
				</div>
			</footer>
		</div>
	</div>
{/if}
