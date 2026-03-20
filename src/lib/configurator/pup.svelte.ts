import {
	ACESFilmicToneMapping,
	BoxGeometry,
	CanvasTexture,
	Clock,
	Color,
	DefaultLoadingManager,
	DirectionalLight,
	DirectionalLightHelper,
	EquirectangularReflectionMapping,
	Euler,
	FileLoader,
	Group,
	LineSegments,
	Material,
	MathUtils,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	Object3D,
	PerspectiveCamera,
	Plane,
	PlaneGeometry,
	RepeatWrapping,
	Scene,
	SphereGeometry,
	SpotLight,
	Texture,
	TextureLoader,
	Vector2,
	Vector3,
	WebGLRenderer,
	WireframeGeometry,
	type Object3DEventMap
} from 'three';

import {
	DRACOLoader,
	FlakesTexture,
	GLTFLoader,
	GroundedSkybox,
	HDRLoader,
	OrbitControls,
	EXRLoader,
	type GLTF
} from 'three/examples/jsm/Addons.js';

import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { KTX2Loader } from 'three/examples/jsm/Addons.js';
import { ProgressiveLightMap, SoftShadowMaterial } from '@pmndrs/vanilla';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { PickupPack, type Finish } from './pickupPack.svelte.js';
import { modelUrlMap } from './data.js';
import gsap from 'gsap';
import { getInitial3DProfile } from '$lib';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { PUBLIC_CDN } from '$env/static/public';
import { rotate } from 'three/tsl';
import { pseudoUUID } from './utils.js';

type TruckColor = 'gray' | 'blue' | 'red' | 'black' | 'white';

export class PupConfigurator {
	// #region ThreeJS variables
	private loader: GLTFLoader;
	private fileLoader: FileLoader;
	private scene: Scene;
	private container: HTMLElement;
	private camera: PerspectiveCamera;
	private renderer: WebGLRenderer;
	private controls: OrbitControls;
	private dracoLoader: DRACOLoader;
	private ktx2Loader: KTX2Loader;
	private testLight: SpotLight;
	private shadowLight: DirectionalLight;
	// private shadowLightHelper: DirectionalLightHelper;

	// #region Truck & PUP Models
	private allModels: Group<Object3DEventMap> | undefined;
	private TruckModel: Group<Object3DEventMap> = new Group();
	private GullwingModel: Group<Object3DEventMap> | undefined;
	private HeadacheRackPost: Group<Object3DEventMap> | undefined;
	private HeadacheRackHex: Group<Object3DEventMap> = new Group();
	private LongLowSides: Group<Object3DEventMap> = new Group();
	private ShortLowSides: Group<Object3DEventMap> | undefined;
	private LongFlatHatch: Group<Object3DEventMap> = new Group();
	private ShortFlatHatch: Group<Object3DEventMap> | undefined;
	private LongDomedHatch: Group<Object3DEventMap> | undefined;
	private ShortDomedHatch: Group<Object3DEventMap> | undefined;
	private shortGladiatorFH: Group<Object3DEventMap> | undefined;
	private longGladiatorFH: Group<Object3DEventMap> | undefined;
	private shortGladiatorDH: Group<Object3DEventMap> | undefined;
	private longGladiatorDH: Group<Object3DEventMap> | undefined;
	private PupAccessories: Group<Object3DEventMap> = new Group();
	private XTBase: Group<Object3DEventMap> | undefined;
	private XT1200Truckslide: Group<Object3DEventMap> | undefined;
	private XT2000Truckslide: Group<Object3DEventMap> | undefined;

	// #region Textures
	private bdpBumpTexture: Texture = new Texture();
	private dpBumpTexture: Texture = new Texture();
	private patriotTexture: Texture = new Texture();
	private BK62BumpTexture: Texture = new Texture();
	private carPaintTexture: Texture = new Texture();
	private blankTexture: MeshBasicMaterial = new MeshBasicMaterial();

	clientPUP = new PickupPack();
	cameraTracker: Mesh;
	lightTracker: Mesh;
	standardCameraAngle = new Vector3(-25.0, 7.0, -10.0);
	uniforms: unknown = undefined;
	clock = new Clock();
	isHatchOpen = false;
	isTailgateOpen = false;
	isTruckslideOpen = false;

	// #region Materials
	private metalMat: MeshStandardMaterial = new MeshStandardMaterial();
	private windowMat: MeshPhysicalMaterial = new MeshPhysicalMaterial();
	private redGlassMat: MeshPhysicalMaterial = new MeshPhysicalMaterial();
	private truckPaintMat: MeshPhysicalMaterial = new MeshPhysicalMaterial();
	private clearGlassMat: MeshPhysicalMaterial = new MeshPhysicalMaterial();
	private bdpMaterial: MeshStandardMaterial = new MeshStandardMaterial();
	private dpMaterial: MeshStandardMaterial = new MeshStandardMaterial();
	private blackMetalMat: MeshStandardMaterial = new MeshStandardMaterial();
	private leopardMaterial: MeshStandardMaterial = new MeshStandardMaterial();
	private patriotMat: MeshStandardMaterial = new MeshStandardMaterial();
	private emissiveLight: MeshStandardMaterial = new MeshStandardMaterial();
	private BK62Mat: MeshStandardMaterial = new MeshStandardMaterial();
	private clearGlassMatLights: MeshPhysicalMaterial = new MeshPhysicalMaterial();
	private defaultLoadingManager: typeof DefaultLoadingManager = DefaultLoadingManager;
	private contactShadowAlphaMap: Texture = new Texture();

	private plm?: ProgressiveLightMap;
	private gLights?: Group;
	private gPlane?: Mesh;
	private shadowMaterial?: InstanceType<typeof SoftShadowMaterial>;
	private shadowCount = 0;
	// private gui = new GUI({ title: 'Debugger' });
	private lightPointerMesh: Mesh = new Mesh();
	private stats = new Stats();

	// Shadow configuration
	private shadowParams = {
		temporal: true, // Accumulate over time (more performant)
		frames: 40, // Number of frames to accumulate
		limit: Infinity, // Frame limit
		blend: 40, // Refresh ratio
		scale: 75, // Plane scale (increased for larger scene)
		opacity: 0.8, // Shadow opacity
		alphaTest: 0.04, // Discards alpha pixels
		colorBlend: 2 // How much colors turn to black
	};

	// Light configuration
	private lightParams = {
		position: new Vector3(-4.2, 30, -200), // Higher Y position for better angle
		radius: 25, // Jiggle radius (higher = softer shadows)
		amount: 13, // Number of lights
		intensity: Math.PI, // Light intensity
		ambient: 0.01, // Ambient occlusion (reduced for more directional light)
		bias: 0.001, // Negative bias can help with shadow acne
		mapSize: 2048, // Higher resolution (increased from 1024)
		size: 40, // Shadow camera bounds (increased for truck)
		near: 0.01, // Shadow camera near
		far: 1000 // Shadow camera far
	};

	// #region Svelte states
	progress: number = $state(0);
	// These are all started in the initial loading process
	private texturesLoaded = $state(false);
	private modelsLoaded = $state(false);
	private shadowsLoaded = $state(false);
	// Triggered by loading models/textures outside of the starting default configuration
	#loadingExtraData = $state(false);
	#loadingExtraDataTimeout: number | null = null;
	loaded = $derived.by(() => {
		if (this.texturesLoaded && this.modelsLoaded) {
			return true;
		}

		return false;
	});
	truckColor: TruckColor = $state('gray');
	private latestControlID: string = '';
	private queuedAnimations: gsap.core.Tween[] = [];
	private deviceProfile: ReturnType<typeof getInitial3DProfile> | undefined = undefined;

	get currentDeviceProfile() {
		return this.deviceProfile;
	}

