// place files you want to import through the `$lib` alias in this folder.
type DeviceProile = {
	probablyMobile: boolean;
	tier: 'high' | 'medium' | 'low';
	maxDpr: 1 | 1.25 | 2;
};

export function getInitial3DProfile(gl: WebGLRenderingContext): DeviceProile {
	const ua = navigator.userAgent;
	const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
	const isSmallScreen = window.innerWidth <= 900;
	const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
	const dpr = window.devicePixelRatio || 1;
	const mem = navigator.deviceMemory ?? 4;
	const cores = navigator.hardwareConcurrency ?? 4;
	const saveData = navigator.connection?.saveData ?? false;
	const effectiveType = navigator.connection?.effectiveType ?? '4g';
	const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

	const probablyMobile = isMobileUA || isTouch || isSmallScreen;

	let tier: DeviceProile['tier'] = 'high';

	if (
		dpr >= 2.5 ||
		mem <= 4 ||
		cores <= 4 ||
		maxTextureSize <= 4096 ||
		saveData ||
		effectiveType === '3g' ||
		effectiveType === '2g'
	) {
		tier = 'low';
	} else if (probablyMobile) {
		tier = 'medium';
	}

	return {
		probablyMobile,
		tier,
		maxDpr: tier === 'low' ? 1 : tier === 'medium' ? 1.25 : 2
	};
}
