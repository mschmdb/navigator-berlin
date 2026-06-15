import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Dialog from './dialog.svelte';

const snippet = (html: string) => createRawSnippet(() => ({ render: () => html }));

describe('dialog.svelte', () => {
	it('rendert Trigger als button', async () => {
		render(Dialog, {
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>Body</p>')
		});
		const trigger = page.getByRole('button', { name: 'Open' });
		await expect.element(trigger).toBeInTheDocument();
	});

	it('zeigt Content nicht initial (open=false)', async () => {
		render(Dialog, {
			trigger: snippet('<span>Open</span>'),
			children: snippet('<p>SecretBody</p>')
		});
		await expect.element(page.getByText('SecretBody')).not.toBeInTheDocument();
	});

	it('zeigt Content wenn open=true mit Plex-Theming-Klassen, OHNE Overlay-Dim', async () => {
		render(Dialog, {
			open: true,
			trigger: snippet('<span>Trig</span>'),
			children: snippet('<p>VisibleBody</p>')
		});
		const body = page.getByText('VisibleBody');
		await expect.element(body).toBeInTheDocument();
		const content = (await body.element()).closest('[role="dialog"]');
		expect(content?.className).toMatch(/bg-bg-elevated/);
		expect(content?.className).toMatch(/border-rule-strong/);
		// UX-DR33: kein Overlay-Dimmer
		const overlay = document.querySelector('[data-dialog-overlay]');
		expect(overlay).toBeNull();
	});
});
