<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })


type StrOrNull = string | null;

type Tenses = {
	'affirmative': {
		'present': {
			'formal': StrOrNull,
			'informal': StrOrNull,
		},
		'past': {
			'formal': StrOrNull,
			'informal': StrOrNull,
		},
	},
	'negative': {
		'present': {
			'formal': StrOrNull,
			'informal': StrOrNull,
		},
		'past': {
			'formal': StrOrNull,
			'informal': StrOrNull,
		},
	},
	't_form': StrOrNull,
	'word': StrOrNull,
};


const displayWord = ref< Tenses >();
const ready = ref(false);


function getConjugation(verb: string, type: string, subtype: string) {
	//TODO: Check verb form
	//TODO: Kanji and/or kana
	//... or even if it's a verb in the first place

	const root = verb.substring(0, verb.length-1);
	const tenses = {
		'affirmative': {
			'present': {
				'formal': root + "ます",
				'informal': verb,
			},
			'past': {
				'formal': root + "ました",
				'informal': root + "た",
			},
		},
		'negative': {
			'present': {
				'formal': root + "ません",
				'informal': root + "ない",
			},
			'past': {
				'formal': root + "ませんでした",
				'informal': root + "なかった",
			},
		},
		't_form': "",
		'word': "",
	}

	return tenses;
}


onMounted(async () => {
	displayWord.value = getConjugation("あける", "verb", "ru");
	ready.value = true;
});
</script>


<template>
	<div v-if="displayWord">

		<h2>{{ t('nav.conjugation') }}</h2>

		<p>Infinitif / dictionnaire: [WIP]</p>
		<p>Forme en -te: [WIP]</p>

		<table v-if="Object.keys(displayWord).length">
			<thead>
				<tr>
					<th></th>
					<th>Affirmatif</th>
					<th>Négatif</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td rowspan="2">Non-passé</td>
					<td>{{ displayWord.affirmative.present.formal }}</td>
					<td>{{ displayWord.negative.present.formal }}</td>
				</tr>
				<tr>
					<td>{{ displayWord.affirmative.present.informal }}</td>
					<td>{{ displayWord.negative.present.informal }}</td>
				</tr>
				<tr>
					<td rowspan="2">Passé</td>
					<td>{{ displayWord.affirmative.past.formal }}</td>
					<td>{{ displayWord.negative.past.formal }}</td>
				</tr>
				<tr>
					<td>{{ displayWord.affirmative.past.informal }}</td>
					<td>{{ displayWord.negative.past.informal }}</td>
				</tr>
			</tbody>
		</table>

	</div>
</template>


<style>
</style>
