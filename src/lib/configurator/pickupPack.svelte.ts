type HatchOption = 'Flat Center Hatch' | 'Domed Center Hatch';

export type HeadacheRackOption = 'Hex Headache Rack' | 'Post Headache Rack';

export type Finish = 'Black Diamond Plate' | 'Diamond Plate' | 'Leopard' | 'Gladiator';

type TruckSlide = 'XT1200' | 'XT2000' | 'XT4000';

type PickupPackOptions = {
	hatch: HatchOption;
	gullwing: boolean;
	headacheRack: HeadacheRackOption;
	ladderRack: boolean;
	LED: boolean;
	additionalGullwingTray: number;
	additionalLowsideTray: number;
	finish: Finish;
	truckslide?: TruckSlide;
};

export class PickupPack {
	hatch: PickupPackOptions['hatch'] = $state('Flat Center Hatch');
	gullwing: PickupPackOptions['gullwing'] = $state(false);
	headacheRack: PickupPackOptions['headacheRack'] = $state('Hex Headache Rack');
	ladderRack: PickupPackOptions['ladderRack'] = $state(false);
	LED: PickupPackOptions['LED'] = $state(false);
	additionalGullwingTray: PickupPackOptions['additionalGullwingTray'] = $state(0);
	additionalLowsideTray: PickupPackOptions['additionalLowsideTray'] = $state(0);
	finish: PickupPackOptions['finish'] = $state('Black Diamond Plate');
	truckslide: PickupPackOptions['truckslide'] = $state();

	constructor(options?: PickupPackOptions) {
		if (options?.hatch) {
			this.hatch = options.hatch;
		}

		if (options?.gullwing) {
			this.gullwing = options.gullwing;
		}

		if (options?.headacheRack) {
			this.headacheRack = options.headacheRack;
		}

		if (options?.ladderRack) {
			this.ladderRack = options.ladderRack;
		}

		if (options?.LED) {
			this.LED = options.LED;
		}

		if (options?.additionalGullwingTray) {
			this.additionalGullwingTray = options.additionalGullwingTray;
		}

		if (options?.additionalLowsideTray) {
			this.additionalLowsideTray = options.additionalLowsideTray;
		}

		if (options?.finish) {
			this.finish = options.finish;
		}

		if (options?.truckslide) {
			this.truckslide = options.truckslide;
		}
	}
}
