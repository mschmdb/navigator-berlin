interface NavigatorLike {
	share?: (data: ShareData) => Promise<void>;
	canShare?: (data: ShareData) => boolean;
}

function nav(): NavigatorLike | null {
	if (typeof navigator === 'undefined') return null;
	return navigator as unknown as NavigatorLike;
}

export function canNativeShare(payload?: ShareData): boolean {
	const n = nav();
	if (!n || typeof n.share !== 'function') return false;
	if (payload && typeof n.canShare === 'function') {
		return n.canShare(payload);
	}
	return true;
}

export async function nativeShare(data: ShareData): Promise<boolean> {
	const n = nav();
	if (!n || typeof n.share !== 'function') return false;
	try {
		await n.share(data);
		return true;
	} catch {
		return false;
	}
}
