<script lang="ts">
	import type { PupConfigurator } from '$lib/configurator/pup.svelte';
	import { getIcon, selectedItemContext } from '$lib/stores.svelte';
	import { informationText } from '$lib/stores.svelte';
	import { twMerge } from 'tailwind-merge';
	import { MediaQuery } from 'svelte/reactivity';

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
			case 'Finish':
				return () => {
					configurator.finishSelect();
				};

			case 'Truckslide':
				return () => {
					configurator.truckslideSelect();
				};
			case 'LED':
				return () => {
					configurator.additionalLightsSelect();
				};
			case 'Additional Trays':
				return () => {
					configurator.additionalTraysSelect();
				};
			default:
				return undefined;
		}
	}

	const large = new MediaQuery('min-width: 1200px');

	let gradient = $state('gradient-r');
</script>

<aside
	class={twMerge(
		'absolute block bg-gray-200 text-app-dark max-h-[95%] overflow-y-auto rounded-lg py-4 lg:py-8 px-4 opacity-25 transition-all border border-gray-300 shadow',
		large.current
			? 'left-8 top-1/2 -translate-y-1/2'
			: 'top-4 left-1/2 -translate-x-1/2 max-w-[90%]',
		configurator.loaded && 'opacity-100'
	)}
>
	<div
		class={[
			'pointer-events-none absolute h-full top-0 left-1/2 -translate-x-1/2 transition-all',
			!large.current && gradient
		]}
		style={`width: calc(100% - 16px)`}
	></div>
	<div
		onscroll={(e) => {
			const el = e.target as HTMLElement;
			const atStart = el.scrollLeft <= 0;
			const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth;

			if (atStart && !atEnd) {
				gradient = 'gradient-r';
			} else if (!atStart && !atEnd) {
				gradient = 'gradient';
			} else {
				gradient = 'gradient-l';
			}
		}}
		class={[
			'flex gap-4',
			large.current ? 'flex-col' : 'flex-row overflow-x-auto justify-start items-baseline'
		]}
	>
		{#each Object.keys(informationText) as item, i}
			<div class="flex items-center justify-center flex-col gap-1">
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
						'w-15 h-15 rounded-lg p-2 aspect-square bg-gray-300 items-center text-xs hover:scale-115 transition-all',
						selectedItemContext.context &&
							selectedItemContext.context.name === item &&
							'!bg-[#e92027]'
					)}
				>
					<img src={getIcon(item)} alt="" />
				</button>
				<p class="text-[10px] text-center">{item}</p>
			</div>
		{/each}
	</div>
</aside>

<style>
	.gradient {
		background: #cccccc;
		background: linear-gradient(
			90deg,
			#e5e7eb 0%,
			rgba(255, 255, 255, 0) 30%,
			rgba(255, 255, 255, 0) 50%,
			rgba(255, 255, 255, 0) 70%,
			#e5e7eb 100%
		);
	}

	.gradient-r {
		background: #cccccc;
		background: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0) 0%,
			rgba(255, 255, 255, 0) 50%,
			rgba(255, 255, 255, 0) 70%,
			#e5e7eb 100%
		);
	}

	.gradient-l {
		background: #cccccc;
		background: linear-gradient(
			90deg,
			#e5e7eb 0%,
			rgba(255, 255, 255, 0) 30%,
			rgba(255, 255, 255, 0) 50%,
			rgba(255, 255, 255, 0) 70%
		);
	}
</style>
