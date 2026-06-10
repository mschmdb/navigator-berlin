import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ScoreMembershipBadge from './score-membership-badge.svelte';

describe('ScoreMembershipBadge', () => {
	it('Score-Input: zeigt klickbaren „Im Score · {Dimension}"-Link', async () => {
		const onJump = vi.fn();
		render(ScoreMembershipBadge, { slug: 'luft-2023', onJump });
		const link = document.querySelector('[data-testid="score-membership-link-luft-2023"]');
		expect(link).not.toBeNull();
		expect(link?.textContent).toMatch(/Ruhe & Luft/);
		(link as HTMLButtonElement).click();
		expect(onJump).toHaveBeenCalledWith('ruhe-luft');
	});

	it('Kontext-Layer: zeigt „Kontext · nicht im Score", kein Link', async () => {
		render(ScoreMembershipBadge, { slug: 'umweltgerechtigkeit-2023' });
		expect(document.querySelector('[data-testid="score-membership-context-umweltgerechtigkeit-2023"]')).not.toBeNull();
		expect(document.querySelector('[data-testid="score-membership-link-umweltgerechtigkeit-2023"]')).toBeNull();
	});

	it('V5: laerm-2023 bekommt den klärenden dB-Mittel-Hinweis', async () => {
		render(ScoreMembershipBadge, { slug: 'laerm-2023' });
		const note = document.querySelector('[data-testid="context-note-laerm-2023"]');
		expect(note?.textContent).toMatch(/dB-Mittel/);
	});
});
