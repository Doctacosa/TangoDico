<script setup lang="ts">
import { ref } from 'vue';
import router from './router'
import { useI18n } from 'vue-i18n'

const { t, availableLocales } = useI18n({ useScope: 'global' })

import { /* RouterLink,*/ RouterView } from 'vue-router'
//import HelloWorld from './components/HelloWorld.vue'

//Build navigation options
type NavItemType = {
	label: string;
	//icon?: string;
	url?: string;
	target?: string;
	command: () => void;
};

const navItems = ref< NavItemType[] >([
	{
		label: "nav.home",
		//icon: 'pi pi-link',
		command: () => {
			router.push('/');
		}
	},
	{
		label: "nav.about",
		//icon: 'pi pi-link',
		command: () => {
			router.push('/about');
		}
	},
]);

//Get available locales
const locales = [];
for (const x in availableLocales) {
	const locale = availableLocales[x];
	locales.push({
		label: locale.toUpperCase(),
		value: locale,
	});
}
</script>


<template>
	<!--header>
		<h1>{{ t("nav.dictionary") }}</h1>
	</header-->

	<Menubar :model="navItems">
		<template #item="{ item, props }">
			<a :href="item.url" :target="item.target" v-bind="props.action">
				<!--span :class="item.icon" /-->
				<span>{{ t(String(item.label)) }}</span>
			</a>
		</template>
		<template #end>
			<img src="@/assets/language.svg" alt="Language" />
			<Select
				v-model="$i18n.locale"
				:options="locales"
				optionLabel="label"
				optionValue="value"
			></Select>
		</template>
	</Menubar>

	<RouterView 
		v-slot="{ Component }"
	>
		<Transition name="fade" mode="out-in">
			<Component :is="Component" />
		</Transition>
	</RouterView>

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

	img {
		max-height: 24px;
		vertical-align: middle;
		margin-right: 6px;
	}

	a:hover {
		color: unset;
		text-decoration: unset;
	}

	a {
		color: unset;
	}
}

.fade-enter-active, .fade-leave-active {
	transition: opacity 0.2s;
}
.fade-enter, .fade-leave-to {
	opacity: 0;
}
</style>
