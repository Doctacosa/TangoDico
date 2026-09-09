<script setup lang="ts">
//import HelloWorld from './components/HelloWorld.vue'

import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import initSqlJs from 'sql.js';
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n({ useScope: 'global' })


type MatchType = {
	id: number,
	kana: string,
	kanji: string,
	lesson: string,
	lesson_full: string,
	meaning: string,
	subtype: string,
	type: string,
	type_full: string,
}

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
	'potential': StrOrNull,
	'word': StrOrNull,
};


const displayWord = ref< Tenses >();
const sourceWord = ref< MatchType | null >();


async function getWord(id: number) {
	if (id == 0)
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
		FROM words
		INNER JOIN words__` + locale.value + ` AS words_lang
		ON words.id = words_lang.id
		WHERE words.id = ?
	`;
	const stmt = db.prepare(sql);
	stmt.bind([id]);

	if (stmt.step()) {
		return stmt.getAsObject() as MatchType;
	} else {
		return null;
	}
}


function getConjugation(wordData: MatchType | null) {
	//TODO: Kanji and/or kana toggle

	sourceWord.value = wordData;

	if (!wordData)
		return;

	const root = wordData.kana.substring(0, wordData.kana.length-1);
	const ending1 = wordData.kana.substring(wordData.kana.length-1);
	const ending2 = wordData.kana.substring(wordData.kana.length-2);
	let tenses: Tenses = {
		'affirmative': {
			'present': {
				'formal': null,
				'informal': null,
			},
			'past': {
				'formal': null,
				'informal': null,
			},
		},
		'negative': {
			'present': {
				'formal': null,
				'informal': null,
			},
			'past': {
				'formal': null,
				'informal': null,
			},
		},
		't_form': null,
		'potential': null,
		'word': wordData.kana,
	};

	if (wordData.type == "v") {
		if (wordData.subtype == "ru") {
			tenses = {
				'affirmative': {
					'present': {
						'formal': root + "*ます",
						'informal': wordData.kana,
					},
					'past': {
						'formal': root + "*ました",
						'informal': root + "*た",
					},
				},
				'negative': {
					'present': {
						'formal': root + "*ません",
						'informal': root + "*ない",
					},
					'past': {
						'formal': root + "*ませんでした",
						'informal': root + "*なかった",
					},
				},
				//t-form
				't_form': root + "*て",
				'potential': changeEnding(wordData.kana, "る", "potential"),
				'word': wordData.kana,
			}

		} else if (wordData.subtype == "u") {
			tenses = {
				'affirmative': {
					'present': {
						'formal': changeEnding(wordData.kana, "う", "い", "ます"),
						'informal': wordData.kana,
					},
					'past': {
						'formal': changeEnding(wordData.kana, "う", "い", "ました"),
						'informal': null,
					},
				},
				'negative': {
					'present': {
						'formal': changeEnding(wordData.kana, "う", "い", "ません"),
						'informal': null,
					},
					'past': {
						'formal': changeEnding(wordData.kana, "う", "い", "ませんでした"),
						'informal': null,
					},
				},
				//t-form
				't_form': root + "て",
				'potential': changeEnding(wordData.kana, "う", "potential"),
				'word': wordData.kana,
			}

			if (wordData.kana.endsWith("う")) {
				tenses.negative.present.informal = changeEnding(wordData.kana, "う", "あ", "ない");
				tenses.negative.present.informal = tenses.negative.present.informal.substring(0, tenses.negative.present.informal.length-3) + "わない";

				tenses.negative.past.informal = changeEnding(wordData.kana, "う", "あ", "*なかった");
				tenses.negative.past.informal = tenses.negative.past.informal.substring(0, tenses.negative.past.informal.length-6) + "わなかった";
			} else {
				tenses.negative.present.informal = changeEnding(wordData.kana, "う", "あ", "ない");
				tenses.negative.past.informal = changeEnding(wordData.kana, "う", "あ", "なかった");
			}

			//t-form
			if (ending1 == "う" || ending1 == "つ" || ending1 == "る")
				tenses.t_form = root + "*って";
			else if (ending1 == "む" || ending1 == "ぶ" || ending1 == "ぬ")
				tenses.t_form = root + "*んで";
			else if (ending2 == "いく")
				tenses.t_form = root + "*って";
			else if (ending1 == "く")
				tenses.t_form = root + "*いて";
			else if (ending1 == "ぐ")
				tenses.t_form = root + "*いで";
			else if (ending1 == "す")
				tenses.t_form = root + "*して";
			else
				tenses.t_form = null;

			//Add past informal affirmative form
			if (tenses.t_form && tenses.t_form.endsWith("て"))
				tenses.affirmative.past.informal = tenses.t_form.replace("*", "").substring(0, tenses.t_form.replace("*", "").length-1) + "*た";
			else if (tenses.t_form && tenses.t_form.endsWith("で"))
				tenses.affirmative.past.informal = tenses.t_form.replace("*", "").substring(0, tenses.t_form.replace("*", "").length-1) + "*だ";

			//Final exceptions
			if (wordData.kana == "ある") {
				tenses.negative.present.informal = "ない";
				tenses.negative.past.informal = "なかった";
			}
			if (wordData.kana == "わかる")
				tenses.potential = "わかる";

		} else if (wordData.subtype == "irr") {
			//t-form
			if (wordData.kana.endsWith("する")) {
				tenses.affirmative = {
					'present': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "*します",
						'informal': wordData.kana,
					},
					'past': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "*しました",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "*した",
					}
				}
				tenses.negative = {
					'present': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "*しません",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "*しない",
					},
					'past': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "*しませんでした",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "*しなかった",
					}
				}
				tenses.t_form = wordData.kana.substring(0, wordData.kana.length - 2) + "*して";
				tenses.potential = wordData.kana.substring(0, wordData.kana.length - 2) + "*できる";

			} else if (wordData.kana.endsWith("くる")) {
				tenses.affirmative = {
					'present': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "*きます",
						'informal': wordData.kana,
					},
					'past': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "*きました",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "*きた",
					}
				}
				tenses.negative = {
					'present': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "*きません",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "*こない",
					},
					'past': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "*きました",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "*こなかった",
					}
				}
				tenses.t_form = wordData.kana.substring(0, wordData.kana.length - 2) + "*きて";
				tenses.potential = wordData.kana.substring(0, wordData.kana.length - 2) + "*こられる";
			}
		} else {
			console.log("Unknown subtype: " + wordData.subtype);
			return tenses;
		}

	} else if (wordData.type == "adj") {
		if (wordData.subtype == "i") {
			//いい exception
			let wordBase = null;
			if (wordData.kana.endsWith("いい")) {
				//TODO: Mark the よ replacement?
				wordBase = wordData.kana.substring(0, wordData.kana.length - 2) + "よ";
			} else {
				wordBase = wordData.kana.substring(0, wordData.kana.length - 1);
			}
			tenses = {
				'affirmative': {
					'present': {
						'formal': wordData.kana + "*です",
						'informal': wordBase + "*い",
					},
					'past': {
						'formal': wordData.kana + "*かったです",
						'informal': wordBase + "*かった",
					},
				},
				'negative': {
					'present': {
						'formal': wordBase + "*くないです",
						'informal': wordBase + "*くない",
					},
					'past': {
						'formal': wordBase + "*くなかったです",
						'informal': wordBase + "*くなかった",
					},
				},
				't_form': wordBase + "*くて",
				'potential': null,
				'word': wordBase,
			};

			//Exception
			if (wordData.kana.endsWith("いい")) {
				tenses.word = wordData.kana;
				tenses.affirmative.present.formal = wordData.kana + "*です";
				tenses.affirmative.present.informal = wordData.kana;
			}

		} else if (wordData.subtype == "na") {
			const wordBase = wordData.kana.replace("（な）", "");
			tenses = {
				'affirmative': {
					'present': {
						'formal': wordBase + "*です",
						'informal': wordBase + "*だ",
					},
					'past': {
						'formal': wordBase + "*でした",
						'informal': wordBase + "*だった",
					},
				},
				'negative': {
					'present': {
						'formal': wordBase + "*じゃないです",
						'informal': wordBase + "*じゃない",
					},
					'past': {
						'formal': wordBase + "*じゃなかったです",
						'informal': wordBase + "*じゃなかった",
					},
				},
				't_form': wordBase + "*で",
				'potential': null,
				'word': wordBase,
			};

		} else {
			console.log("Unknown subtype: " + wordData.subtype);
			return tenses;
		}

	} else if (wordData.type == "n") {
		tenses = {
			'affirmative': {
				'present': {
					'formal': wordData.kana + "*です",
					'informal': wordData.kana + "*だ",
				},
				'past': {
					'formal': wordData.kana + "*でした",
					'informal': wordData.kana + "*だった",
				},
			},
			'negative': {
				'present': {
					'formal': wordData.kana + "*じゃないです",
					'informal': wordData.kana + "*じゃない",
				},
				'past': {
					'formal': wordData.kana + "*じゃなかったです",
					'informal': wordData.kana + "*じゃなかった",
				},
			},
			't_form': wordData.kana + "*で",
			'potential': null,
			'word': wordData.kana,
		};

	} else {
		console.log("Unknown type: " + wordData.type);
		return tenses;
	}


	//Catch errors on t-form
	if (tenses.t_form == null) {
		console.log("Unknown t-form: " + wordData.subtype);
	}

	tenses.word = wordData.kana;

	//Return the list with flagged changes
	return flagChanges(tenses, wordData.kana);
}


//Flag all the changed forms
function flagChanges(tenses: Tenses, word: string) {
	//for (const key of Object.keys(tenses) as (keyof Tenses)[]) {
		for (const key in tenses) {
		// @ts-expect-error Ignore warning on `tenses[key]`
		const match = tenses[key];
		if (typeof match == "string") {
			if (match.includes("*"))
				// @ts-expect-error Ignore warning on `tenses[key]`
			tenses[key] = match.replace("*", "<u>") + "</u>";
			// @ts-expect-error Ignore warning on `tenses[key]`
			if (!tenses[key].includes("<u>") && tenses[key] != word)
				// @ts-expect-error Ignore warning on `tenses[key]`
				tenses[key] = "<u>" + tenses[key] + "</u>";
		} else if (typeof match == "object") {
			// @ts-expect-error Ignore warning on `tenses[key]`
			tenses[key] = flagChanges(match, word);
		} else {
			console.log("Unknown type " + typeof match + " on " + match);
		}
	}

	return tenses;
}


//Change the ending of a verb based on predefined rules
function changeEnding(source: string, from: string, to: string, suffix: string = "") {
	let result = source;
	const root = source.substring(0, source.length-1);
	const ending = source.substring(source.length-1);

	if (to == "あ") {
		if (ending == "う")			result = root + "*あ";
		else if (ending == "く")	result = root + "*か";
		else if (ending == "す")	result = root + "*さ";
		else if (ending == "つ")	result = root + "*た";
		else if (ending == "ぬ")	result = root + "*な";
		else if (ending == "ふ")	result = root + "*は";
		else if (ending == "む")	result = root + "*ま";
		else if (ending == "る")	result = root + "*ら";
		else if (ending == "ぐ")	result = root + "*が";
		else if (ending == "ぶ")	result = root + "*ば";
	} else if (to == "い") {
		if (ending == "う")			result = root + "*い";
		else if (ending == "く")	result = root + "*き";
		else if (ending == "す")	result = root + "*し";
		else if (ending == "つ")	result = root + "*ち";
		else if (ending == "ぬ")	result = root + "*に";
		else if (ending == "ふ")	result = root + "*ひ";
		else if (ending == "む")	result = root + "*み";
		else if (ending == "る")	result = root + "*り";
		else if (ending == "ぐ")	result = root + "*ぎ";
		else if (ending == "ぶ")	result = root + "*び";
	} else if (to == "potential") {
		if (from == "る")			result = root + "*られる";
		else if (ending == "う")	result = root + "*える";
		else if (ending == "く")	result = root + "*ける";
		else if (ending == "す")	result = root + "*せる";
		else if (ending == "つ")	result = root + "*てる";
		else if (ending == "ぬ")	result = root + "*ねる";
		else if (ending == "ふ")	result = root + "*へる";
		else if (ending == "む")	result = root + "*める";
		else if (ending == "る")	result = root + "*れる";
		else if (ending == "ぐ")	result = root + "*げる";
		else if (ending == "ぶ")	result = root + "*べる";
	}

	if (suffix != null && suffix != "")
		result += suffix;

	return result;
}


//Monitor word data change to refresh results
/*
watch(wordData, () => {
	getConjugation();
});
*/
watch(locale, () => {
	//getConjugation();
});


onMounted(async () => {
	//const urlPath = "あける-19";
	const route = useRoute();
	const urlPath = route.params.id.toString();
	//TODO: Display error on word not found
	if (!urlPath.includes("-"))
		return;
	const wordId = parseInt(urlPath.substring(urlPath.lastIndexOf("-")+1));
	if (!wordId)
		return;

	displayWord.value = getConjugation(await getWord(wordId));
});
</script>


<template>
	<div>

		<template v-if="sourceWord">
			<h2 v-if="sourceWord.kana != sourceWord.kanji && sourceWord.kanji != null">
				{{ sourceWord.kanji }} | {{ sourceWord.kana }}
			</h2>
			<h2 v-else>
				{{ sourceWord.kana }}
			</h2>
			<h3 style="text-transform: none;">{{ sourceWord.meaning }}</h3>
			<div>{{ t("word_type." + sourceWord.type) }} <span v-if="sourceWord.subtype">({{ sourceWord.subtype }})</span></div>
			<div>{{ t("search.lesson") }} {{ sourceWord.lesson }}</div>

		</template>


		<h3>{{ t('nav.conjugation') }}</h3>

		<template v-if="displayWord">

			<p v-if="displayWord.word">
				{{ t('word_page.infinitive') }}:
				<span v-html="displayWord.word"></span>
			</p>
			<p v-if="displayWord.t_form">
				{{ t('word_page.t_form') }}:
				<span v-html="displayWord.t_form"></span>
			</p>
			<p v-if="displayWord.potential">
				{{ t('word_page.potential') }}:
				<span v-html="displayWord.potential"></span>
			</p>

			<table v-if="Object.keys(displayWord).length">
				<thead>
					<tr>
						<th></th>
						<th>{{ t('word_page.positive') }}</th>
						<th>{{ t('word_page.negative') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td rowspan="2">{{ t('word_page.present') }}</td>
						<td
							v-if="displayWord.affirmative && displayWord.affirmative.present && displayWord.affirmative.present.formal"
							v-html="displayWord.affirmative.present.formal"
						></td>
						<td
							v-if="displayWord.negative && displayWord.negative.present && displayWord.negative.present.formal"
							v-html="displayWord.negative.present.formal"
						></td>
					</tr>
					<tr>
						<td
							v-if="displayWord.affirmative && displayWord.affirmative.present && displayWord.affirmative.present.informal"
							v-html="displayWord.affirmative.present.informal"
						></td>
						<td
							v-if="displayWord.negative && displayWord.negative.present && displayWord.negative.present.informal"
							v-html="displayWord.negative.present.informal"
						></td>
					</tr>
					<tr>
						<td rowspan="2">{{ t('word_page.past') }}</td>
						<td
							v-if="displayWord.affirmative && displayWord.affirmative.past && displayWord.affirmative.past.formal"
							v-html="displayWord.affirmative.past.formal"
						></td>
						<td
							v-if="displayWord.negative && displayWord.negative.past && displayWord.negative.past.formal"
							v-html="displayWord.negative.past.formal"
						></td>
					</tr>
					<tr>
						<td
							v-if="displayWord.affirmative && displayWord.affirmative.past && displayWord.affirmative.past.informal"
							v-html="displayWord.affirmative.past.informal"
						></td>
						<td
							v-if="displayWord.negative && displayWord.negative.past && displayWord.negative.past.informal"
							v-html="displayWord.negative.past.informal"
						></td>
					</tr>
				</tbody>
			</table>

		</template>

	</div>
</template>


<style>
table {
	margin: 0 auto;
	border-collapse: collapse;

	th {
		background-color: #6a462e77;
	}

	th, td {
		padding: 6px;
		border: 1px solid #6a462e77;
	}
}
</style>
