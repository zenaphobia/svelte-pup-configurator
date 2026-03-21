<script lang="ts">
	import { PupConfigurator } from '$lib/configurator/pup.svelte';
	import { selectedItemContext } from '$lib/stores.svelte';
	import { twMerge } from 'tailwind-merge';
	import TabbedButton from './TabbedButton.svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		configurator: PupConfigurator;
	};

	let { configurator }: Props = $props();

	type ConfiguratorButton = {
		text: string;
		action: () => void;
		active: boolean;
	};

	type Actions =
		| {
				type: 'toggle' | 'multi';
				buttons: ConfiguratorButton[];
		  }
		| {
				type: 'custom';
				renderer: Snippet<[PupConfigurator]>;
		  };

	let ladderRackActions: Actions = $derived({
		type: 'toggle',
		buttons: [
			{
				active: configurator.clientPUP.ladderRack,
				text: configurator.clientPUP.ladderRack ? 'Remove Ladder Rack' : 'Add Ladder Rack',
				action: () => {
					if (configurator.clientPUP.ladderRack) {
						configurator.hideLadderRack();
						configurator.clientPUP.ladderRack = false;
					} else {
						configurator.renderLadderRack();
						configurator.clientPUP.ladderRack = true;
					}
				}
			}
		]
	});

	let headacheRackOptions: Actions = $derived({
		type: 'multi',
		buttons: [
			{
				active: configurator.clientPUP.headacheRack === 'Hex Headache Rack',
				text: 'Hex',
				action: () => {
					configurator.switchToHexHeadacheRack();
				}
			},
			{
				active: configurator.clientPUP.headacheRack === 'Post Headache Rack',
				text: 'Post',
				action: () => {
					configurator.switchToPostHeadacheRack();
				}
			}
		]
	});

	let hatchOptions: Actions = $derived({
		type: 'multi',
		buttons: [
			{
				active: configurator.clientPUP.hatch === 'Flat Center Hatch',
				text: 'Flat Hatch',
				action: () => {
					configurator.renderFlatHatch();
				}
			},
			{
				active: configurator.clientPUP.hatch === 'Domed Center Hatch',
				text: 'Domed Hatch',
				action: () => {
					configurator.renderDomedHatch();
				}
			}
		]
	});

	let gullwingOptions: Actions = $derived({
		type: 'multi',
		buttons: [
			{
				active: configurator.clientPUP.gullwing,
				text: 'Gullwing Toolbox',
				action: () => {
					configurator.renderPro();
				}
			},
			{
				active: !configurator.clientPUP.gullwing,
				text: 'Standard',
				action: () => {
					configurator.renderStandard();
				}
			}
		]
	});

	let finishOptions: Actions = $derived({
		type: 'multi',
		buttons: [
			{
				active: configurator.clientPUP.finish === 'Diamond Plate',
				text: 'Diamond Plate',
				action: () => {
					configurator.switchToDiamondPlate();
				}
			},
			{
				active: configurator.clientPUP.finish === 'Black Diamond Plate',
				text: 'Black Diamond Plate',
				action: () => {
					configurator.switchToBlackDiamondPlate();
				}
			},
			{
				active: configurator.clientPUP.finish === 'Leopard',
				text: 'Leopard',
				action: () => {
					configurator.switchToLeopard();
				}
			},
			{
				active: configurator.clientPUP.finish === 'Gladiator',
				text: 'Gladiator',
				action: () => {
					configurator.switchToGladiator();
				}
			}
		]
	});

	let truckslideActions: Actions = $derived({
		type: 'multi',
		buttons: [
			{
				active: configurator.clientPUP.truckslide === undefined,
				text: 'No Truckslide',
				action: () => {
					configurator.hideTruckslide();
				}
			},
			{
				active: configurator.clientPUP.truckslide === 'XT1200',
				text: 'XT1200',
				action: () => {
					configurator.chooseXT1200();
				}
			},
			{
				active: configurator.clientPUP.truckslide === 'XT2000',
				text: 'XT2000',
				action: () => {
					configurator.chooseXT2000();
				}
			},
			{
				active: configurator.clientPUP.truckslide === 'XT4000',
				text: 'XT4000',
				action: () => {
					configurator.chooseXT4000();
				}
			}
		]
	});

	let additionalLightsActions: Actions = $derived({
		type: 'multi',
		buttons: [
			{
				active: configurator.clientPUP.LED,
				text: 'LED Lights',
				action: () => {
					configurator.renderLights();
				}
			},
			{
				active: !configurator.clientPUP.LED,
				text: 'No lights',
				action: () => {
					configurator.disableLights();
				}
			}
		]
	});

	let additionalTraysActions: Actions = $derived({
		type: 'multi',
		buttons: [
			{
				active: configurator.clientPUP.additionalLowsideTray === 0,
				text: 'No additional trays',
				action: () => {
					configurator.renderLowSideTrays(0);
				}
			},
			{
				active: configurator.clientPUP.additionalLowsideTray === 1,
				text: 'Add 1 tray',
				action: () => {
					configurator.renderLowSideTrays(1);
				}
			},
			{
				active: configurator.clientPUP.additionalLowsideTray === 2,
				text: 'Add 2 trays',
				action: () => {
					configurator.renderLowSideTrays(2);
				}
			}
		]
	});

	let truckColorActions: Actions = $derived({
		type: 'custom',
		renderer: ColorPicker
	});

	let allActions = $derived({
		'Ladder Rack': {
			actions: ladderRackActions
		},
		'Headache Rack': {
			actions: headacheRackOptions
		},
		Hatch: {
			actions: hatchOptions
		},
		Gullwing: {
			actions: gullwingOptions
		},
		Finish: {
			actions: finishOptions
		},
		Truckslide: {
			actions: truckslideActions
		},
		LED: {
			actions: additionalLightsActions
		},
		AdditionalTrays: {
			actions: additionalTraysActions
		},
		'Truck Color': {
			actions: truckColorActions
		}
	});

	let selectedActions: { actions: Actions } | undefined = $derived.by(() => {
		if (selectedItemContext.context) {
			return allActions[selectedItemContext.context.name as keyof typeof allActions];
		}
	});

	let colorMap: { name: string; style: string }[] = [
		{ name: 'red', style: 'red-gradient' },
		{ name: 'blue', style: 'blue-gradient' },
		{ name: 'gray', style: 'gray-gradient' },
		{ name: 'white', style: 'white' },
		{ name: 'black', style: 'black' }
	];

	let isHidden = $state(false);
	let ref: HTMLElement | undefined = $state();

	const interact = $state({
		is_active: false,
		start: 0,
		delta: 0,
		reset() {
			this.start = 0;
			this.delta = 0;
		}
	});

	$inspect({ interact });

	function getRefInt(el: HTMLElement | undefined, ctx: typeof selectedItemContext) {
		if (!el || !selectedItemContext.context) return -16;

		return -el.clientHeight - 16;
	}

	function getYPos() {
		if (!selectedItemContext.context) return -16;

		const height = ref?.clientHeight ?? 0;
		const closedY = -16;
		const openY = -height - 16;

		if (interact.is_active) {
			// base position depends on current state
			const base = isHidden ? closedY : openY;
			const next = base - interact.delta;

			// clamp so it doesn't drag too far either direction
			return Math.max(openY, Math.min(closedY, next));
		}

		return isHidden ? closedY : openY;
	}
