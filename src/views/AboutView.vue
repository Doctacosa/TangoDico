<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
</script>


<template>
	<div class="about">
		<h2>{{ t("about.title") }}</h2>

		<div v-html="t('about.description')"></div>
	</div>
</template>


<style>
.about {
	text-align: left;
}
</style>
