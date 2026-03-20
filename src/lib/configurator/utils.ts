import {
	Scene,
	Mesh,
	MeshBasicMaterial,
	SphereGeometry,
	BackSide,
	WebGLRenderer,
	Texture
} from 'three';
import { PMREMGenerator } from 'three';
import { HDRLoader } from 'three/examples/jsm/Addons.js';

/**
 * Build a PMREM env texture from an HDR with a fixed rotation.
 * @param renderer three.js renderer
 * @param url path to equirectangular .hdr
 * @param rot rotation in radians as { x, y, z } (use y for yaw)
 */
export async function buildRotatedEnv(
	renderer: WebGLRenderer,
	url: string,
	rot: { x?: number; y?: number; z?: number } = { y: 0 }
) {
	const hdr = await new HDRLoader().loadAsync(url);

	// Offscreen scene: inverted sphere with HDR as map
	const envScene = new Scene();
	const sphere = new Mesh(
		new SphereGeometry(1, 64, 32),
		new MeshBasicMaterial({ map: hdr, side: BackSide })
	);
	sphere.rotation.set(rot.x ?? 0, rot.y ?? 0, rot.z ?? 0);
	envScene.add(sphere);

	const pmrem = new PMREMGenerator(renderer);
	pmrem.compileEquirectangularShader();

	const { texture } = pmrem.fromScene(envScene); // <- rotated env for IBL

	// Cleanup (keep `texture`!)
	sphere.geometry.dispose();
	(sphere.material as MeshBasicMaterial).map!.dispose();
	(sphere.material as MeshBasicMaterial).dispose();
	pmrem.dispose();

	return texture; // THREE.Texture (cubeUV format), ready for scene.environment
}

export function pseudoUUID() {
	const time = Date.now().toString(36);
	const random = Math.random().toString(36).slice(2, 10);

	return `${time}-${random}`;
}
