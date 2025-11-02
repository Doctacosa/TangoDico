<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
</script>


<template>
	<div>
		<header>
			<img src="@/assets/logo.png" alt="Logo" class="logo" />
		</header>

		<div class="about">
			<h2>{{ t("about.title") }}</h2>

			<div v-html="t('about.description', { email: 'tango@interordi.com' })"></div>

			<div v-html="t('about.warnings')" class="warnings"></div>
		</div>
	</div>
</template>


<style>
.about {
	text-align: left;

	hr {
		margin-top: 30px;
		margin-bottom: 30px;
	}
}

.logo {
	width: 100%;
	max-width: 400px;
}

.warnings {
	border-left: 3px solid #FF5555;
	margin-top: 20px;
	padding-left: 10px;
	padding-top: 2px;
	padding-bottom: 2px;

	h3 {
		color: #FF5555;
		font-size: 90%;
		margin-top: 12px;
	}
}
</style>
