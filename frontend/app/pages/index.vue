<script setup lang="ts">
const {
	data: eras,
	status,
	error,
} = await useAsyncData("eras", () => apiClient.getEras());
</script>

<template>
	<div class="mx-auto max-w-3xl p-6">
		<h1 class="mb-6 text-2xl font-bold">Doctors</h1>

		<p v-if="status === 'pending'" class="text-muted">Loading eras&hellip;</p>

		<UAlert
			v-else-if="error"
			color="error"
			title="Failed to load eras"
			:description="error.message"
		/>

		<ul v-else class="grid gap-4 sm:grid-cols-2">
			<li v-for="era in eras" :key="era.id">
				<NuxtLink :to="`/eras/${era.id}`">
					<UCard
						class="h-full hover:ring-primary transition-shadow hover:ring-2"
					>
						<template #header>
							<h2 class="text-lg font-semibold">Doctor {{ era.id }}</h2>
						</template>
						<p>{{ era.actor }}</p>
						<p class="text-muted text-sm">
							{{ era.start_year }}&ndash;{{ era.end_year ?? "present" }}
						</p>
					</UCard>
				</NuxtLink>
			</li>
		</ul>
	</div>
</template>