	constructor(canvas: HTMLCanvasElement) {
		this.defaultLoadingManager = DefaultLoadingManager;
		this.defaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
			this.progress = 100 * (itemsLoaded / itemsTotal);
		};
		this.defaultLoadingManager.onLoad = () => {
			this.loaded = true;
		};
		this.defaultLoadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
			this.progress = 0;
			// console.log(`Loading started: ItemsTotal: ${itemsTotal}`);
		};

		// Scene setup
		this.loader = new GLTFLoader();
		this.fileLoader = new FileLoader();
		this.scene = new Scene();
		this.scene.background = new Color('#d9d9d9');
		this.container = canvas;
		this.stats.showPanel(0);
		document.body.appendChild(this.stats.dom);

		if (!this.container) {
			throw new Error('No container for canvas');
		}

		this.camera = new PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.position.set(
			this.standardCameraAngle.x,
			this.standardCameraAngle.y,
			this.standardCameraAngle.z
		);
		this.renderer = new WebGLRenderer({
			canvas: this.container,
			antialias: true,
			powerPreference: 'high-performance'
		});

		this.deviceProfile = getInitial3DProfile(this.renderer.getContext());
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.deviceProfile.maxDpr));
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.toneMapping = ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1; //If you enable sao, turn to 2
		this.renderer.shadowMap.enabled = true;
		// this.renderer.shadowMap.type = PCFSoftShadowMap;

		// Draco Loader
		this.dracoLoader = new DRACOLoader();
		this.dracoLoader.setDecoderPath('./draco/');
		this.loader.setDRACOLoader(this.dracoLoader);
		this.loader.setMeshoptDecoder(MeshoptDecoder);

		// ktx2 Loader
		this.ktx2Loader = new KTX2Loader();
		this.ktx2Loader.setTranscoderPath('./basis/');
		this.ktx2Loader.detectSupport(this.renderer);
		this.loader.setKTX2Loader(this.ktx2Loader);

		this.carPaintTexture = new CanvasTexture(new FlakesTexture());
		this.carPaintTexture.wrapT = RepeatWrapping;
		this.carPaintTexture.wrapS = RepeatWrapping;
		this.carPaintTexture.repeat.x = 40;
		this.carPaintTexture.repeat.y = 40;

		this.truckPaintMat = new MeshPhysicalMaterial({
			color: 0x1f1f1f,
			clearcoat: 1.0,
			clearcoatRoughness: 0.1,
			roughness: 0.05,
			normalMap: this.carPaintTexture,
			normalScale: new Vector2(0.03, 0.03),
			sheen: 1,
			sheenRoughness: 0.155,
			sheenColor: 0xffffff,
			name: 'Carpaint'
		});

		this.windowMat = new MeshPhysicalMaterial({
			color: 0x000000,
			transparent: true,
			roughness: 0,
			opacity: 0.95
		});
		this.redGlassMat = new MeshPhysicalMaterial({
			color: 0xfa0707,
			transparent: true,
			roughness: 0,
			opacity: 0.85
		});
		this.clearGlassMatLights = new MeshPhysicalMaterial({
			color: 0xffffff,
			transparent: true,
			roughness: 0,
			opacity: 0.85
		});
		this.clearGlassMat = new MeshPhysicalMaterial({
			color: 0xffffff,
			transparent: true,
			roughness: 0,
			opacity: 0.55
		});
		this.emissiveLight = new MeshStandardMaterial({
			color: 0xffffff,
			emissive: 0xffffff,
			emissiveIntensity: 0
		});
		this.blankTexture = new MeshBasicMaterial({
			color: 0x00ff00
		});

		// CameraHelper
		const geometry = new BoxGeometry(1, 1, 1);
		this.cameraTracker = new Mesh(geometry, this.blankTexture);
		this.scene.add(this.cameraTracker);
		this.cameraTracker.position.y = -1;
		this.cameraTracker.visible = false;

		// Primitive Lighting tracker
		this.lightTracker = new Mesh(geometry, this.blankTexture);
		this.lightTracker.position.y = -1;
		this.lightTracker.visible = false;
		this.scene.add(this.lightTracker);

		// Lights
		this.testLight = new SpotLight(0xffffff, 0, 125, 1.04, 1, 2);
		this.testLight.position.set(-1.25, 1, -2.65);
		this.testLight.castShadow = true;
		this.testLight.target = this.lightTracker;
		this.scene.add(this.testLight);

		// Add in shadow Light
		this.shadowLight = new DirectionalLight(0xffffff, 0);
		this.shadowLight.target = this.cameraTracker;
		this.shadowLight.position.set(
			this.lightParams.position.x,
			this.lightParams.position.y,
			this.lightParams.position.z
		);
		this.shadowLight.castShadow = true;
		this.scene.add(this.shadowLight);

		// for debug
		// this.shadowLightHelper = new DirectionalLightHelper(this.shadowLight, 10, 0xff0000);
		// this.scene.add(this.shadowLightHelper);

		const lp = new SphereGeometry(15, 24, 24);
		const lpm = new MeshBasicMaterial({
			color: 'pink',
			transparent: true,
			opacity: 0.5
		});

		this.lightPointerMesh = new Mesh(lp, lpm);
		this.lightPointerMesh.position.set(7, 0, 0);
		this.lightPointerMesh.castShadow = false;
		this.lightPointerMesh.receiveShadow = false;
		this.lightPointerMesh.visible = false;
		// this.scene.add(this.lightPointerMesh);

		const newRot = new Euler(0, 90, 0);
		this.scene.environmentRotation = newRot;
		this.scene.backgroundRotation = newRot;

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		// this.controls.minDistance = 3;
		this.controls.enablePan = false;
		this.controls.enableDamping = true;
		this.controls.maxPolarAngle = 1.6;
		this.controls.maxDistance = 100;
		this.controls.maxAzimuthAngle = 0.5;
		this.controls.minAzimuthAngle = -3.5;
		this.controls.rotateSpeed = this.deviceProfile.probablyMobile
			? this.container.offsetWidth / 1000
			: this.container.offsetWidth / 8000;

		this.controls.target = this.cameraTracker.position;

		this.loadAssets().then(() => {
			this.animate();
		});
	}

	async loadAssets() {
		const hdrLoader = new HDRLoader();
		const textureLoader = new TextureLoader();
		const exrLoader = new EXRLoader();

		await Promise.all([
			this.ktx2Loader.loadAsync(`${PUBLIC_CDN}/textures/ktx2/bdp-final.ktx2`),
			this.ktx2Loader.loadAsync(`${PUBLIC_CDN}/textures/ktx2/dp-pattern-final.ktx2`),
			this.ktx2Loader.loadAsync(`${PUBLIC_CDN}/textures/ktx2/BK62-bump.ktx2`),
			this.ktx2Loader.loadAsync(`${PUBLIC_CDN}/textures/ktx2/shadow_alphaMap.ktx2`)
		]).then(([bdpBumpTexture, dpBumpTexture, BK62BumpTexture, contactShadow]) => {
			this.bdpBumpTexture = bdpBumpTexture;
			this.bdpBumpTexture.flipY = false;
			this.bdpBumpTexture.wrapT = RepeatWrapping;
			this.bdpBumpTexture.wrapS = RepeatWrapping;
			this.bdpBumpTexture.repeat.set(2, 2);

			this.dpBumpTexture = dpBumpTexture;
			this.dpBumpTexture.flipY = false;
			this.dpBumpTexture.wrapS = RepeatWrapping;
			this.dpBumpTexture.wrapT = RepeatWrapping;
			this.dpBumpTexture.repeat.set(2, 2);

			this.BK62BumpTexture = BK62BumpTexture;
			this.BK62BumpTexture.flipY = false;
			this.BK62BumpTexture.wrapS = RepeatWrapping;
			this.BK62BumpTexture.wrapT = RepeatWrapping;
			this.BK62BumpTexture.repeat.set(2, 2);

			this.contactShadowAlphaMap = contactShadow;

			this.metalMat = new MeshStandardMaterial({
				color: 0xffffff,
				metalness: 1,
				roughness: 0.1,
				name: 'metalMat'
			});
			this.bdpMaterial = new MeshStandardMaterial({
				color: 0x000000,
				metalness: 1,
				roughness: 0.15,
				bumpScale: 1.0,
				bumpMap: this.bdpBumpTexture,
				name: 'bdpMaterial'
			});

			this.blackMetalMat = new MeshStandardMaterial({
				color: 0x000000,
				metalness: 1,
				roughness: 0.1,
				bumpScale: 1.0,
				bumpMap: this.BK62BumpTexture,
				name: 'blackMetalMat'
			});
			this.leopardMaterial = new MeshStandardMaterial({
				color: 0xffffff,
				map: this.dpBumpTexture,
				metalness: 1,
				roughness: 0.15,
				bumpScale: 1.0,
				bumpMap: this.bdpBumpTexture,
				name: 'leopardMaterial'
			});
			this.dpMaterial = new MeshStandardMaterial({
				color: 0xffffff,
				metalness: 1,
				roughness: 0.15,
				bumpScale: 1.0,
				bumpMap: this.dpBumpTexture,
				name: 'dpMaterial'
			});
			this.BK62Mat = new MeshStandardMaterial({
				color: 0x000000,
				metalness: 1,
				roughness: 0.15,
				bumpScale: 1.0,
				bumpMap: this.BK62BumpTexture,
				name: 'Bk62Mat'
			});

			console.log('debug: textures loaded');
		});

		await Promise.all([
			hdrLoader.loadAsync(`${PUBLIC_CDN}/hdrs/kloppenheim_06_puresky_1k.hdr`).then((envMap) => {
				envMap.mapping = EquirectangularReflectionMapping;
				this.scene.environment = envMap;
			})
			// this.ktx2Loader.loadAsync('./ldrs/ktx2/spruit_sunrise_2k.ktx2').then((skyboxTexture) => {
			// 	const skybox = new GroundedSkybox(skyboxTexture, 10, 256, 256);
			// 	skyboxTexture.flipY = true;
			// 	skybox.position.y = 4.25;
			// 	skybox.rotateY(2.1);
			// 	this.scene.add(skybox);
			// 	skybox.traverse((o) => {
			// 		if (o instanceof Mesh) {
			// 			o.castShadow = false;
			// 			o.receiveShadow = false;
			// 		}
			// 	});
			// })
		]).then(() => {
			this.texturesLoaded = true;
			console.log('hdrs loaded');
		});

		await Promise.all([
			this.loader.loadAsync(`${PUBLIC_CDN}/seperate-models/gltfpack/truck_gltfpack_final.glb`),
			// this.loader.loadAsync('./models/seperate-models/gullwing.gltf'),
			this.loader.loadAsync(`${PUBLIC_CDN}/seperate-models/gltfpack/headacheRackHex_gltfpack.glb`),
			// this.loader.loadAsync('./models/seperate-models/headacheRackPost.gltf'),
			this.loader.loadAsync(`${PUBLIC_CDN}/seperate-models/gltfpack/longLowSides_gltfpack.glb`),
			// this.loader.loadAsync('./models/seperate-models/shortLowSides.gltf'),
			this.loader.loadAsync(`${PUBLIC_CDN}/seperate-models/gltfpack/longFlatHatch_gltfpack.glb`),
			// this.loader.loadAsync('./models/seperate-models/shortFlatHatch.gltf'),
			// this.loader.loadAsync('./models/seperate-models/longDomedHatch.gltf'),
			// this.loader.loadAsync('./models/seperate-models/ShortDomedHatch.gltf'),
			// this.loader.loadAsync('./models/seperate-models/shortGladiatorFlatHatch.gltf'),
			// this.loader.loadAsync('./models/seperate-models/longGladiatorFlatHatch.gltf'),
			// this.loader.loadAsync('./models/seperate-models/shortGladiatorDomedHatch.gltf'),
			// this.loader.loadAsync('./models/seperate-models/longGladiatorDomedHatch.gltf'),
			this.loader.loadAsync(`${PUBLIC_CDN}/seperate-models/gltfpack/pup_extras_gltfpack.glb`),
			// this.loader.loadAsync('./models/seperate-models/truckslide-base.gltf'),
			// this.loader.loadAsync('./models/seperate-models/truckslide-xt1200.gltf'),
			// this.loader.loadAsync('./models/seperate-models/truckslide-xt2000.gltf')
			this.loader.loadAsync(`${PUBLIC_CDN}/seperate-models/gltfpack/shadow_gltfpack.glb`)
		])
			.then(
				([
					truckData,
					// gullwingData,
					hrHexData,
					// hrPostData,
					LongLSData,
					// shortLSData,
					longFHData,
					// shortFHdata,
					// longDomedData,
					// shortDomedData,
					// shortGladFHData,
					// longGladFHData,
					// shortGladDHData,
					// longGladDHData,
					PupExtrasData,
					// TSBaseData,
					// TSData1200,
					// TSData2000
					contactShadow
				]) => {
					this.TruckModel = this.#setupModel(truckData);
					// this.GullwingModel = this.#setupModel(gullwingData);
					this.HeadacheRackHex = this.#setupModel(hrHexData);
					// this.HeadacheRackPost = this.#setupModel(hrPostData);
					this.LongLowSides = this.#setupModel(LongLSData);
					// this.ShortLowSides = this.#setupModel(shortLSData);
					this.LongFlatHatch = this.#setupModel(longFHData);
					// this.ShortFlatHatch = this.#setupModel(shortFHdata);
					// this.LongDomedHatch = this.#setupModel(longDomedData);
					// this.ShortDomedHatch = this.#setupModel(shortDomedData);
					// this.shortGladiatorFH = this.#setupModel(shortGladFHData);
					// this.longGladiatorFH = this.#setupModel(longGladFHData);
					// this.shortGladiatorDH = this.#setupModel(shortGladDHData);
					// this.longGladiatorDH = this.#setupModel(longGladDHData);
					this.PupAccessories = this.#setupModel(PupExtrasData);
					// this.XTBase = this.#setupModel(TSBaseData);
					// this.XT1200Truckslide = this.#setupModel(TSData1200);
					// this.XT2000Truckslide = this.#setupModel(TSData2000);

					const shadow = this.#setupModel(contactShadow);

					// Load them into the scene
					let models = [
						this.TruckModel,
						// this.GullwingModel,
						this.HeadacheRackHex,
						// this.HeadacheRackPost,
						this.LongLowSides,
						// this.ShortLowSides,
						this.LongFlatHatch,
						// this.ShortFlatHatch,
						// this.LongDomedHatch,
						// this.ShortDomedHatch,
						// this.shortGladiatorFH,
						// this.longGladiatorFH,
						// this.shortGladiatorDH,
						// this.longGladiatorDH,
						this.PupAccessories,
						// this.XTBase,
						// this.XT1200Truckslide,
						// this.XT2000Truckslide,
						shadow
					];

					for (const model of models) {
						this.scene.add(model);
					}

					//adding hinge points
					// this.hingePoint = this.ShortLowSides.getObjectByName('lowside-hinge')!;

					// function rotateEach(collection: Object3D[]) {
					// 	collection.forEach((c, i) => {
					// 		setTimeout(() => {
					// 			console.log(`rotating: ${c.name}`);
					// 			c.rotateZ(0.5);
					// 		}, i * 5000);
					// 	});
					// }

					// let c = this.TruckModel.children[0].children;

					// rotateEach(c);

					//Setup Materials
					this.scene.traverse((child) => {
						// initial pup material setup
						if (child instanceof Mesh) {
							if (child.material && child.material.name === 'accent color') {
								child.material = this.blackMetalMat;
								child.geometry.name = 'accentColor';
							} else if (child.material && child.material.name === 'Black Diamond Plate Test 3') {
								child.material = this.BK62Mat;
								child.geometry.name = 'lidMaterial';
							}
							// truck materials setup
							else if (child.material && child.material.name === 'windowglass.002') {
								child.material = this.windowMat;
							} else if (child.material && child.material.name === 'redglass.002') {
								child.material = this.redGlassMat;
							} else if (child.material && child.material.name === 'clearglass.002') {
								child.material = this.clearGlassMatLights;
							} else if (child.material && child.material.name === 'Carpaint.001') {
								child.material = this.truckPaintMat;
							}

							// shadow alpha map
							else if (child.material && child.material.name === 'shadow') {
								child.material.alphaMap = this.contactShadowAlphaMap;
							}
						}

						child.castShadow = true;
						child.receiveShadow = true;
					});

					console.log('debug: scene traversed and materials set');

					// (this.ShortFlatHatch.getObjectByName('Decimated_Hatch') as Mesh).material =
					// 	this.bdpMaterial;
					// (this.GullwingModel.getObjectByName('gw-decimated-left-lid') as Mesh).material =
					// 	this.bdpMaterial;
					// (this.GullwingModel.getObjectByName('gw-decimated-right-lid') as Mesh).material =
					// 	this.bdpMaterial;
					// (this.GullwingModel.getObjectByName('GL-gw-left-lid') as Mesh).material =
					// 	this.blackMetalMat;
					// (this.GullwingModel.getObjectByName('GL-gw-right-lid') as Mesh).material =
					// 	this.blackMetalMat;
					// (this.ShortLowSides.getObjectByName('standard-left-lid') as Mesh).material =
					// 	this.bdpMaterial;
					// (this.ShortLowSides.getObjectByName('standard-right-lid') as Mesh).material =
					// 	this.bdpMaterial;
					// this.LongLowSides.getObjectByName('standard-long-left-lid').children[0].material =
					// 	this.bdpMaterial;
					this.assignNewMaterial(this.LongLowSides, 'standard-long-left-lid', this.bdpMaterial);
					this.assignNewMaterial(this.LongLowSides, 'standard-long-right-lid', this.bdpMaterial);
					// (this.LongLowSides.getObjectByName('standard-long-right-lid') as Mesh).material =
					// 	this.bdpMaterial;
					// (this.LongFlatHatch.getObjectByName('Shape_IndexedFaceSet622') as Mesh).material =
					// 	this.bdpMaterial;
					this.assignNewMaterial(this.LongFlatHatch, 'long_flat_hatch', this.bdpMaterial);
					// (this.ShortDomedHatch.getObjectByName('Shape_IndexedFaceSet028') as Mesh).material =
					// 	this.bdpMaterial;
					// (this.LongDomedHatch.getObjectByName('Shape_IndexedFaceSet012') as Mesh).material =
					// 	this.bdpMaterial;
					// (this.ShortLowSides.getObjectByName('Shape_IndexedFaceSet118') as Mesh).material =
					// 	this.emissiveLight;
					(this.LongLowSides.getObjectByName('Shape_IndexedFaceSet095') as Mesh).material =
						this.emissiveLight;

					//hide models
					// this.HeadacheRackPost.visible = false;
					// this.GullwingModel.visible = false;
					// this.GullwingModel.getObjectByName('GL-gw-left-lid')!.visible = false;
					// this.GullwingModel.getObjectByName('GL-gw-right-lid')!.visible = false;
					// this.GullwingModel.getObjectByName('additional-gw-tray')!.visible = false;
					// this.ShortLowSides.getObjectByName('GL-left-lid')!.visible = false;
					// this.ShortLowSides.getObjectByName('GL-right-lid')!.visible = false;
					// this.ShortLowSides.getObjectByName('GL-right-lid')!.visible = false;
					// this.ShortLowSides.getObjectByName('Shape_IndexedFaceSet118')!.visible = false;
					this.LongLowSides.getObjectByName('GL-ls-left-lid')!.visible = false;
					this.LongLowSides.getObjectByName('GL-ls-right-lid')!.visible = false;
					this.LongLowSides.getObjectByName('Shape_IndexedFaceSet095')!.visible = false;
					this.PupAccessories.getObjectByName('lowside-tray-2')!.visible = false;
					this.PupAccessories.getObjectByName('lowside-tray-3')!.visible = false;
					// this.ShortLowSides.visible = false;
					// this.ShortFlatHatch.visible = false;
					// this.LongDomedHatch.visible = false;
					// this.ShortDomedHatch.visible = false;
					// this.LongDomedHatch.visible = false;
					// this.shortGladiatorFH.visible = false;
					// this.longGladiatorFH.visible = false;
					// this.shortGladiatorDH.visible = false;
					// this.longGladiatorDH.visible = false;
					this.PupAccessories.getObjectByName('ladder-rack')!.visible = false;
					// this.XT2000Truckslide.visible = false;
					// this.XT2000Truckslide.getObjectByName('truckslide-left-xt4000')!.visible = false;
					// this.XT2000Truckslide.getObjectByName('truckslide-right-xt4000')!.visible = false;
					// this.XT2000Truckslide.getObjectByName('4000-middle-taper')!.visible = false;

					// Clear shadows after all objects are loaded
					// This traverses the scene and finds which objects cast shadows
					// this.setupAccumulativeShadows();
					// this.plm?.clear();
					this.modelsLoaded = true;

					console.log('debug: models loaded');

					setInterval(() => {
						console.log(this.renderer.info);
					}, 5000);
				}
			)
			.catch((err) => {
				throw new Error(err);
			});
	}

	get loadingExtraData() {
		return this.#loadingExtraData;
	}

	private async fetchModel(url: string) {
		// set loading state here
		this.#loadingExtraData = true;
		try {
			const model = await this.loader.loadAsync(url);
			return model.scene;
		} catch (err) {
			throw new Error('Could not fetch model');
		} finally {
			if (this.#loadingExtraDataTimeout) {
				clearTimeout(this.#loadingExtraDataTimeout);
			}
			this.#loadingExtraDataTimeout = setTimeout(() => {
				this.#loadingExtraData = false;
				this.#loadingExtraDataTimeout = null;
			}, 500);
		}
	}

	private setupAccumulativeShadows() {
		// Initialize ProgressiveLightMap
		this.plm = new ProgressiveLightMap(this.renderer, this.scene, 1024);

		// Create shadow material
		this.shadowMaterial = new SoftShadowMaterial({
			map: this.plm.progressiveLightMap2.texture,
			transparent: true,
			depthWrite: false,
			toneMapped: true,
			blend: this.shadowParams.colorBlend,
			alphaTest: 0 // Start at 0 so first frame doesn't show black plane
		});

		// Create shadow-catching plane
		this.gPlane = new Mesh(new PlaneGeometry(2, 2).rotateX(-Math.PI / 2), this.shadowMaterial);
		this.gPlane.scale.setScalar(this.shadowParams.scale);
		this.gPlane.receiveShadow = true;
		this.gPlane.position.y = -5.8;

		// For debug
		// const wireframGeo = new WireframeGeometry(this.gPlane.geometry);
		// const line = new LineSegments(wireframGeo);
		// line.scale.setScalar(this.shadowParams.scale);
		// line.position.y = -5.5;
		// this.scene.add(line);

		this.scene.add(this.gPlane);

		// Connect plane to ProgressiveLightMap
		this.plm.configure(this.gPlane);

		// Create group to hold randomized lights
		this.gLights = new Group();

		// Create directional lights
		for (let l = 0; l < this.lightParams.amount; l++) {
			const dirLight = new DirectionalLight(
				0xffffff,
				this.lightParams.intensity / this.lightParams.amount
			);
			dirLight.name = 'dir_light_' + l;
			dirLight.castShadow = true;
			dirLight.shadow.bias = this.lightParams.bias;
			dirLight.shadow.camera.near = this.lightParams.near;
			dirLight.shadow.camera.far = this.lightParams.far;
			dirLight.shadow.camera.right = this.lightParams.size / 2;
			dirLight.shadow.camera.left = -this.lightParams.size / 2;
			dirLight.shadow.camera.top = this.lightParams.size / 2;
			dirLight.shadow.camera.bottom = -this.lightParams.size / 2;
			dirLight.shadow.mapSize.width = this.lightParams.mapSize;
			dirLight.shadow.mapSize.height = this.lightParams.mapSize;
			dirLight.target = this.lightPointerMesh;
			dirLight.shadow.camera.updateProjectionMatrix();
			this.gLights?.add(dirLight);
		}

		// shadow debugger GUI
		// this.addPlmGui(this.gui);
	}

	private temporalUpdate() {
		console.log('going into temporal update');
		// Accumulate one frame at a time if temporal is enabled
		if (this.modelsLoaded) {
			if (
				(this.shadowParams.temporal || this.shadowParams.frames === Infinity) &&
				this.shadowCount < this.shadowParams.frames &&
				this.shadowCount < this.shadowParams.limit
			) {
				this.renderShadows();
				this.shadowCount++;
			} else {
				this.shadowsLoaded = true;
			}
		}
	}

	private renderShadows(frames = 1) {
		if (!this.plm || !this.shadowMaterial || !this.gLights) return;

		// console.log(
		// 	`Rendering shadows - Models loaded: ${this.modelsLoaded} | shadow count: ${this.shadowCount}`
		// );

		// see how the shadow is being rendered from
		// this.seeLightHelpers();

		this.shadowParams.blend = Math.max(
			2,
			this.shadowParams.frames === Infinity ? this.shadowParams.blend : this.shadowParams.frames
		);

		// Adapt opacity-blend ratio to number of frames
		if (!this.shadowParams.temporal) {
			this.shadowMaterial.opacity = this.shadowParams.opacity;
			this.shadowMaterial.alphaTest = this.shadowParams.alphaTest;
		} else {
			this.shadowMaterial.opacity = Math.min(
				this.shadowParams.opacity,
				this.shadowMaterial.opacity + this.shadowParams.opacity / this.shadowParams.blend
			);
			this.shadowMaterial.alphaTest = Math.min(
				this.shadowParams.alphaTest,
				this.shadowMaterial.alphaTest + this.shadowParams.alphaTest / this.shadowParams.blend
			);
		}

		// Switch accumulative lights on
		this.scene.add(this.gLights);

		// Collect scene lights and meshes
		this.plm.prepare();
		// Update the lightmap
		for (let i = 0; i < frames; i++) {
			// console.log('updating lightmap');
			this.randomiseLightPositions();
			this.plm.update(this.camera, this.shadowParams.blend);
		}
		// Switch lights off
		this.scene.remove(this.gLights);

		// Restore lights and meshes
		this.plm.finish();
	}

	private seeLightHelpers() {
		if (!this.gLights) return;

		const lightsHelpers: Object3D[] = [];
		this.gLights.traverse((light) => {
			if (light instanceof DirectionalLight) {
				const helper = new DirectionalLightHelper(light);
				lightsHelpers.push(helper);
			}
		});

		this.scene.add(...lightsHelpers);

		setTimeout(() => {
			this.scene.remove(...lightsHelpers);
		}, 3000);
	}

	private randomiseLightPositions() {
		if (!this.gLights) return;

		const vLength = this.lightParams.position.length();

		for (let i = 0; i < this.gLights.children.length; i++) {
			const light = this.gLights.children[i];
			if (Math.random() > this.lightParams.ambient) {
				// Directional light with jitter
				light.position.set(
					this.lightParams.position.x + MathUtils.randFloatSpread(this.lightParams.radius),
					this.lightParams.position.y + MathUtils.randFloatSpread(this.lightParams.radius),
					this.lightParams.position.z + MathUtils.randFloatSpread(this.lightParams.radius)
				);
			} else {
				// Ambient occlusion (spherical distribution)
				const lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0;
				const phi = 2 * Math.PI * Math.random();
				light.position.set(
					Math.cos(lambda) * Math.cos(phi) * vLength,
					Math.abs(Math.cos(lambda) * Math.sin(phi) * vLength),
					Math.sin(lambda) * vLength
				);
			}
		}
	}

	// Optional: Method to reset/recompute shadows
	public resetShadows() {
		if (!this.plm || !this.shadowMaterial) {
			console.error('Could not reset: ', this.plm, this.shadowMaterial);
			return;
		}

		this.plm.clear();
		this.shadowMaterial.opacity = 0;
		this.shadowMaterial.alphaTest = 0;
		this.shadowCount = 0;

		// If temporal is disabled, render all frames at once
		if (!this.shadowParams.temporal && this.shadowParams.frames !== Infinity) {
			this.renderShadows(this.shadowParams.frames);
		}
	}

	addPlmGui(gui: GUI) {
		const shFolder = gui.addFolder('Shadow Material');
		shFolder.open();
		shFolder.add(this.shadowParams, 'opacity', 0, 1).onChange((v) => {
			this.shadowMaterial!.opacity = v;
		});
		shFolder.add(this.shadowParams, 'alphaTest', 0, 1).onChange((v) => {
			this.shadowMaterial!.alphaTest = v;
		});
		// shFolder.addColor(this.shadowMaterial, 'color');
		// shFolder.add(this.shadowMaterial, 'blend', 0, 3);

		const folder = gui.addFolder('Shadow params');
		folder.open();
		folder.add(this.shadowParams, 'temporal');
		// folder.add(this.shadowCount, 'toString()').listen().disable();

		const tempObject = {
			reComputeShadows: () => {
				this.resetShadows();
			} // to make a button in gui
		};
		folder.add(tempObject, 'reComputeShadows').name('Re compute ⚡');

		folder.add(this.shadowParams, 'frames', 2, 100, 1).onFinishChange(() => {
			this.resetShadows();
		});
		folder
			.add(this.shadowParams, 'scale', 0.5, 100)
			.onChange((v: number) => {
				this.gPlane!.scale.setScalar(v);
			})
			.onFinishChange(() => {
				this.resetShadows();
			});

		folder.add(this.lightParams, 'radius', 0.1, 5).onFinishChange(() => {
			this.resetShadows();
		});
		folder.add(this.lightParams, 'ambient', 0, 1).onFinishChange(() => {
			this.resetShadows();
		});

		const bulbFolder = gui.addFolder('💡 Light source');
		bulbFolder.open();
		bulbFolder
			.add(this.lightParams.position, 'x', -100, 100)
			.name('Light Direction X')
			.onFinishChange(() => {
				this.resetShadows();
				this.shadowLight.position.setX(this.lightParams.position.x);
				this.shadowLight.target = this.cameraTracker;
			});
		bulbFolder
			.add(this.lightParams.position, 'y', 1, 30)
			.name('Light Direction Y')
			.onFinishChange(() => {
				this.resetShadows();
				this.shadowLight.position.setY(this.lightParams.position.y);
				this.shadowLight.target = this.cameraTracker;
			});
		bulbFolder
			.add(this.lightParams.position, 'z', -100, 100)
			.name('Light Direction Z')
			.onFinishChange(() => {
				this.resetShadows();
				this.shadowLight.position.setZ(this.lightParams.position.z);
				this.shadowLight.target = this.cameraTracker;
			});
	}

	private assignMaterialsToObject(model: Group<Object3DEventMap>) {
		const accentMaterial = this.getAccentMaterial(this.clientPUP.finish);
		const primaryMaterial = this.getPrimaryMaterial(this.clientPUP.finish);

		model.traverse((child) => {
			if (child instanceof Mesh) {
				if (child.material && child.material.name === 'accent color') {
					child.material = accentMaterial;
					child.geometry.name = 'accentColor';
				}
				if (child.material && child.material.name === 'Black Diamond Plate Test 3') {
					child.material = primaryMaterial;
					child.geometry.name = 'lidMaterial';
				}
			}
		});
	}

	private getPrimaryMaterial(finish: Finish) {
		if (finish === 'Black Diamond Plate') {
			return this.bdpMaterial;
		} else if (finish === 'Diamond Plate') {
			return this.dpMaterial;
		} else if (finish === 'Leopard') {
			return this.leopardMaterial;
		} else {
			return this.blackMetalMat;
		}
	}

	private getAccentMaterial(finish: Finish) {
		if (finish === 'Diamond Plate') {
			return this.metalMat;
		} else {
			return this.blackMetalMat;
		}
	}

	onResize(canvas: HTMLCanvasElement) {
		this.container = canvas;
		if (!this.camera || !this.renderer) {
			throw new Error('No camera or renderer set up');
		}
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	animate() {
		requestAnimationFrame(() => this.animate());
		if (this.controls && this.camera && this.renderer && this.scene) {
			this.stats.begin();
			this.renderer.render(this.scene, this.camera);
			this.controls.update();
			// if (!this.shadowsLoaded) this.temporalUpdate();
			this.stats.end();
		}
	}

	changeTruckColor(color: string) {
		switch (color) {
			case 'red':
				this.truckPaintMat.color.set(0x570000);
				this.truckPaintMat.sheenColor.set(0x2b0000);
				this.truckColor = 'red';
				break;
			case 'blue':
				this.truckPaintMat.color.set(0x001340);
				this.truckPaintMat.sheenColor.set(0x000000);
				this.truckColor = 'blue';
				break;
			case 'gray':
				this.truckPaintMat.color.set(0x1f1f1f);
				this.truckPaintMat.sheenColor.set(0xffffff);
				this.truckColor = 'gray';
				break;
			case 'black':
				this.truckPaintMat.color.set(0x050505);
				this.truckPaintMat.sheenColor.set(0xffffff);
				this.truckColor = 'black';
				break;
			case 'white':
				this.truckPaintMat.color.set(0xf0f0f0);
				this.truckPaintMat.sheenColor.set(0xffffff);
				this.truckColor = 'white';
				break;
		}
	}

	// enableOrbitControls() {
	// 	const id = pseudoUUID();
	// 	this.latestControlID = id;
	// 	if (this.latestControlID === id) {
	// 		this.controls.enabled = true;
	// 	}
	// }

	registerOrbitControls() {
		const id = pseudoUUID();
		this.latestControlID = id;

		return [
			id,
			(id: string) => {
				if (this.latestControlID === id) {
					this.controls.enabled = true;
				} else {
					console.debug(
						'[registerOrbitControls]: debouncing controls callback, id passed in did not match latest ID assigned'
					);
				}
			}
		] as const;
	}

	headacheRackSelect() {
		//close other compartments
		this.closeAllCompartments();
		this.resetGlobalLight();
		this.#killTweenQueue();

		this.controls.enabled = false;

		const [id, enableOrbitControls] = this.registerOrbitControls();

		gsap.to(this.camera.position, {
			duration: 2,
			x: -4,
			y: 4,
			z: 0,
			ease: 'expo',
			onComplete: () => {}
		});

		gsap.to(this.cameraTracker.position, {
			duration: 2,
			x: 5,
			y: 2,
			z: 0,
			ease: 'expo',
			onComplete: () => {
				enableOrbitControls(id);
			}
		});
		// this.controls.target = this.cameraTracker.position;
		// this.controls.minDistance = 6;
		// this.controls.maxDistance = 20;
	}

	hatchSelect() {
		this.resetGlobalLight();
		this.#killTweenQueue();

		//close other compartments
		this.closeAllCompartments();

		this.controls.enabled = false;

		const [id, enableOrbitControls] = this.registerOrbitControls();

		gsap.to(this.camera.position, {
			duration: 2,
			x: this.standardCameraAngle.x,
			y: this.standardCameraAngle.y,
			z: this.standardCameraAngle.z,
			ease: 'expo',
			onComplete: () => {
				enableOrbitControls(id);
			}
		});

		gsap.to(this.cameraTracker.position, {
			duration: 2,
			x: 0,
			y: -1,
			z: 0,
			ease: 'expo'
		});

		// this.controls.target = this.cameraTracker.position;
	}

	// changeTargetDistance(number1: number, number2: number) {
	// 	if (this.timeout) {
	// 		clearTimeout(this.timeout);
	// 	}

	// 	this.timeout = setTimeout(() => {
	// 		if (!this.controls) {
	// 			throw new Error('orbitControls not initialized');
	// 		}

	// 		// gsap.to(this.controls, { duration: 1, minDistance: number1, ease: 'expo.inOut' });
	// 		// gsap.to(this.controls, { duration: 1, maxDistance: number2, ease: 'expo.inOut' });
	// 		// this.controls.minDistance = number1;
	// 		// this.controls.maxDistance = number2;
	// 	}, 100);
	// }

	gullwingSelect() {
		//close other compartments
		this.closeAllCompartments();
		this.resetGlobalLight();
		this.#killTweenQueue();

		this.controls!.enabled = false;

		const [id, enableOrbitControls] = this.registerOrbitControls();

		gsap.to(this.camera!.position, {
			duration: 2,
			x: -7.665,
			y: 5.15,
			z: -7,
			ease: 'expo',
			onComplete: () => {
				enableOrbitControls(id);
			}
		});
		gsap.to(this.cameraTracker!.position, { duration: 2, x: 5, y: 0, z: 0, ease: 'expo' });
		this.controls!.target = this.cameraTracker!.position;
	}

	finishSelect() {
		//close other compartments
		this.closeAllCompartments();
		this.resetGlobalLight();
		this.#killTweenQueue();

		this.controls.enabled = false;

		const [id, enableOrbitControls] = this.registerOrbitControls();

		gsap.to(this.camera.position, {
			duration: 2,
			x: this.standardCameraAngle.x,
			y: this.standardCameraAngle.y,
			z: this.standardCameraAngle.z,
			ease: 'expo',
			onComplete: () => {
				enableOrbitControls(id);
			}
		});
		gsap.to(this.cameraTracker.position, { duration: 2, x: 0, y: -1, z: 0, ease: 'expo' });
		// this.controls.target = this.cameraTracker.position;
	}

	truckslideSelect() {
		//close other compartments
		this.closeGullwing();
		this.closeLowSideLid();
		this.resetGlobalLight();
		this.presentTruckslide();
		this.#killTweenQueue();
		this.controls.enabled = false;

		const [id, enableOrbitControls] = this.registerOrbitControls();

		gsap.to(this.camera.position, {
			duration: 2,
			x: this.standardCameraAngle.x,
			y: this.standardCameraAngle.y,
			z: this.standardCameraAngle.z,
			ease: 'expo',
			onComplete: () => {
				enableOrbitControls(id);
			}
		});
		gsap.to(this.cameraTracker.position, { duration: 2, x: -5, y: -1, Z: 0, ease: 'expo' });
		// this.controls.target = this.cameraTracker.position;
	}

	// ladderRackHoverOn() {
	// 	// PupAccessories.getObjectByName('ladder-rack').visible = true;
	// 	ToHoloMaterial(PupAccessories.getObjectByName('ladder-rack'));
	// }

	// ladderRackHoverOff() {
	// 	if (clientPUP.LadderRack.enabled === true) {
	// 		PupAccessories.getObjectByName('ladder-rack').visible = true;
	// 	} else {
	// 		PupAccessories.getObjectByName('ladder-rack').visible = false;
	// 	}
	// 	toNormalMaterial(PupAccessories.getObjectByName('ladder-rack'));
	// }

	ladderRackSelect() {
		this.closeAllCompartments();
		this.resetGlobalLight();
		this.#killTweenQueue();
		this.controls.enabled = false;

		const [id, enableOrbitControls] = this.registerOrbitControls();

		gsap.to(this.camera.position, {
			duration: 2,
			x: -25,
			y: 8,
			z: 0,
			ease: 'expo',
			onComplete: () => {}
		});
		gsap.to(this.cameraTracker.position, {
			duration: 2,
			x: -5,
			y: 0,
			z: 0,
			ease: 'expo',
			onComplete: () => {
				enableOrbitControls(id);
			}
		});

		// this.controls.minDistance = 10;
		// this.controls.maxDistance = 30;
		// this.controls.target = this.cameraTracker.position;
	}

	additionalTraysSelect() {
		//close other compartments
		this.closeTruckslide();
		this.resetGlobalLight();
		this.#killTweenQueue();

		this.controls.enabled = false;

		const [id, enableOrbitControls] = this.registerOrbitControls();

		//dtermine if PUP Pro or Standard
		if (this.clientPUP.gullwing === true) {
			gsap.to(this.camera.position, {
				duration: 2,
				x: -8,
				y: 5,
				z: -10,
				ease: 'expo',
				onComplete: () => {
					enableOrbitControls(id);
				}
			});
			gsap.to(this.cameraTracker.position, { duration: 2, x: -1.25, y: 0, z: -3, ease: 'expo' });
		} else {
			gsap.to(this.camera.position, {
				duration: 2,
				x: -5,
				y: 5,
				z: -10,
				ease: 'expo',
				onComplete: () => {
					enableOrbitControls(id);
				}
			});
			gsap.to(this.cameraTracker.position, { duration: 2, x: 0, y: 0, z: -3, ease: 'expo' });
		}

		// this.controls.target = this.cameraTracker.position;

		this.openLowSideLid();
		this.openGullwing();
	}

	additionalLightsSelect() {
		// close other compartments
		this.closeTruckslide();
		this.#killTweenQueue();
		this.controls.enabled = false;

		const [id, enableOrbitControls] = this.registerOrbitControls();

		if (this.clientPUP.gullwing === true) {
			gsap.to(this.camera.position, {
				duration: 2,
				x: -8,
				y: 5,
				z: -10,
				ease: 'expo',
				onComplete: () => {
					enableOrbitControls(id);
				}
			});
			gsap.to(this.cameraTracker.position, { duration: 2, x: -1.25, y: 0, z: -3, ease: 'expo' });
			gsap.to(this.lightTracker.position, { duration: 2, x: -1.25, y: 0, z: -3, ease: 'expo' });
			this.testLight.position.set(-1.25, 1, -2.25);
		} else {
			gsap.to(this.camera.position, {
				duration: 2,
				x: -5,
				y: 5,
				z: -10,
				ease: 'expo',
				onComplete: () => {
					enableOrbitControls(id);
				}
			});
			gsap.to(this.cameraTracker.position, { duration: 2, x: 0, y: 0, z: -3, ease: 'expo' });
			gsap.to(this.lightTracker.position, { duration: 2, x: 0, y: 0, z: -3, ease: 'expo' });
			this.testLight.position.set(0, 1, -2.25);
		}

		if (this.clientPUP.LED) {
			gsap.to(this.testLight, { duration: 2, intensity: 10000, ease: 'expo' });
		}

		gsap.to(this.emissiveLight, { duration: 2, emissiveIntensity: 10000000, ease: 'expo' });
		gsap.to(this.renderer, { duration: 2, toneMappingExposure: 0.15, ease: 'expo' });

		// this.controls.target = this.cameraTracker.position;

		this.openLowSideLid();
	}

	#setupModel(data: GLTF) {
		const model = data.scene;
		return model;
	}

	openLowSideLid() {
		// We need to check if we have longer or shorter hatch by seeing if gullwing is selected

		if (this.ShortLowSides) {
			gsap.to(this.ShortLowSides.getObjectByName('lowside-hinge')!.rotation, {
				duration: 2,
				x: Math.PI * (160 / 360),
				ease: 'expo'
			});
		}

		gsap.to(this.LongLowSides.getObjectByName('long-ls-left-hinge')!.rotation, {
			duration: 2,
			x: Math.PI * (160 / 360),
			ease: 'expo'
		});
	}

	closeLowSideLid() {
		if (this.ShortLowSides) {
			gsap.to(this.ShortLowSides.getObjectByName('lowside-hinge')!.rotation, {
				duration: 2,
				x: 0,
				ease: 'expo'
			});
		}

		gsap.to(this.LongLowSides.getObjectByName('long-ls-left-hinge')!.rotation, {
			duration: 2,
			x: 0,
			ease: 'expo'
		});
	}

	GetLowSideCounter() {
		if (
			this.PupAccessories.getObjectByName('lowside-tray-2')!.visible === true &&
			this.PupAccessories.getObjectByName('lowside-tray-3')!.visible === false
		) {
			console.log('returned 2');
			return 2;
		} else if (this.PupAccessories.getObjectByName('lowside-tray-3')!.visible === true) {
			console.log('returned 3');
			return 3;
		} else {
			return 1;
		}
	}

	closeAllCompartments() {
		this.closeLowSideLid();
		this.closeGullwing();
		this.closeTruckslide();
	}

	renderLights() {
		this.clientPUP.LED = true;

		if (this.clientPUP.gullwing && this.ShortLowSides) {
			this.ShortLowSides.getObjectByName('Shape_IndexedFaceSet118')!.visible = true;
		}

		gsap.to(this.testLight, { duration: 1, intensity: 10000, ease: 'expo' });
		gsap.to(this.emissiveLight, { duration: 2, emissiveIntensity: 10000000, ease: 'expo' });

		this.LongLowSides.getObjectByName('Shape_IndexedFaceSet095')!.visible = true;
	}

	disableLights() {
		this.clientPUP.LED = false;

		this.testLight.intensity = 0;
		this.emissiveLight.emissiveIntensity = 0;

		if (this.ShortLowSides) {
			this.ShortLowSides.getObjectByName('Shape_IndexedFaceSet118')!.visible = false;
		}
		this.LongLowSides.getObjectByName('Shape_IndexedFaceSet095')!.visible = false;
	}

	resetGlobalLight() {
		gsap.to(this.renderer, { duration: 2, toneMappingExposure: 1, ease: 'expo' });
		gsap.to(this.testLight, { duration: 0.015, intensity: 0, ease: 'expo' });
	}

	async renderGullwingTray(enable: boolean) {
		if (!this.GullwingModel) {
			this.GullwingModel = await this.fetchModel(modelUrlMap.gullwingData);
			this.scene.add(this.GullwingModel);
		}

		const loc = this.GullwingModel.getObjectByName('additional-gw-tray')!.position;

		if (enable) {
			this.GullwingModel.getObjectByName('additional-gw-tray')!.visible = false;
		} else {
			this.GullwingModel.getObjectByName('additional-gw-tray')!.visible = true;
		}

		gsap.to(this.cameraTracker.position, {
			duration: 2,
			x: loc.x,
			y: loc.y,
			z: loc.z,
			ease: 'expo'
		});
		gsap.to(this.camera.position, { duration: 2, x: 3.25, y: 4, z: -12, ease: 'expo' });
		// this.controls.target = this.cameraTracker.position;
	}

	renderLowSideTrays(amount: number) {
		this.openLowSideLid();
		this.clientPUP.additionalLowsideTray = amount;
		this.controls.enabled = false;

		switch (this.clientPUP.additionalLowsideTray) {
			case 0:
				this.PupAccessories.getObjectByName('lowside-tray-2')!.visible = false;
				this.PupAccessories.getObjectByName('lowside-tray-3')!.visible = false;
				this.clientPUP.additionalLowsideTray = 0;
				switch (this.clientPUP.gullwing) {
					case true:
						this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -2.76635;
						break;
					case false:
						this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -1.71959;
						break;
				}
				break;
			case 1:
				this.PupAccessories.getObjectByName('lowside-tray-2')!.visible = true;
				this.PupAccessories.getObjectByName('lowside-tray-3')!.visible = false;
				this.clientPUP.additionalLowsideTray = 1;
				switch (this.clientPUP.gullwing) {
					case true:
						this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -2.76635;
						break;
					case false:
						this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -1.71959;
						break;
				}
				break;
			case 2:
				this.PupAccessories.getObjectByName('lowside-tray-2')!.visible = true;
				this.PupAccessories.getObjectByName('lowside-tray-3')!.visible = true;
				this.clientPUP.additionalLowsideTray = 2;
				switch (this.clientPUP.gullwing) {
					case true:
						this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -2.76635;
						this.PupAccessories.getObjectByName('lowside-tray-3')!.position.x = -4.38547;
						break;
					case false:
						this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -1.71959;
						this.PupAccessories.getObjectByName('lowside-tray-3')!.position.x = -3.41479;
						break;
				}
				break;
		}

		// const [id, enableOrbitControls] = this.registerOrbitControls();

		// if (this.clientPUP.gullwing) {
		// 	gsap.to(this.camera.position, {
		// 		duration: 2,
		// 		x: -8,
		// 		y: 5,
		// 		z: -10,
		// 		ease: 'expo',
		// 		onComplete: () => {
		// 			enableOrbitControls(id);
		// 		}
		// 	});
		// 	gsap.to(this.cameraTracker.position, { duration: 2, x: -1.25, y: 0, z: -3, ease: 'expo' });
		// } else {
		// 	gsap.to(this.camera.position, {
		// 		duration: 2,
		// 		x: -5,
		// 		y: 5,
		// 		z: -10,
		// 		ease: 'expo',
		// 		onComplete: () => {
		// 			enableOrbitControls(id);
		// 		}
		// 	});
		// 	gsap.to(this.cameraTracker.position, { duration: 2, x: 0, y: 0, z: -3, ease: 'expo' });
		// }

		// this.controls.target = this.cameraTracker.position;
	}

	renderLadderRack() {
		this.clientPUP.ladderRack = true;
		this.PupAccessories.getObjectByName('ladder-rack')!.visible = true;
	}

	hideLadderRack() {
		this.clientPUP.ladderRack = false;
		this.PupAccessories.getObjectByName('ladder-rack')!.visible = false;
	}

	async renderPro() {
		this.clientPUP.gullwing = true;

		this.LongLowSides.visible = false;

		if (!this.ShortLowSides) {
			this.ShortLowSides = await this.fetchModel(modelUrlMap.shortLSData);
			this.assignMaterialsToObject(this.ShortLowSides);
			this.scene.add(this.ShortLowSides);
		}

		this.ShortLowSides.visible = true;

		if (!this.GullwingModel) {
			this.GullwingModel = await this.fetchModel(modelUrlMap.gullwingData);
			this.assignMaterialsToObject(this.GullwingModel);
			this.scene.add(this.GullwingModel);
			this.GullwingModel.visible = false;
		}

		this.ShortLowSides.getObjectByName('GL-left-lid')!.visible = false;
		this.ShortLowSides.getObjectByName('GL-right-lid')!.visible = false;
		this.LongLowSides.getObjectByName('GL-ls-left-lid')!.visible = false;
		this.LongLowSides.getObjectByName('GL-ls-right-lid')!.visible = false;
		this.GullwingModel.getObjectByName('gw-decimated-right-lid')!.visible = false;
		this.GullwingModel.getObjectByName('gw-decimated-left-lid')!.visible = false;
		this.ShortLowSides.getObjectByName('standard-left-lid')!.visible = false;
		this.ShortLowSides.getObjectByName('standard-right-lid')!.visible = false;
		this.LongLowSides.getObjectByName('standard-long-left-lid')!.visible = false;
		this.LongLowSides.getObjectByName('standard-long-right-lid')!.visible = false;

		//If it's a Gladiator, reconstruct the whole damn thing
		if (this.clientPUP.finish === 'Gladiator') {
			//If Gullwing is not loaded, add to scene
			if (!this.GullwingModel.visible) {
				this.GullwingModel.visible = true;
				this.ShortLowSides.getObjectByName('GL-left-lid')!.visible = true;
				this.ShortLowSides.getObjectByName('GL-right-lid')!.visible = true;
				this.GullwingModel.getObjectByName('GL-gw-left-lid')!.visible = true;
				this.GullwingModel.getObjectByName('GL-gw-right-lid')!.visible = true;
				this.GullwingModel.getObjectByName('gw-decimated-left-lid')!.visible = false;
				this.GullwingModel.getObjectByName('gw-decimated-right-lid')!.visible = false;
				console.log('1. Gladiator Case');
				if (this.LongFlatHatch.visible) {
					this.LongFlatHatch.visible = false;
					if (!this.ShortFlatHatch) {
						this.ShortFlatHatch = await this.fetchModel(modelUrlMap.shortFHdata);
						this.assignMaterialsToObject(this.ShortFlatHatch);
						this.scene.add(this.ShortFlatHatch);
					}
					this.ShortFlatHatch.visible = true;
				} else if (this.LongDomedHatch?.visible) {
					this.LongDomedHatch.visible = false;
					if (!this.ShortDomedHatch) {
						this.ShortDomedHatch = await this.fetchModel(modelUrlMap.shortDomedData);
						this.assignMaterialsToObject(this.ShortDomedHatch);
						this.scene.add(this.ShortDomedHatch);
					}
					this.ShortDomedHatch.visible = true;
				} else if (this.longGladiatorDH?.visible) {
					this.longGladiatorDH.visible = false;
					if (!this.shortGladiatorDH) {
						this.shortGladiatorDH = await this.fetchModel(modelUrlMap.shortGladDHData);
						this.assignMaterialsToObject(this.shortGladiatorDH);
						this.scene.add(this.shortGladiatorDH);
					}
					this.shortGladiatorDH.visible = true;
				} else if (this.longGladiatorFH?.visible) {
					this.longGladiatorFH.visible = false;
					if (!this.shortGladiatorFH) {
						this.shortGladiatorFH = await this.fetchModel(modelUrlMap.shortGladFHData);
						this.assignMaterialsToObject(this.shortGladiatorFH);
						this.scene.add(this.shortGladiatorFH);
					}
					this.shortGladiatorFH.visible = true;
				} else {
					throw new Error('Unknown status of hatch?...');
				}
			}
			//If already added, replace gullwing meshes
			else {
				console.log('2. Gladiator Else case - Gullwing');
				this.ShortLowSides.getObjectByName('GL-left-lid')!.visible = true;
				this.ShortLowSides.getObjectByName('GL-right-lid')!.visible = true;
				this.GullwingModel.getObjectByName('GL-gw-left-lid')!.visible = true;
				this.GullwingModel.getObjectByName('GL-gw-right-lid')!.visible = true;
				this.GullwingModel.getObjectByName('gw-decimated-left-lid')!.visible = false;
				this.GullwingModel.getObjectByName('gw-decimated-right-lid')!.visible = false;

				this.assignNewMaterial(this.ShortLowSides, 'GL-left-lid', this.blackMetalMat);
				this.assignNewMaterial(this.ShortLowSides, 'GL-right-lid', this.blackMetalMat);
				this.assignNewMaterial(this.GullwingModel, 'GL-gw-left-lid', this.blackMetalMat);
				this.assignNewMaterial(this.GullwingModel, 'GL-gw-right-lid', this.blackMetalMat);

				if (this.LongFlatHatch.visible) {
					this.LongFlatHatch.visible = false;
					if (!this.ShortFlatHatch) {
						this.ShortFlatHatch = await this.fetchModel(modelUrlMap.shortFHdata);
						this.assignMaterialsToObject(this.ShortFlatHatch);
						this.scene.add(this.ShortFlatHatch);
					}
					this.ShortFlatHatch.visible = true;
				} else if (this.LongDomedHatch?.visible) {
					this.LongDomedHatch.visible = false;
					if (!this.ShortDomedHatch) {
						this.ShortDomedHatch = await this.fetchModel(modelUrlMap.shortDomedData);
						this.assignMaterialsToObject(this.ShortDomedHatch);
						this.scene.add(this.ShortDomedHatch);
					}
					this.ShortDomedHatch.visible = true;
				} else if (this.longGladiatorDH?.visible) {
					if (this.LongDomedHatch) {
						this.LongDomedHatch.visible = false;
					}
					if (!this.shortGladiatorDH) {
						this.shortGladiatorDH = await this.fetchModel(modelUrlMap.shortGladDHData);
						this.assignMaterialsToObject(this.shortGladiatorDH);
						this.scene.add(this.shortGladiatorDH);
					}
					this.shortGladiatorDH.visible = true;
				} else if (this.longGladiatorFH?.visible) {
					this.longGladiatorFH.visible = false;
					if (!this.shortGladiatorFH) {
						this.shortGladiatorFH = await this.fetchModel(modelUrlMap.shortGladFHData);
						this.assignMaterialsToObject(this.shortGladiatorFH);
						this.scene.add(this.shortGladiatorFH);
					}
					this.shortGladiatorFH.visible = true;
				}
			}
		} else {
			console.log('3. Else case');
			this.ShortLowSides.getObjectByName('GL-left-lid')!.visible = false;
			this.ShortLowSides.getObjectByName('GL-right-lid')!.visible = false;
			this.LongLowSides.getObjectByName('GL-ls-left-lid')!.visible = false;
			this.LongLowSides.getObjectByName('GL-ls-right-lid')!.visible = false;
			this.GullwingModel.getObjectByName('GL-gw-left-lid')!.visible = false;
			this.GullwingModel.getObjectByName('GL-gw-right-lid')!.visible = false;
			this.GullwingModel.getObjectByName('gw-decimated-left-lid')!.visible = true;
			this.GullwingModel.getObjectByName('gw-decimated-right-lid')!.visible = true;
			this.ShortLowSides.getObjectByName('standard-right-lid')!.visible = true;
			this.ShortLowSides.getObjectByName('standard-left-lid')!.visible = true;

			if (!this.GullwingModel.visible) {
				this.GullwingModel.visible = true;
				this.ShortLowSides.visible = true;
				if (this.LongFlatHatch.visible) {
					this.LongFlatHatch.visible = false;
					if (!this.ShortFlatHatch) {
						this.ShortFlatHatch = await this.fetchModel(modelUrlMap.shortFHdata);
						this.assignMaterialsToObject(this.ShortFlatHatch);
						this.scene.add(this.ShortFlatHatch);
					}
					this.ShortFlatHatch.visible = true;
				} else if (this.LongDomedHatch?.visible) {
					this.LongDomedHatch.visible = false;

					if (!this.ShortDomedHatch) {
						this.ShortDomedHatch = await this.fetchModel(modelUrlMap.shortDomedData);
						this.assignMaterialsToObject(this.ShortDomedHatch);
						this.scene.add(this.ShortDomedHatch);
					}

					this.ShortDomedHatch.visible = true;
				}
			}
		}
		switch (this.GetLowSideCounter()) {
			case 2:
				this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -2.76635;
				break;
			case 3:
				this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -2.76635;
				this.PupAccessories.getObjectByName('lowside-tray-3')!.position.x = -4.38547;
				break;
		}
	}

	async renderStandard() {
		this.clientPUP.gullwing = false;

		if (this.ShortLowSides) {
			this.ShortLowSides.visible = false;
		}

		this.LongLowSides.visible = true;

		if (this.GullwingModel) {
			this.GullwingModel.visible = false;
		}

		// For each case, assume models are loaded in.
		if (this.ShortFlatHatch?.visible) {
			this.LongFlatHatch.visible = true;
			this.ShortFlatHatch.visible = false;
			if (this.shortGladiatorFH) {
				this.shortGladiatorFH.visible = false;
			}
		} else if (this.ShortDomedHatch?.visible) {
			if (!this.LongDomedHatch) {
				this.LongDomedHatch = await this.fetchModel(modelUrlMap.longDomedData);
				this.assignMaterialsToObject(this.LongDomedHatch);
				this.scene.add(this.LongDomedHatch);
			}
			this.LongDomedHatch.visible = true;
			if (this.shortGladiatorDH) {
				this.shortGladiatorDH.visible = false;
			}
			this.ShortDomedHatch.visible = false;
		} else if (this.shortGladiatorFH?.visible) {
			this.shortGladiatorFH.visible = false;

			if (!this.longGladiatorFH) {
				this.longGladiatorFH = await this.fetchModel(modelUrlMap.longGladFHData);
				this.assignMaterialsToObject(this.longGladiatorFH);
				this.scene.add(this.longGladiatorFH);
			}

			this.longGladiatorFH.visible = true;
		} else if (this.shortGladiatorDH?.visible) {
			this.shortGladiatorDH.visible = false;
			if (!this.longGladiatorDH) {
				this.longGladiatorDH = await this.fetchModel(modelUrlMap.longGladDHData);
				this.assignMaterialsToObject(this.longGladiatorDH);
				this.scene.add(this.longGladiatorDH);
			}
			this.longGladiatorDH.visible = true;
		}
		if (this.clientPUP.finish === 'Gladiator') {
			this.LongLowSides.getObjectByName('standard-long-left-lid')!.visible = false;
			this.LongLowSides.getObjectByName('standard-long-right-lid')!.visible = false;
			this.LongLowSides.getObjectByName('GL-ls-left-lid')!.visible = true;
			this.LongLowSides.getObjectByName('GL-ls-right-lid')!.visible = true;
		} else {
			this.LongLowSides.getObjectByName('standard-long-left-lid')!.visible = true;
			this.LongLowSides.getObjectByName('standard-long-right-lid')!.visible = true;
			this.LongLowSides.getObjectByName('GL-ls-left-lid')!.visible = false;
			this.LongLowSides.getObjectByName('GL-ls-right-lid')!.visible = false;
		}

		switch (this.GetLowSideCounter()) {
			case 2:
				this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -1.71959;
				break;
			case 3:
				this.PupAccessories.getObjectByName('lowside-tray-2')!.position.x = -1.71959;
				this.PupAccessories.getObjectByName('lowside-tray-3')!.position.x = -3.41479;
				break;
		}
	}

	async renderDomedHatch() {
		this.clientPUP.hatch = 'Domed Center Hatch';
		//determine if PUP w/ Gullwing or PUP w/o Gullwing
		//render correct Hatch

		// This is always loaded
		this.LongFlatHatch.visible = false;

		if (this.ShortFlatHatch) this.ShortFlatHatch.visible = false;
		if (this.LongDomedHatch) this.LongDomedHatch.visible = false;
		if (this.ShortDomedHatch) this.ShortDomedHatch.visible = false;
		if (this.longGladiatorDH) this.longGladiatorDH.visible = false;
		if (this.shortGladiatorDH) this.shortGladiatorDH.visible = false;
		if (this.longGladiatorFH) this.longGladiatorFH.visible = false;
		if (this.shortGladiatorFH) this.shortGladiatorFH.visible = false;

		if (this.GullwingModel?.visible) {
			if (this.clientPUP.finish === 'Gladiator') {
				if (!this.shortGladiatorDH) {
					this.shortGladiatorDH = await this.fetchModel(modelUrlMap.shortGladDHData);
					this.assignMaterialsToObject(this.shortGladiatorDH);
					this.scene.add(this.shortGladiatorDH);
				}
				this.shortGladiatorDH.visible = true;
			} else {
				if (!this.ShortDomedHatch) {
					this.ShortDomedHatch = await this.fetchModel(modelUrlMap.shortDomedData);
					this.assignMaterialsToObject(this.ShortDomedHatch);
					this.scene.add(this.ShortDomedHatch);
				}
				this.ShortDomedHatch.visible = true;
			}
		}
		//If PUP w/o Gullwing
		else {
			if (this.clientPUP.finish === 'Gladiator') {
				if (!this.longGladiatorDH) {
					this.longGladiatorDH = await this.fetchModel(modelUrlMap.longGladDHData);
					this.assignMaterialsToObject(this.longGladiatorDH);
					this.scene.add(this.longGladiatorDH);
				}
				this.longGladiatorDH.visible = true;
			} else {
				if (!this.LongDomedHatch) {
					this.LongDomedHatch = await this.fetchModel(modelUrlMap.longDomedData);
					this.assignMaterialsToObject(this.LongDomedHatch);
					this.scene.add(this.LongDomedHatch);
				}
				this.LongDomedHatch.visible = true;
			}
		}
	}

	async renderFlatHatch() {
		this.clientPUP.hatch = 'Flat Center Hatch';
		// determine if PUP w/ Gullwing or PUP w/o Gullwing
		// render correct Hatch

		if (this.LongFlatHatch) this.LongFlatHatch.visible = false;
		if (this.ShortFlatHatch) this.ShortFlatHatch.visible = false;
		if (this.LongDomedHatch) this.LongDomedHatch.visible = false;
		if (this.ShortDomedHatch) this.ShortDomedHatch.visible = false;
		if (this.longGladiatorDH) this.longGladiatorDH.visible = false;
		if (this.shortGladiatorDH) this.shortGladiatorDH.visible = false;
		if (this.longGladiatorFH) this.longGladiatorFH.visible = false;
		if (this.shortGladiatorFH) this.shortGladiatorFH.visible = false;

		// If PUP w/ Gullwing
		if (this.GullwingModel?.visible) {
			if (this.clientPUP.finish === 'Gladiator') {
				if (!this.shortGladiatorFH) {
					this.shortGladiatorFH = await this.fetchModel(modelUrlMap.shortGladFHData);
					this.assignMaterialsToObject(this.shortGladiatorFH);
					this.scene.add(this.shortGladiatorFH);
				}
				this.shortGladiatorFH.visible = true;
			} else {
				if (!this.ShortFlatHatch) {
					this.ShortFlatHatch = await this.fetchModel(modelUrlMap.shortFHdata);
					this.assignMaterialsToObject(this.ShortFlatHatch);
					this.scene.add(this.ShortFlatHatch);
				}
				this.ShortFlatHatch.visible = true;
			}
		}
		// If PUP w/o Gullwing
		else {
			if (this.clientPUP.finish === 'Gladiator') {
				if (!this.longGladiatorFH) {
					this.longGladiatorFH = await this.fetchModel(modelUrlMap.longGladFHData);
					this.assignMaterialsToObject(this.longGladiatorFH);
					this.scene.add(this.longGladiatorFH);
				}
				this.longGladiatorFH.visible = true;
			} else {
				if (!this.LongFlatHatch) {
					this.LongFlatHatch = await this.fetchModel(modelUrlMap.shortFHdata);
					this.assignMaterialsToObject(this.LongFlatHatch);
					this.scene.add(this.LongFlatHatch);
				}
				this.LongFlatHatch.visible = true;
			}
		}
	}

	async switchToPostHeadacheRack() {
		if (!this.HeadacheRackPost) {
			this.HeadacheRackPost = await this.fetchModel(modelUrlMap.hrPostData);
			this.assignMaterialsToObject(this.HeadacheRackPost);
			this.scene.add(this.HeadacheRackPost);
		}

		this.HeadacheRackPost.visible = true;
		this.HeadacheRackHex.visible = false;

		this.clientPUP.headacheRack = 'Post Headache Rack';
	}

	async switchToHexHeadacheRack() {
		if (this.HeadacheRackPost) {
			this.HeadacheRackPost.visible = false;
		}
		this.HeadacheRackHex.visible = true;

		this.clientPUP.headacheRack = 'Hex Headache Rack';
	}

	#killTweenQueue() {
		if (this.queuedAnimations.length) {
			const animations = this.queuedAnimations;
			for (const animation of animations) {
				console.debug('Removing animation: ', animation);
				animation.kill();
			}
			this.queuedAnimations = [];
		}
	}

	#addToAnimationQueue(animation: gsap.core.Tween) {
		this.queuedAnimations.push(animation);
		console.debug('Adding to queue: ', this.queuedAnimations);
	}

	async chooseXT1200() {
		this.clientPUP.truckslide = 'XT1200';

		this.#killTweenQueue();

		if (!this.XTBase) {
			this.XTBase = await this.fetchModel(modelUrlMap.TSBaseData);
			this.scene.add(this.XTBase);
		}

		this.XTBase.getObjectByName('truckslide_movingBase')!.position.x = -4.65;

		if (!this.XT1200Truckslide) {
			this.XT1200Truckslide = await this.fetchModel(modelUrlMap.TSData1200);
			this.scene.add(this.XT1200Truckslide);
		}

		this.XT1200Truckslide.getObjectByName('Truckslide_XT1200')!.position.x = -4.65;

		this.XTBase.visible = true;
		this.XT1200Truckslide.visible = true;
		if (this.XT2000Truckslide) {
			this.XT2000Truckslide.visible = false;
		}

		// Once the models loads, position needs to update
		this.#addToAnimationQueue(
			gsap.to(this.XT1200Truckslide.getObjectByName('Truckslide_XT1200')!.position, {
				duration: 2,
				x: -11,
				ease: 'expo',
				delay: 1,
				onInterrupt: () => {
					this.XT1200Truckslide!.getObjectByName('Truckslide_XT1200')!.position.x = -4.65;
				}
			})
		);

		this.#addToAnimationQueue(
			gsap.to(this.XTBase.getObjectByName('truckslide_movingBase')!.position, {
				duration: 2,
				x: -11,
				ease: 'expo',
				delay: 1,
				onInterrupt: () => {
					this.XTBase!.getObjectByName('truckslide_movingBase')!.position.x = -4.65;
				}
			})
		);
	}

	async chooseXT2000() {
		this.clientPUP.truckslide = 'XT2000';

		this.#killTweenQueue();

		if (!this.XTBase) {
			this.XTBase = await this.fetchModel(modelUrlMap.TSBaseData);
			this.scene.add(this.XTBase);
		}

		this.XTBase.getObjectByName('truckslide_movingBase')!.position.x = -4.65;

		if (!this.XT2000Truckslide) {
			this.XT2000Truckslide = await this.fetchModel(modelUrlMap.TSData2000);
			this.scene.add(this.XT2000Truckslide);
		}

		this.XT2000Truckslide.getObjectByName('Truckslide_XT2000')!.position.x = -4.65;

		if (this.XT2000Truckslide.getObjectByName('truckslide-left-xt4000')!.visible === true) {
			this.XT2000Truckslide.getObjectByName('truckslide-left-xt4000')!.visible = false;
			this.XT2000Truckslide.getObjectByName('truckslide-right-xt4000')!.visible = false;
			this.XT2000Truckslide.getObjectByName('4000-middle-taper')!.visible = false;
		}

		this.XTBase.visible = true;
		this.XT2000Truckslide.visible = true;

		if (this.XT1200Truckslide) {
			this.XT1200Truckslide.visible = false;
		}

		this.XT2000Truckslide.getObjectByName('truckslide-left-xt2000')!.visible = true;
		this.XT2000Truckslide.getObjectByName('truckslide-right-xt2000')!.visible = true;
		this.XT2000Truckslide.getObjectByName('2000-middle-taper')!.visible = true;

		this.#addToAnimationQueue(
			gsap.to(this.XTBase.getObjectByName('truckslide_movingBase')!.position, {
				duration: 2,
				x: -11,
				ease: 'expo',
				delay: 1,
				onInterrupt: () => {
					this.XTBase!.getObjectByName('truckslide_movingBase')!.position.x = -4.65;
				}
			})
		);
		this.#addToAnimationQueue(
			gsap.to(this.XT2000Truckslide.getObjectByName('Truckslide_XT2000')!.position, {
				duration: 2,
				x: -11,
				ease: 'expo',
				delay: 1,
				onInterrupt: () => {
					this.XT2000Truckslide!.getObjectByName('Truckslide_XT2000')!.position.x = -4.65;
				}
			})
		);
	}

	async chooseXT4000() {
		this.clientPUP.truckslide = 'XT4000';

		this.#killTweenQueue();

		if (!this.XTBase) {
			this.XTBase = await this.fetchModel(modelUrlMap.TSBaseData);
			this.scene.add(this.XTBase);
		}

		this.XTBase.getObjectByName('truckslide_movingBase')!.position.x = -4.65;

		if (!this.XT2000Truckslide) {
			this.XT2000Truckslide = await this.fetchModel(modelUrlMap.TSData2000);
			this.scene.add(this.XT2000Truckslide);
		}

		if (this.XT1200Truckslide) {
			this.XT1200Truckslide.visible = false;
		}

		if (this.XT2000Truckslide.visible !== true) {
			this.XTBase.visible = true;
			this.XT2000Truckslide.visible = true;
			this.XT2000Truckslide.getObjectByName('truckslide-left-xt2000')!.visible = false;
			this.XT2000Truckslide.getObjectByName('truckslide-right-xt2000')!.visible = false;
			this.XT2000Truckslide.getObjectByName('2000-middle-taper')!.visible = false;
			this.XT2000Truckslide.getObjectByName('truckslide-left-xt4000')!.visible = true;
			this.XT2000Truckslide.getObjectByName('truckslide-right-xt4000')!.visible = true;
			this.XT2000Truckslide.getObjectByName('4000-middle-taper')!.visible = true;
		} else {
			this.XT2000Truckslide.getObjectByName('truckslide-left-xt2000')!.visible = false;
			this.XT2000Truckslide.getObjectByName('truckslide-right-xt2000')!.visible = false;
			this.XT2000Truckslide.getObjectByName('2000-middle-taper')!.visible = false;
			this.XT2000Truckslide.getObjectByName('truckslide-left-xt4000')!.visible = true;
			this.XT2000Truckslide.getObjectByName('truckslide-right-xt4000')!.visible = true;
			this.XT2000Truckslide.getObjectByName('4000-middle-taper')!.visible = true;
		}

		this.#addToAnimationQueue(
			gsap.to(this.XTBase.getObjectByName('truckslide_movingBase')!.position, {
				duration: 2,
				x: -11,
				ease: 'expo',
				delay: 1,
				onInterrupt: () => {
					this.XTBase!.getObjectByName('truckslide_movingBase')!.position.x = -4.65;
				}
			})
		);
		this.#addToAnimationQueue(
			gsap.to(this.XT2000Truckslide.getObjectByName('Truckslide_XT2000')!.position, {
				duration: 2,
				x: -11,
				ease: 'expo',
				delay: 1,
				onInterrupt: () => {
					this.XT2000Truckslide!.getObjectByName('Truckslide_XT2000')!.position.x = -4.65;
				}
			})
		);
	}

	// openHatch() {
	// 	if (!this.isHatchOpen) {
	// 		gsap.to(this.ShortFlatHatch.getObjectByName('Decimated_Hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (-15 / 360),
	// 			ease: 'expo'
	// 		});
	// 		gsap.to(this.LongFlatHatch.getObjectByName('long_flat_hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (-10 / 360),
	// 			ease: 'expo'
	// 		});
	// 		gsap.to(this.LongDomedHatch.getObjectByName('Shape_IndexedFaceSet012')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (-10 / 360),
	// 			ease: 'expo'
	// 		});
	// 		gsap.to(this.ShortDomedHatch.getObjectByName('Shape_IndexedFaceSet028')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (-15 / 360),
	// 			ease: 'expo'
	// 		});
	// 		gsap.to(this.shortGladiatorFH.getObjectByName('short-hatch-gladiator')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (-15 / 360),
	// 			ease: 'expo'
	// 		});
	// 		gsap.to(this.longGladiatorFH.getObjectByName('gladiator-long-hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (-10 / 360),
	// 			ease: 'expo'
	// 		});
	// 		gsap.to(this.longGladiatorDH.getObjectByName('gladiator-long-dome-hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (-10 / 360),
	// 			ease: 'expo'
	// 		});
	// 		gsap.to(this.shortGladiatorDH.getObjectByName('gladiator-short-domed-hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (-15 / 360),
	// 			ease: 'expo'
	// 		});
	// 		//document.getElementById("open-hatch").innerText = "Close Hatch";
	// 		this.isHatchOpen = true;
	// 	} else {
	// 		gsap.to(this.ShortFlatHatch.getObjectByName('Decimated_Hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (0 / 360),
	// 			ease: 'expo',
	// 			delay: 0
	// 		});
	// 		gsap.to(this.LongFlatHatch.getObjectByName('long_flat_hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (0 / 360),
	// 			ease: 'expo',
	// 			delay: 0
	// 		});
	// 		gsap.to(this.LongDomedHatch.getObjectByName('Shape_IndexedFaceSet012')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (0 / 360),
	// 			ease: 'expo',
	// 			delay: 0
	// 		});
	// 		gsap.to(this.ShortDomedHatch.getObjectByName('Shape_IndexedFaceSet028')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (0 / 360),
	// 			ease: 'expo',
	// 			delay: 0
	// 		});
	// 		gsap.to(this.shortGladiatorFH.getObjectByName('short-hatch-gladiator')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (0 / 360),
	// 			ease: 'expo',
	// 			delay: 0
	// 		});
	// 		gsap.to(this.longGladiatorFH.getObjectByName('gladiator-long-hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (0 / 360),
	// 			ease: 'expo',
	// 			delay: 0
	// 		});
	// 		gsap.to(this.longGladiatorDH.getObjectByName('gladiator-long-dome-hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (0 / 360),
	// 			ease: 'expo',
	// 			delay: 0
	// 		});
	// 		gsap.to(this.shortGladiatorDH.getObjectByName('gladiator-short-domed-hatch')!.rotation, {
	// 			duration: 2,
	// 			y: 2 * Math.PI * (0 / 360),
	// 			ease: 'expo',
	// 			delay: 0
	// 		});
	// 		//document.getElementById("open-hatch").innerText = "Open Hatch";
	// 		this.isHatchOpen = false;
	// 	}
	// }

	openTailgate() {
		if (!this.isTailgateOpen && this.isHatchOpen) {
			gsap.to(this.TruckModel.getObjectByName('tailgate')!.rotation, {
				duration: 2,
				x: 2 * Math.PI * (-90 / 360),
				ease: 'expo'
			});
			this.isTailgateOpen = true;
		} else if (this.isTailgateOpen && this.isHatchOpen && !this.isTruckslideOpen) {
			gsap.to(this.TruckModel.getObjectByName('tailgate')!.rotation, {
				duration: 2,
				x: 2 * Math.PI * (0 / 360),
				ease: 'expo'
			});
			this.isTailgateOpen = false;
		}
	}

	hideTruckslide() {
		this.clientPUP.truckslide = undefined;
		if (this.XTBase) {
			this.XTBase.visible = false;
		}
		if (this.XT1200Truckslide) {
			this.XT1200Truckslide.visible = false;
		}
		if (this.XT2000Truckslide) {
			this.XT2000Truckslide.visible = false;
		}
	}

	async presentTruckslide() {
		//open hatch
		if (this.ShortFlatHatch) {
			gsap.to(this.ShortFlatHatch.getObjectByName('Decimated_Hatch')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (-15 / 360),
				ease: 'expo'
			});
		}

		gsap.to(this.LongFlatHatch.getObjectByName('long_flat_hatch')!.rotation, {
			duration: 2,
			y: 2 * Math.PI * (-10 / 360),
			ease: 'expo'
		});

		if (this.LongDomedHatch) {
			gsap.to(this.LongDomedHatch.getObjectByName('Shape_IndexedFaceSet012')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (-10 / 360),
				ease: 'expo'
			});
		}

		if (this.ShortDomedHatch) {
			gsap.to(this.ShortDomedHatch.getObjectByName('Shape_IndexedFaceSet028')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (-15 / 360),
				ease: 'expo'
			});
		}

		if (this.shortGladiatorFH) {
			gsap.to(this.shortGladiatorFH.getObjectByName('short-hatch-gladiator')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (-15 / 360),
				ease: 'expo'
			});
		}

		if (this.longGladiatorFH) {
			gsap.to(this.longGladiatorFH.getObjectByName('gladiator-long-hatch')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (-10 / 360),
				ease: 'expo'
			});
		}

		if (this.longGladiatorDH) {
			gsap.to(this.longGladiatorDH.getObjectByName('gladiator-long-dome-hatch')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (-10 / 360),
				ease: 'expo'
			});
		}

		if (this.shortGladiatorDH) {
			gsap.to(this.shortGladiatorDH.getObjectByName('gladiator-short-domed-hatch')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (-15 / 360),
				ease: 'expo'
			});
		}

		//open tailgate
		gsap.to(this.TruckModel.getObjectByName('tailgate')!.rotation, {
			duration: 2,
			x: 2 * Math.PI * (-90 / 360),
			ease: 'expo',
			delay: 0.5
		});

		//open truckslide
		if (this.XTBase) {
			this.#addToAnimationQueue(
				gsap.to(this.XTBase.getObjectByName('truckslide_movingBase')!.position, {
					duration: 2,
					x: -11,
					ease: 'expo',
					delay: 1
				})
			);
		}

		if (this.XT2000Truckslide) {
			this.#addToAnimationQueue(
				gsap.to(this.XT2000Truckslide.getObjectByName('Truckslide_XT2000')!.position, {
					duration: 2,
					x: -11,
					ease: 'expo',
					delay: 1
				})
			);
		}

		if (this.XT1200Truckslide) {
			this.#addToAnimationQueue(
				gsap.to(this.XT1200Truckslide.getObjectByName('Truckslide_XT1200')!.position, {
					duration: 2,
					x: -11,
					ease: 'expo',
					delay: 1
				})
			);
		}
	}

	closeTruckslide() {
		//close truckslide first

		if (this.XTBase) {
			gsap.to(this.XTBase.getObjectByName('truckslide_movingBase')!.position, {
				duration: 2,
				x: -4.65,
				ease: 'expo'
			});
		}

		if (this.XT1200Truckslide) {
			gsap.to(this.XT1200Truckslide.getObjectByName('Truckslide_XT1200')!.position, {
				duration: 2,
				x: -4.65,
				ease: 'expo'
			});
		}

		if (this.XT2000Truckslide) {
			gsap.to(this.XT2000Truckslide.getObjectByName('Truckslide_XT2000')!.position, {
				duration: 2,
				x: -4.65,
				ease: 'expo'
			});
		}

		// Loads by default
		gsap.to(this.TruckModel.getObjectByName('tailgate')!.rotation, {
			duration: 2,
			x: 2 * Math.PI * (0 / 360),
			ease: 'expo',
			delay: 0.5
		});

		if (this.ShortFlatHatch) {
			gsap.to(this.ShortFlatHatch.getObjectByName('Decimated_Hatch')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (0 / 360),
				ease: 'expo',
				delay: 1
			});
		}

		// Loads by default
		gsap.to(this.LongFlatHatch.getObjectByName('long_flat_hatch')!.rotation, {
			duration: 2,
			y: 2 * Math.PI * (0 / 360),
			ease: 'expo',
			delay: 1
		});

		if (this.LongDomedHatch) {
			gsap.to(this.LongDomedHatch.getObjectByName('Shape_IndexedFaceSet012')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (0 / 360),
				ease: 'expo',
				delay: 1
			});
		}

		if (this.ShortDomedHatch) {
			gsap.to(this.ShortDomedHatch.getObjectByName('Shape_IndexedFaceSet028')!.rotation, {
				duration: 2,
				z: 2 * Math.PI * (0 / 360),
				ease: 'expo',
				delay: 1
			});
		}

		if (this.shortGladiatorFH) {
			gsap.to(this.shortGladiatorFH.getObjectByName('short-hatch-gladiator')!.rotation, {
				duration: 2,
				y: 2 * Math.PI * (0 / 360),
				ease: 'expo',
				delay: 1
			});
		}

		if (this.longGladiatorFH) {
			gsap.to(this.longGladiatorFH.getObjectByName('gladiator-long-hatch')!.rotation, {
				duration: 2,
				y: 2 * Math.PI * (0 / 360),
				ease: 'expo',
				delay: 1
			});
		}

		if (this.longGladiatorDH) {
			gsap.to(this.longGladiatorDH.getObjectByName('gladiator-long-dome-hatch')!.rotation, {
				duration: 2,
				y: 2 * Math.PI * (0 / 360),
				ease: 'expo',
				delay: 1
			});
		}

		if (this.shortGladiatorDH) {
			gsap.to(this.shortGladiatorDH.getObjectByName('gladiator-short-domed-hatch')!.rotation, {
				duration: 2,
				y: 2 * Math.PI * (0 / 360),
				ease: 'expo',
				delay: 1
			});
		}
	}

	openGullwing() {
		if (this.GullwingModel) {
			gsap.to(this.GullwingModel.getObjectByName('GW-left-hinge')!.rotation, {
				duration: 2,
				x: 135 * (Math.PI / 180),
				ease: 'expo'
			});
		}
		// if(!isGullwingOpen){
		//     gsap.to(GullwingModel.getObjectByName("GW-left-hinge").rotation, {duration: 2, x: 135 * (Math.PI / 180), ease:"expo"});
		//     isGullwingOpen = true;
		// }
		// else{
		//     gsap.to(GullwingModel.getObjectByName("GW-left-hinge").rotation, {duration: 2, x: 90 * (Math.PI / 180), ease:"expo"});
		//     isGullwingOpen = false;
		// }
	}

	closeGullwing() {
		if (this.GullwingModel) {
			gsap.to(this.GullwingModel.getObjectByName('GW-left-hinge')!.rotation, {
				duration: 2,
				x: 90 * (Math.PI / 180),
				ease: 'expo'
			});
		}
	}

	assignNewMaterial(object: Group<Object3DEventMap> | undefined, id: string, material: Material) {
		if (!object) {
			console.warn('[assignNewMaterial]: Skipping over material as object was not found');
			return;
		}

		const obj = object.getObjectByName(id);

		if (!obj) {
			console.error(`[assignNewMaterial]: object with id "${id}" was not found`);
			return;
		}

		if (obj instanceof Mesh) {
			obj.material = material;
			return;
		}

		const meshes: Mesh[] = [];

		obj.traverse((child) => {
			if (child instanceof Mesh) {
				meshes.push(child);
			}
		});

		if (!meshes.length) {
			console.error('[assignNewMaterial]: No meshes found in', obj);
			return;
		}

		meshes.forEach((mesh) => {
			mesh.material = material;
		});
	}

	switchToDiamondPlate() {
		let _accentColor = this.getAccentMaterial(this.clientPUP.finish);

		this.assignNewMaterial(this.ShortFlatHatch, 'Decimated_Hatch', this.dpMaterial);
		this.assignNewMaterial(this.GullwingModel, 'gw-decimated-left-lid', this.dpMaterial);
		this.assignNewMaterial(this.GullwingModel, 'gw-decimated-right-lid', this.dpMaterial);
		this.assignNewMaterial(this.ShortLowSides, 'standard-left-lid', this.dpMaterial);
		this.assignNewMaterial(this.ShortLowSides, 'standard-right-lid', this.dpMaterial);
		this.assignNewMaterial(this.LongLowSides, 'standard-long-left-lid', this.dpMaterial);
		this.assignNewMaterial(this.LongLowSides, 'standard-long-right-lid', this.dpMaterial);
		this.assignNewMaterial(this.LongFlatHatch, 'long_flat_hatch', this.dpMaterial);
		this.assignNewMaterial(this.ShortDomedHatch, 'Shape_IndexedFaceSet028', this.dpMaterial);
		this.assignNewMaterial(this.LongDomedHatch, 'Shape_IndexedFaceSet012', this.dpMaterial);

		this.scene!.traverse((child) => {
			if (child instanceof Mesh && child.material.name === _accentColor.name) {
				child.material = this.metalMat;
			}
		});

		this.clientPUP.finish = 'Diamond Plate';

		switch (this.clientPUP.hatch) {
			case 'Flat Center Hatch':
				this.renderFlatHatch();
				break;
			case 'Domed Center Hatch':
				this.renderDomedHatch();
				break;
			default:
				throw new Error('Unknown Hatch type');
		}
		switch (this.clientPUP.gullwing) {
			case true:
				this.renderPro();
				break;
			case false:
				this.renderStandard();
				break;
		}
	}

	switchToBlackDiamondPlate() {
		let _accentColor: Material | undefined;

		if (this.clientPUP.finish) {
			_accentColor = this.getAccentMaterial(this.clientPUP.finish);
		}

		if (!_accentColor) {
			throw new Error('accentColor did not match any materials');
		}

		this.assignNewMaterial(this.ShortFlatHatch, 'Decimated_Hatch', this.bdpMaterial);
		this.assignNewMaterial(this.GullwingModel, 'gw-decimated-left-lid', this.bdpMaterial);
		this.assignNewMaterial(this.GullwingModel, 'gw-decimated-right-lid', this.bdpMaterial);
		this.assignNewMaterial(this.ShortLowSides, 'standard-left-lid', this.bdpMaterial);
		this.assignNewMaterial(this.ShortLowSides, 'standard-right-lid', this.bdpMaterial);
		this.assignNewMaterial(this.LongLowSides, 'standard-long-left-lid', this.bdpMaterial);
		this.assignNewMaterial(this.LongLowSides, 'standard-long-right-lid', this.bdpMaterial);
		this.assignNewMaterial(this.LongFlatHatch, 'long_flat_hatch', this.bdpMaterial);
		this.assignNewMaterial(this.ShortDomedHatch, 'Shape_IndexedFaceSet028', this.bdpMaterial);
		this.assignNewMaterial(this.LongDomedHatch, 'Shape_IndexedFaceSet012', this.bdpMaterial);

		this.scene!.traverse((child) => {
			if (child instanceof Mesh && child.material.name === _accentColor.name) {
				child.material = this.blackMetalMat;
			}
		});
		this.clientPUP.finish = 'Black Diamond Plate';

		switch (this.clientPUP.hatch) {
			case 'Flat Center Hatch':
				this.renderFlatHatch();
				break;
			case 'Domed Center Hatch':
				this.renderDomedHatch();
				break;
			default:
				throw new Error('Unknown Hatch type');
		}
		switch (this.clientPUP.gullwing) {
			case true:
				this.renderPro();
				break;
			case false:
				this.renderStandard();
				break;
		}
	}

	switchToLeopard() {
		let _accentColor: Material | undefined;

		if (this.clientPUP.finish) {
			_accentColor = this.getAccentMaterial(this.clientPUP.finish);
		}

		if (!_accentColor) {
			throw new Error('accentColor did not match any materials');
		}

		this.assignNewMaterial(this.ShortFlatHatch, 'Decimated_Hatch', this.leopardMaterial);
		this.assignNewMaterial(this.GullwingModel, 'gw-decimated-left-lid', this.leopardMaterial);
		this.assignNewMaterial(this.GullwingModel, 'gw-decimated-right-lid', this.leopardMaterial);
		this.assignNewMaterial(this.ShortLowSides, 'standard-left-lid', this.leopardMaterial);
		this.assignNewMaterial(this.ShortLowSides, 'standard-right-lid', this.leopardMaterial);
		this.assignNewMaterial(this.LongLowSides, 'standard-long-left-lid', this.leopardMaterial);
		this.assignNewMaterial(this.LongLowSides, 'standard-long-right-lid', this.leopardMaterial);
		this.assignNewMaterial(this.LongFlatHatch, 'long_flat_hatch', this.leopardMaterial);
		this.assignNewMaterial(this.ShortDomedHatch, 'Shape_IndexedFaceSet028', this.leopardMaterial);
		this.assignNewMaterial(this.LongDomedHatch, 'Shape_IndexedFaceSet012', this.leopardMaterial);

		this.scene!.traverse((child) => {
			if (child instanceof Mesh && child.material.name === _accentColor.name) {
				child.material = this.blackMetalMat;
			}
		});

		this.clientPUP.finish = 'Leopard';

		switch (this.clientPUP.hatch) {
			case 'Flat Center Hatch':
				this.renderFlatHatch();
				break;
			case 'Domed Center Hatch':
				this.renderDomedHatch();
				break;
			default:
				throw new Error('Unknown Hatch type');
		}
		switch (this.clientPUP.gullwing) {
			case true:
				this.renderPro();
				break;
			case false:
				this.renderStandard();
				break;
		}
	}

	switchToGladiator() {
		let _accentColor: Material | undefined;

		if (this.clientPUP.finish) {
			_accentColor = this.getAccentMaterial(this.clientPUP.finish);
		}

		if (!_accentColor) {
			throw new Error('accentColor did not match any materials');
		}

		this.scene!.traverse((child) => {
			if (child instanceof Mesh && child.material.name === _accentColor.name) {
				child.material = this.blackMetalMat;
			}
		});

		this.clientPUP.finish = 'Gladiator';

		switch (this.clientPUP.hatch) {
			case 'Flat Center Hatch':
				this.renderFlatHatch();
				break;
			case 'Domed Center Hatch':
				this.renderDomedHatch();
				break;
			default:
				throw new Error('Unknown Hatch type');
		}
		switch (this.clientPUP.gullwing) {
			case true:
				this.renderPro();
				break;
			case false:
				this.renderStandard();
				break;
		}
	}
}
