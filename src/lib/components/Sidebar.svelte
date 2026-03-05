<script lang="ts">
	import type { PupConfigurator } from '$lib/configurator/pup.svelte';
	import { selectedItemContext } from '$lib/stores.svelte';
	import { informationText } from '$lib/stores.svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		configurator: PupConfigurator;
	};

	let { configurator }: Props = $props();

	function getSelectFn(key: string): (() => void) | undefined {
		switch (key) {
			case 'Headache Rack':
				return () => {
					configurator.headacheRackSelect();
				};
			case 'Ladder Rack':
				return () => {
					configurator.ladderRackSelect();
				};
			case 'Hatch':
				return () => {
					configurator.hatchSelect();
				};
			case 'Gullwing':
				return () => {
					configurator.gullwingSelect();
				};
			case 'Finish': {
				return () => {
					configurator.finishSelect();
				};
			}
			case 'Truckslide': {
				return () => {
					configurator.truckslideSelect();
				};
			}
			case 'LED': {
				return () => {
					configurator.additionalLightsSelect();
				};
			}
			case 'AdditionalTrays': {
				configurator.additionalTraysSelect();
			}
			default:
				return undefined;
		}
	}
</script>

<aside
	class={[
		'absolute left-8 top-1/2 -translate-y-1/2 block bg-gray-200 text-app-dark rounded-full py-8 px-4 opacity-25 transition-all',
		configurator.loaded && 'opacity-100'
	]}
>
	<div class="flex flex-col gap-4">
		{#each Object.keys(informationText) as item, i}
			<button
				onclick={() => {
					selectedItemContext.context = {
						name: item,
						description: informationText[item as keyof typeof informationText].description
					};
					const fn = getSelectFn(item);

					fn?.();
				}}
				class={twMerge(
					'w-10 h-10 rounded-lg p-2 aspect-square bg-gray-300 items-center text-xs hover:scale-115 transition-all',
					selectedItemContext.context &&
						selectedItemContext.context.name === item &&
						'!bg-[#e92027]'
				)}
			>
				{item}
			</button>
		{/each}
	</div>
</aside>
