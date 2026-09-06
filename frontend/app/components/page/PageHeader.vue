<script setup lang="ts">
defineProps<{
	to: string;
	label: string;
}>();
</script>

<template>
	<NuxtLink :to="to" class="text-primary hover:underline mb-4 inline-block">
		&larr; {{ label }}
	</NuxtLink>
</template>
