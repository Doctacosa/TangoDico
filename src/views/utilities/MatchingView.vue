<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
//import { useI18n } from 'vue-i18n'

//const { t, locale } = useI18n({ useScope: 'global' })

import * as wanakana from 'wanakana';
//import { toKana, isRomaji } from 'wanakana';

const input = ref("1	École 日本語 にほんご	fake\n1	あいかわらず	相変わらず	adv		adv.	22	読L22-II	あいかわらす | 相変わらす");
const output = ref("Output...");


//Generate the meaning of a word
async function generateMeaning() {
	let result = '';

	//Identify the number of tabs per line
	const lines = input.value.split("\n");
	const mode = [...lines[0].matchAll(/\t/g)].length;

	for (const x in lines) {
		const line = lines[x].split("\t");
		let matching = '';
		if (mode == 2) {
			//2 tabs = language list

			//Normalize string
			matching = line[1].toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
			
			//Add romaji
			if (matching != wanakana.toRomaji(matching))
				matching = matching + "|" + wanakana.toRomaji(matching);

			if (matching != '')
				result += "UPDATE **table** SET matching = \"" + matching + "\" WHERE id = " + line[0] + ";\n";

		} if (mode == 8) {
			//8 tabs = main words list

			//Normalize string
			matching = line[1].toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "") + "|" + wanakana.toRomaji(line[1]);
			if (line[2] != line[1])
				matching += "|" + line[2].toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "") + "|" + wanakana.toRomaji(line[2]);

			if (matching != line[7])
				result += "UPDATE **table** SET matching = \"" + matching + "\" WHERE id = " + line[0] + ";\n";
		}

	}

	output.value = result;
}


//Monitor locale change to refresh results
watch(input, () => {
	generateMeaning();
});


onMounted(async () => {
	generateMeaning();
});
</script>


<template>
	<div>

		<div class="about">
			<h2>Matching</h2>

			<textarea v-model="input"></textarea>

			<textarea v-model="output"></textarea>

			<!--div class="app_mode">App mode</div-->
		</div>
	</div>
</template>


<style>
textarea {
	width: 100%;
	min-height: 300px;
}
</style>
