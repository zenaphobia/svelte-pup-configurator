<script lang="ts">
	type Props = {
		style?: string;
		active: boolean;
		onclick?: () => void;
	};

	let { style = '', active, onclick }: Props = $props();
</script>

<button
	onclick={() => {
		onclick?.();
	}}
	class={['relative origin-center cursor-pointer', style]}
>
	<svg width="120" height="50" xmlns="http://www.w3.org/2000/svg">
		<path
			stroke-width="10"
			stroke-linejoin="round"
			stroke-linecap="round"
			d="M 40 10 H 90 L 110 30 H 20 Z"
		/>

		<g class={active ? 'chevron-group open' : 'chevron-group'}>
			<path fill="black" d="M 65 10 L 75 20 L 55 20 Z" />
		</g>
	</svg>
</button>

<style>
	.chevron-group {
		transform-box: fill-box;
		transform-origin: center;
		transition: transform 200ms ease;
		transform: rotate(180deg);
	}

	.chevron-group.open {
		transform: rotate(0deg);
	}
</style>
