<script lang="ts">
	/**
	 * Header-Menü (#138): ein Panel für alle Viewports, ersetzt den früheren
	 * Mobile-Drawer. Desktop rechts mit Overlay, Mobil als Vollbild.
	 * Vier Gruppen mit Kurztexten (abgenommen 17.10.2026), darunter
	 * Rechtliches und Kontakt, weil der Footer auf /explore mobil fehlt.
	 */
	import type { Snippet } from 'svelte';
	import { X } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { basePathname } from '$lib/i18n/base-path.js';
	import { siteMenuGroups, isCurrentMenuHref } from './internal/site-menu.js';
	import {
		siteMenuGroupTitle,
		siteMenuItemTitle,
		siteMenuItemDescription
	} from './internal/site-menu-labels.js';
	import { metaLinkLabel, type MetaLinkId } from './internal/meta-links.js';
	import SocialLinks from './internal/social-links.svelte';
	import MtcLogo from './internal/mtc-logo.svelte';

	type Props = {
		open: boolean;
		onClose: () => void;
		/** Aktueller Pfad inkl. Locale-Präfix, für `aria-current`. */
		currentPath: string;
		langSwitcher?: Snippet;
		/** Testbarkeit der Saison-Reihenfolge; Default: jetzt. */
		now?: Date;
	};

	let { open, onClose, currentPath, langSwitcher, now }: Props = $props();

	const LEGAL: readonly { id: MetaLinkId; href: string }[] = [
		{ id: 'lizenzen', href: '/lizenzen' },
		{ id: 'architektur', href: '/architektur' },
		{ id: 'webmcp', href: '/webmcp' },
		{ id: 'datenschutz', href: '/datenschutz' },
		{ id: 'impressum', href: '/impressum' }
	];

	const groups = $derived(siteMenuGroups(now ?? new Date()));
	const path = $derived(basePathname(new URL(currentPath, 'https://navigator.berlin')));

	let panelEl: HTMLElement | null = $state(null);

	function focusables(): HTMLElement[] {
		return panelEl
			? Array.from(panelEl.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
			: [];
	}

	$effect(() => {
		if (!open || !panelEl) return;
		focusables()[0]?.focus();
	});

	function onKeydown(e: KeyboardEvent): void {
		if (e.key === 'Escape') {
			e.preventDefault();
			onClose();
			return;
		}
		if (e.key !== 'Tab') return;
		const list = focusables();
		if (list.length === 0) return;
		const first = list[0];
		const last = list[list.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}
</script>

{#if open}
	<div
		role="presentation"
		data-testid="site-menu-backdrop"
		class="site-menu-backdrop fixed inset-0 z-50 bg-black/40"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
	>
		<div
			bind:this={panelEl}
			id="site-menu"
			role="dialog"
			aria-modal="true"
			aria-labelledby="site-menu-heading"
			data-testid="site-menu"
			tabindex="-1"
			onkeydown={onKeydown}
			class="site-menu-panel fixed inset-0 flex flex-col bg-bg-elevated sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] sm:border-l sm:border-rule-strong"
		>
			<header class="flex shrink-0 items-center justify-between border-b border-rule px-5 py-3">
				<h2 id="site-menu-heading" class="text-lg font-semibold text-ink">
					{m.shell_drawer_heading()}
				</h2>
				<button
					type="button"
					data-testid="site-menu-close"
					onclick={onClose}
					aria-label={m.shell_drawer_close_aria_label()}
					class="inline-flex min-h-(--target-min) min-w-(--target-min) items-center justify-center rounded-sm p-1.5 text-ink-muted hover:text-ink"
				>
					<X size={20} aria-hidden="true" />
				</button>
			</header>

			<div data-testid="site-menu-scroll" class="min-h-0 flex-1 overflow-y-auto">
				<nav aria-label={m.shell_meta_nav_aria_label()} class="px-5 py-4">
					{#each groups as group (group.id)}
						<section data-testid={`site-menu-group-${group.id}`} class="mb-5 last:mb-2">
							<h3 class="pb-1 text-sm font-semibold text-ink">{siteMenuGroupTitle(group.id)}</h3>
							<ul class="border-t border-rule">
								{#each group.items as item (item.id)}
									{@const description = siteMenuItemDescription(item.id)}
									<li class="border-b border-rule">
										<a
											href={localizedHref(item.href)}
											onclick={onClose}
											aria-current={isCurrentMenuHref(path, item.href) ? 'page' : undefined}
											class="site-menu-link block min-h-(--target-min) py-2.5 text-ink hover:text-accent aria-[current=page]:text-accent"
										>
											<span class="block text-base font-semibold">{siteMenuItemTitle(item.id)}</span
											>
											{#if description}
												<span class="mt-0.5 block text-sm leading-body text-ink-muted">
													{description}
												</span>
											{/if}
										</a>
									</li>
								{/each}
							</ul>
						</section>
					{/each}
				</nav>

				<footer class="border-t border-rule px-5 py-3">
					<nav aria-label={m.site_menu_legal_nav_aria_label()}>
						<ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
							{#each LEGAL as link (link.id)}
								<li>
									<a
										href={localizedHref(link.href)}
										onclick={onClose}
										class="inline-flex min-h-(--target-min) items-center hover:text-accent"
									>
										{metaLinkLabel(link.id)}
									</a>
								</li>
							{/each}
							<li>
								<a
									href={`mailto:${FEEDBACK_EMAIL}`}
									class="inline-flex min-h-(--target-min) items-center hover:text-accent"
								>
									{m.shell_contact_label()}
								</a>
							</li>
						</ul>
					</nav>
					<div class="mt-2 flex items-center justify-between gap-3">
						{#if langSwitcher}
							<div class="text-sm text-ink-muted sm:hidden">{@render langSwitcher()}</div>
						{/if}
						<div class="ml-auto flex items-center gap-3"><SocialLinks size={16} /><MtcLogo /></div>
					</div>
				</footer>
			</div>
		</div>
	</div>
{/if}

<style>
	@media (prefers-reduced-motion: no-preference) {
		.site-menu-backdrop {
			animation: site-menu-fade 150ms ease-out;
		}
		.site-menu-panel {
			animation: site-menu-in 180ms ease-out;
		}
	}

	@keyframes site-menu-fade {
		from {
			opacity: 0;
		}
	}

	@keyframes site-menu-in {
		from {
			transform: translateX(16px);
			opacity: 0;
		}
	}
</style>
