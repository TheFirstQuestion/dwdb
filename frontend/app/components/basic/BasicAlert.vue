<script setup lang="ts">
defineProps<{
	title: string;
	error?: Error;
}>();
</script>

<template>
	<UAlert
		v-if="error"
		color="error"
		:title="title"
		:description="error.message"
	/>
</template>
