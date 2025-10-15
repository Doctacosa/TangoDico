<script setup lang="ts">
import { ref } from 'vue';
import router from './router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

import { RouterLink, RouterView } from 'vue-router'
//import HelloWorld from './components/HelloWorld.vue'

const navItems = ref([
	{
		label: t("nav.home"),
		//icon: 'pi pi-link',
		command: () => {
			router.push('/');
		}
	},
	{
		label: t("nav.about"),
		//icon: 'pi pi-link',
		command: () => {
			router.push('/about');
		}
	},
]);

</script>


<template>
	<!--header>
		<h1>{{ t("nav.dictionary") }}</h1>
	</header-->

	<Menubar :model="navItems">
		<template #item="{ item, props }">
			<a :href="item.url" :target="item.target" v-bind="props.action">
				<!--span :class="item.icon" /-->
				<span>{{ item.label }}</span>
			</a>
		</template>
	</Menubar>

	<RouterView />

	<!--RouterLink to="/">{{ t("nav.home") }}</RouterLink-->
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

.p-menubar {
	margin-bottom: 25px;

	a:hover {
		color: unset;
		text-decoration: unset;
	}

	a {
		color: unset;
	}
}
</style>