</script>

<svelte:window
	onpointerdown={(e) => {
		const el = e.target as HTMLElement;
		if (el.id !== 'interactive-item') return;

		interact.is_active = true;
		interact.start = e.clientY;
		interact.delta = 0;
	}}
	onpointermove={(e) => {
		if (!interact.is_active) return;

		interact.delta = interact.start - e.clientY;
	}}
	onpointerup={() => {
		if (!interact.is_active) return;

		const threshold = 50;

		if (interact.delta >= threshold) {
			isHidden = false;
		} else if (interact.delta <= -threshold) {
			isHidden = true;
		}

		interact.is_active = false;
		interact.reset();
	}}
/>

<aside
	bind:this={ref}
	class={twMerge(
		'relative flex flex-col gap-2 left-1/2 p-4 rounded-lg transition-all opacity-0 bg-gray-200 w-[90%] lg:max-w-[600px] border border-gray-300 shadow',
		selectedItemContext.context && 'opacity-100',
		interact.is_active && 'transition-none'
	)}
	style={`transform: translateX(-50%) translateY(${getYPos(interact, isHidden, selectedItemContext)}px)`}
>
	<div class="absolute left-1/2 -translate-x-1/2 -top-6">
		<TabbedButton id="interactive-item" active={isHidden} style="fill-gray-200 stroke-gray-200" />
	</div>
	<div class="space-y-1">
		<p class="font-header text-2xl font-bold">
			{selectedItemContext.context?.name}
		</p>
		<p class="font-body text-xs text-pretty">
			{selectedItemContext.context?.description}
		</p>
	</div>

	{#if selectedActions}
		{#if selectedActions.actions.type === 'multi' || selectedActions.actions.type === 'toggle'}
			{#each selectedActions.actions.buttons as button (button.text)}
				<button
					onclick={() => {
						button.action();
					}}
					class={twMerge(
						'text-app-dark p-2 bg-gray-300 rounded-md transition-all duration-300 ease-in-out hover:rounded-[50px] hover:bg-gray-400',
						button.active && '!bg-[#e92027] !rounded-[50px] text-white'
					)}
				>
					{button.text}
				</button>
			{/each}
		{:else if selectedActions.actions.type === 'custom'}
			{@const renderer = selectedActions.actions.renderer}
			{@render renderer(configurator)}
		{/if}
	{/if}
</aside>

{#snippet ColorPicker(c: PupConfigurator)}
	<div class="flex w-full flex-col gap-2 items-center justify-between">
		{#each colorMap as color}
			<button
				class={twMerge(
					'capitalize transition-colors w-full h-12 rounded-full border-2 border-transparent',
					color.style,
					configurator.truckColor === color.name && 'border-red-600'
				)}
				onclick={() => {
					configurator.changeTruckColor(color.name);
				}}
			></button>
		{/each}
	</div>
{/snippet}

<style>
	.red-gradient {
		background: #cc1414;
		background: linear-gradient(
			126deg,
			rgba(204, 20, 20, 1) 0%,
			rgba(236, 87, 87, 1) 40%,
			rgba(255, 128, 128, 1) 50%,
			rgba(236, 87, 87, 1) 60%,
			rgba(204, 20, 20, 1) 100%
		);
	}

	.blue-gradient {
		background: #1461cc;
		background: linear-gradient(
			126deg,
			rgba(20, 97, 204, 1) 0%,
			rgba(68, 122, 199, 1) 40%,
			rgba(109, 147, 199, 1) 50%,
			rgba(68, 122, 199, 1) 60%,
			rgba(20, 97, 204, 1) 100%
		);
	}

	.gray-gradient {
		background: #a6a6a6;
		background: linear-gradient(
			126deg,
			rgba(166, 166, 166, 1) 0%,
			rgba(184, 184, 184, 1) 40%,
			rgba(219, 219, 219, 1) 50%,
			rgba(184, 184, 184, 1) 60%,
			rgba(166, 166, 166, 1) 100%
		);
	}

	.white {
		background: #dbdbdb;
		background: linear-gradient(
			126deg,
			rgba(219, 219, 219, 1) 0%,
			rgba(224, 222, 222, 1) 40%,
			rgba(250, 250, 250, 1) 50%,
			rgba(224, 222, 222, 1) 60%,
			rgba(219, 219, 219, 1) 100%
		);
	}

	.black {
		background: #000000;
		background: linear-gradient(
			126deg,
			rgba(0, 0, 0, 1) 0%,
			rgba(46, 46, 46, 1) 40%,
			rgba(74, 74, 74, 1) 50%,
			rgba(46, 46, 46, 1) 60%,
			rgba(0, 0, 0, 1) 100%
		);
	}
</style>
