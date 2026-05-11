import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Button from './button.svelte';

const label = (text: string) =>
	createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe('button.svelte', () => {
	it('rendert default als secondary (border + text-ink + 44px touch)', async () => {
		render(Button, { children: label('Click') });
		const btn = page.getByRole('button', { name: 'Click' });
		await expect.element(btn).toBeInTheDocument();
		const el = (await btn.element()) as HTMLButtonElement;
		expect(el.className).toMatch(/border/);
		expect(el.className).toMatch(/text-ink/);
		expect(el.className).toMatch(/min-h-\[44px\]/);
		expect(el.className).toMatch(/min-w-\[44px\]/);
	});

	it('rendert primary mit bg-accent', async () => {
		render(Button, { variant: 'primary', children: label('Save') });
		const btn = page.getByRole('button', { name: 'Save' });
		const el = (await btn.element()) as HTMLButtonElement;
		expect(el.className).toMatch(/bg-accent/);
		expect(el.className).toMatch(/min-h-\[44px\]/);
	});

	it('rendert tertiary mit text-accent + underline-offset, kein Touch-Padding', async () => {
		render(Button, { variant: 'tertiary', children: label('Mehr') });
		const btn = page.getByRole('button', { name: 'Mehr' });
		const el = (await btn.element()) as HTMLButtonElement;
		expect(el.className).toMatch(/text-accent/);
		expect(el.className).toMatch(/underline-offset/);
		expect(el.className).not.toMatch(/min-h-\[44px\]/);
	});

	it('forwarded rest props (disabled, type)', async () => {
		render(Button, { type: 'submit', disabled: true, children: label('Send') });
		const btn = page.getByRole('button', { name: 'Send' });
		const el = (await btn.element()) as HTMLButtonElement;
		expect(el.type).toBe('submit');
		expect(el.disabled).toBe(true);
	});

	it('merged extra class via class-Prop', async () => {
		render(Button, { class: 'my-extra-class', children: label('X') });
		const btn = page.getByRole('button', { name: 'X' });
		const el = (await btn.element()) as HTMLButtonElement;
		expect(el.className).toMatch(/my-extra-class/);
	});

	it('focus-visible outline-focus-Ring vorhanden', async () => {
		render(Button, { children: label('Focus') });
		const btn = page.getByRole('button', { name: 'Focus' });
		const el = (await btn.element()) as HTMLButtonElement;
		expect(el.className).toMatch(/focus-visible:outline-focus/);
	});
});
