<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import initSqlJs from 'sql.js';
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })


type MatchType = {
	id: number,
	numbers: string[],
	how_many: string,
}

type NumberEntryType = {
	position: number,
	value: string,
}

const listNumbers = ref< MatchType | null >();
const wordType = ref< string >();


async function getWord(type: string) {
	if (type == "")
		return null;

	const SQL = await initSqlJs({
		locateFile: () => `/sql-wasm.wasm`
	});

	const response = await fetch('/jpdict.db');	//Path relative to public/
	const buffer = await response.arrayBuffer();
	const db = new SQL.Database(new Uint8Array(buffer));


	//Get the expected match
	const sql = `
		SELECT *
		FROM numbers
		WHERE numbers.type = ?
		ORDER BY position ASC
	`;
	const stmt = db.prepare(sql);
	stmt.bind([type]);

	const result: MatchType = {
		id: 0,
		numbers: {},
		how_many: "",
	};
	while (stmt.step()) {
		const entry: NumberEntryType = stmt.getAsObject() as NumberEntryType;
		if (entry.position == 0)
			result.how_many = entry.value;
		else
			result.numbers[entry.position] = entry.value;
	}
	return result;
}


const bases: {[id: number]: string} = {
	1: 'いち',
	2: 'に',
	3: 'さん',
	4: 'よん',
	5: 'ご',
	6: 'ろく',
	7: 'なな',
	8: 'はち',
	9: 'きゅう',
	10: 'じゅう',
}


watch(locale, () => {
});


onMounted(async () => {
	//const urlPath = "あける-19";
	const route = useRoute();
	const urlPath = route.params.id.toString();
	//TODO: Display error on word not found
	wordType.value = urlPath;
	if (!wordType)
		return;

	listNumbers.value = await getWord(wordType.value);
});
</script>


<template>
	<div>
		<template v-if="listNumbers">
			<h2>
				{{ t("number_page." + wordType + ".title") }}
			</h2>
			<p>{{ t("number_page." + wordType + ".description") }}</p>

		</template>


		<h3>{{ t('nav.number') }}</h3>

		<table v-if="listNumbers && listNumbers.numbers">
			<tbody>
				<tr v-for="value, key in listNumbers.numbers">
					<td>{{ key }}</td>
					<td>
						{{ listNumbers.numbers[key] }}
					</td>
				</tr>
				<tr v-if="listNumbers.how_many">
					<td>{{ t('counter_page.how_many') }}</td>
					<td>{{ listNumbers.how_many }}</td>
				</tr>
			</tbody>
		</table>

	</div>
</template>


<style>
table {
	margin-left: auto;
	margin-right: auto;

	td {
		font-size: 110%;
		padding: 4px;
	}
}


label {
	display: inline-block;
	padding: 4px;
}
</style>
