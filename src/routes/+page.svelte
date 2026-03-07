<script lang="ts">
	import { PupConfigurator } from '../lib/configurator/pup.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import SelectedItem from '$lib/components/SelectedItem.svelte';
	import Loader from '$lib/components/Loader.svelte';
	import { untrack } from 'svelte';
	import { selectedItemContext } from '$lib/stores.svelte';
	import { fade, fly } from 'svelte/transition';
	import DataLoader from '$lib/components/DataLoader.svelte';

	let canvas: HTMLCanvasElement | undefined = $state();
	let configurator: PupConfigurator | undefined = $state();
	$effect(() => {
		canvas;
		untrack(() => {
			if (canvas) {
				configurator = new PupConfigurator(canvas);
				configurator.animate();
			}
		});
	});

	$inspect({ profile: configurator?.currentDeviceProfile });

	$effect(() => {
		console.log({ profile: configurator?.currentDeviceProfile });
	});
</script>

<svelte:window
	onresize={() => {
		const newViewport = document.getElementById('myCanvas') as HTMLCanvasElement;
		if (newViewport) {
			configurator?.onResize(newViewport);
		}
	}}
/>

{#if configurator}
	<Loader loaded={configurator.loaded} progress={configurator.progress} />

	{#if configurator.loadingExtraData}
		<div in:fly={{ duration: 150, y: -5 }} out:fly={{ duration: 150, y: 5, delay: 1250 }}>
			<DataLoader loaded={configurator.loadingExtraData} progress={configurator.progress} />
		</div>
	{/if}
{/if}

<div class="overflow-hidden w-screen h-screen">
	<canvas bind:this={canvas} id="myCanvas" class="block"></canvas>
</div>

{#if configurator}
	<Sidebar {configurator} />
	{#key selectedItemContext.context?.name}
		<div in:fly={{ duration: 200, y: 20 }} out:fade={{ duration: 200 }}>
			<SelectedItem {configurator} />
		</div>
	{/key}
{/if}
