<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app";

defineProps<{
	message: string;
	status?: AsyncDataRequestStatus;
}>();
</script>

<template>
	<p v-if="status === 'pending'" class="text-muted">{{ message }}</p>
</template>
