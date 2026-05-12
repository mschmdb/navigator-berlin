export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export const BREAKPOINTS = {
	mobileMax: 640,
	tabletMax: 1024
} as const;

export function classifyViewportWidth(width: number): Breakpoint {
	if (width <= BREAKPOINTS.mobileMax) return 'mobile';
	if (width <= BREAKPOINTS.tabletMax) return 'tablet';
	return 'desktop';
}

export interface ViewportState {
	readonly breakpoint: Breakpoint;
	dispose: () => void;
}

export function useViewport(initial: Breakpoint = 'desktop'): ViewportState {
	let breakpoint = $state<Breakpoint>(initial);

	function update(): void {
		if (typeof window === 'undefined') return;
		breakpoint = classifyViewportWidth(window.innerWidth);
	}

	if (typeof window !== 'undefined') {
		update();
		window.addEventListener('resize', update);
	}

	return {
		get breakpoint() {
			return breakpoint;
		},
		dispose(): void {
			if (typeof window !== 'undefined') {
				window.removeEventListener('resize', update);
			}
		}
	};
}
