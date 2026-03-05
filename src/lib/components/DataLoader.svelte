<script lang="ts">
	import { quintInOut, quintOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		loaded: boolean;
		progress: number;
	};

	let { progress }: Props = $props();
</script>

<section
	class="w-screen h-screen absolute left-0 top-0 z-[1000] flex justify-center items-center overflow-hidden"
>
	<div class="bg-white p-4 rounded-lg">
		<div
			class={twMerge(
				'bg-white border border-gray-900 w-[400px] h-[25px] transition-all rounded-md overflow-hidden duration-250 ease-out',
				progress === 100 && 'border-[#e92027] rounded-[100px]'
			)}
		>
			<div
				class={twMerge(
					'bg-[#282828] h-full transition-all duration-250 ease-out',
					progress === 100 && 'bg-[#e92027]'
				)}
				style:width={`${progress}%`}
			></div>
		</div>
	</div>
</section>
