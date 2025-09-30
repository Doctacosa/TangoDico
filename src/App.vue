<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

import { RouterLink, RouterView } from 'vue-router'
//import HelloWorld from './components/HelloWorld.vue'
</script>


<template>
	<header>
		<img src="@/assets/logo.png" alt="Logo" class="logo" width="125" height="125" />
		<h1>{{ t("nav.dictionary") }}</h1>

	</header>

	<RouterView />

	<footer>
		<div class="wrapper">
			<nav>
				<RouterLink to="/">{{ t("nav.home") }}</RouterLink>
				<RouterLink to="/about">{{ t("nav.about") }}</RouterLink>
			</nav>
		</div>
	</footer>
</template>


<style scoped>
footer {
	line-height: 1.5;
	max-height: 100vh;
}

.logo {
	display: block;
	margin: 0 auto 2rem;
}

nav {
	width: 100%;
	font-size: 12px;
	text-align: center;
	margin-top: 2rem;

	> * {
		padding: 8px;
	}
}
</style>
