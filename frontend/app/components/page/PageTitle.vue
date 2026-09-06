<script setup lang="ts">
defineProps<{
	title: string;
}>();
</script>

<template>
	<div class="mb-6">
		<h1 class="text-2xl font-bold mb-2">{{ title }}</h1>
		<slot />
	</div>
</template>
