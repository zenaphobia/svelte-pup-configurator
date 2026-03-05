<script lang="ts">
	import { quintInOut, quintOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		loaded: boolean;
		progress: number;
	};

	let { progress, loaded }: Props = $props();

	const tweenedProgress = new Tween(0, { delay: 0, duration: 200, easing: quintOut });
	let isReady = $state(false);

	$effect(() => {
		if (tweenedProgress.target !== progress) {
			tweenedProgress.target = progress;
		}

		if (tweenedProgress.current === 100 && loaded) {
			setTimeout(() => {
				isReady = true;
			}, 1000);
		}
	});

	// $inspect({ progress, tweenedProgress: tweenedProgress.current });

	// #e92027
	// #ededed
	// #282828
</script>

{#if !isReady}
	<section
		transition:fade={{ duration: 500, easing: quintInOut }}
		class="w-screen h-screen bg-white absolute left-0 top-0 z-[1000] flex justify-center items-center overflow-hidden"
	>
		<div
			class={twMerge(
				'bg-white border border-gray-900 w-[400px] h-[25px] transition-all delay-500 rounded-md overflow-hidden duration-250',
				tweenedProgress.current === 100 && 'border-[#e92027] rounded-[100px]'
			)}
		>
			<div
				class={twMerge(
					'bg-[#282828] h-full transition-colors duration-250 delay-500',
					tweenedProgress.current === 100 && 'bg-[#e92027]'
				)}
				style:width={`${tweenedProgress.current}%`}
			></div>
		</div>
	</section>
{/if}
