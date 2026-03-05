<script lang="ts">
	import { PupConfigurator } from '$lib/configurator/pup.svelte';
	import { selectedItemContext } from '$lib/stores.svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		configurator: PupConfigurator;
	};

	let { configurator }: Props = $props();

	type ConfiguratorButton = {
		text: string;
		action: () => void;
		active: boolean;
	};

	type Actions = {
		type: 'toggle' | 'multi';
		buttons: ConfiguratorButton[];
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
		}
	});

	let selectedActions: { actions: Actions } | undefined = $derived.by(() => {
		if (selectedItemContext.context) {
			return allActions[selectedItemContext.context.name as keyof typeof allActions];
		}
	});

	$inspect({ selectedItemContext, selectedActions });
</script>

<aside
	class={twMerge(
		'absolute flex flex-col gap-2 -bottom-full left-1/2 -translate-x-1/2 p-4 rounded-lg transition-all bg-gray-200 w-1/2 max-w-[600px]',
		selectedItemContext.context && 'bottom-4'
	)}
>
	<div class="space-y-1">
		<p class="font-header text-2xl font-bold">
			{selectedItemContext.context?.name}
		</p>
		<p class="font-body text-xs text-pretty">
			{selectedItemContext.context?.description}
		</p>
	</div>

	{#if selectedActions}
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
	{/if}
</aside>
