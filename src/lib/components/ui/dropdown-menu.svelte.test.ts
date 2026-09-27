import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import DropdownMenu from './dropdown-menu.svelte';

const snippet = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe('dropdown-menu.svelte', () => {
	it('rendert Trigger als button', async () => {
		render(DropdownMenu, {
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>Item</p>')
		});
		await expect.element(page.getByRole('button', { name: 'Open' })).toBeInTheDocument();
	});

	it('zeigt Content nicht initial (open=false)', async () => {
		render(DropdownMenu, {
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>SecretItem</p>')
		});
		await expect.element(page.getByText('SecretItem')).not.toBeInTheDocument();
	});

	it('oeffnet per Klick auf den Trigger (role="menu" sichtbar)', async () => {
		render(DropdownMenu, {
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>VisibleItem</p>')
		});
		const trigger = page.getByRole('button', { name: 'Open' });
		await userEvent.click(trigger);
		await expect.element(page.getByText('VisibleItem')).toBeInTheDocument();
		await expect.element(page.getByRole('menu')).toBeInTheDocument();
	});

	it('Escape schliesst das Menu und gibt den Fokus an den Trigger zurueck', async () => {
		render(DropdownMenu, {
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>VisibleItem</p>')
		});
		const trigger = page.getByRole('button', { name: 'Open' });
		await userEvent.click(trigger);
		await expect.element(page.getByText('VisibleItem')).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByText('VisibleItem')).not.toBeInTheDocument();
		expect(document.activeElement).toBe(await trigger.element());
	});

	it('gibt triggerProps (aria-label, data-testid, …) an den echten Trigger-Button weiter', async () => {
		render(DropdownMenu, {
			trigger: snippet('<span>Icon</span>'),
			triggerProps: { 'aria-label': 'Custom label', 'data-testid': 'custom-trigger' },
			children: snippet('<p>Item</p>')
		});
		const trigger = page.getByTestId('custom-trigger');
		await expect.element(trigger).toBeInTheDocument();
		const el = (await trigger.element()) as HTMLButtonElement;
		expect(el.tagName).toBe('BUTTON');
		expect(el.getAttribute('aria-label')).toBe('Custom label');
	});

	it('Content trägt das Projekt-Design (border-rule-strong, bg-bg-elevated, text-ink, kein Schatten)', async () => {
		render(DropdownMenu, {
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>StyledItem</p>')
		});
		await userEvent.click(page.getByRole('button', { name: 'Open' }));
		const item = await page.getByText('StyledItem').element();
		const content = item.closest('[role="menu"]');
		expect(content?.className).toMatch(/border-rule-strong/);
		expect(content?.className).toMatch(/bg-bg-elevated/);
		expect(content?.className).toMatch(/text-ink\b/);
		expect(content?.className).toMatch(/shadow-none/);
	});

	// `open` ist bindable (`open = $bindable(false)`) -- ein von außen
	// übergebener Startwert `true` muss den Content sofort zeigen, ohne Klick.
	it('bind:open -- ein initialer Wert true zeigt den Content sofort (ohne Klick)', async () => {
		render(DropdownMenu, {
			open: true,
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>AlreadyOpenItem</p>')
		});
		await expect.element(page.getByText('AlreadyOpenItem')).toBeInTheDocument();
		await expect.element(page.getByRole('menu')).toBeInTheDocument();
	});

	// Umgekehrte Richtung des Bindings: Escape (interner State-Wechsel auf
	// `open = false`) schließt den Content, obwohl er per `open: true` von
	// außen initial geöffnet wurde -- belegt, dass der interne bindable-State
	// tatsächlich schreibt, nicht nur den Startwert einmalig liest.
	it('bind:open -- interner Zustand schreibt zurück: Escape schließt einen initial offenen Content', async () => {
		render(DropdownMenu, {
			open: true,
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>AlreadyOpenItem</p>')
		});
		await expect.element(page.getByText('AlreadyOpenItem')).toBeInTheDocument();
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByText('AlreadyOpenItem')).not.toBeInTheDocument();
	});

	it('gibt die `class`-Prop zusätzlich zu den Projekt-Design-Klassen an den Content weiter', async () => {
		render(DropdownMenu, {
			class: 'my-custom-content-class',
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>ClassedItem</p>')
		});
		await userEvent.click(page.getByRole('button', { name: 'Open' }));
		const item = await page.getByText('ClassedItem').element();
		const content = item.closest('[role="menu"]');
		expect(content?.className).toMatch(/my-custom-content-class/);
		// Projekt-Design-Klassen bleiben zusätzlich erhalten (kein Ersetzen).
		expect(content?.className).toMatch(/border-rule-strong/);
	});
});
