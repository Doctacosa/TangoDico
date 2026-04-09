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
	'word': StrOrNull,
};


const displayWord = ref< Tenses >();
//const wordData = ref< MatchType >();


async function getWord(id: number) {
	if (id == 0)
		return null;

	const SQL = await initSqlJs({
		locateFile: file => `https://sql.js.org/dist/${file}`
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
		'word': wordData.kana,
	};

	if (wordData.type == "v") {
		if (wordData.subtype == "ru") {
			tenses = {
				'affirmative': {
					'present': {
						'formal': root + "ます",
						'informal': wordData.kana,
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
				//t-form
				't_form': root + "て",
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
				'word': wordData.kana,
			}

			if (wordData.kana.endsWith("う")) {
				tenses.negative.present.informal = changeEnding(wordData.kana, "う", "あ", "ない");
				tenses.negative.present.informal = tenses.negative.present.informal.substring(0, tenses.negative.present.informal.length-3) + "わない";

				tenses.negative.past.informal = changeEnding(wordData.kana, "う", "あ", "なかった");
				tenses.negative.past.informal = tenses.negative.past.informal.substring(0, tenses.negative.past.informal.length-5) + "わなかった";
			} else {
				tenses.negative.present.informal = changeEnding(wordData.kana, "う", "あ", "ない");
				tenses.negative.past.informal = changeEnding(wordData.kana, "う", "あ", "なかった");
			}

			//t-form
			if (ending1 == "う" || ending1 == "つ" || ending1 == "る")
				tenses.t_form = root + "って";
			else if (ending1 == "む" || ending1 == "ぶ" || ending1 == "ぬ")
				tenses.t_form = root + "んで";
			else if (ending2 == "いく")
				tenses.t_form = root + "って";
			else if (ending1 == "く")
				tenses.t_form = root + "いて";
			else if (ending1 == "ぐ")
				tenses.t_form = root + "いで";
			else if (ending1 == "す")
				tenses.t_form = root + "して";
			else
				tenses.t_form = null;

			//Add past informal affirmative form
			if (tenses.t_form && tenses.t_form.endsWith("て"))
				tenses.affirmative.past.informal = tenses.t_form.substring(0, tenses.t_form.length-1) + "た";
			else if (tenses.t_form && tenses.t_form.endsWith("で"))
				tenses.affirmative.past.informal = tenses.t_form.substring(0, tenses.t_form.length-1) + "だ";

			//Final exceptions
			if (wordData.kana == "ある") {
				tenses.negative.present.informal = "ない";
				tenses.negative.past.informal = "なかった";
			}

		} else if (wordData.subtype == "irr") {
			//t-form
			if (wordData.kana.endsWith("する")) {
				tenses.affirmative = {
					'present': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "します",
						'informal': wordData.kana,
					},
					'past': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "しました",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "した",
					}
				}
				tenses.negative = {
					'present': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "しません",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "しない",
					},
					'past': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "しませんでした",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "しなかった",
					}
				}
				tenses.t_form = wordData.kana.substring(0, wordData.kana.length - 2) + "して";

			} else if (wordData.kana.endsWith("くる")) {
				tenses.affirmative = {
					'present': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "きます",
						'informal': wordData.kana,
					},
					'past': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "きました",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "きた",
					}
				}
				tenses.negative = {
					'present': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "きません",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "こない",
					},
					'past': {
						'formal': wordData.kana.substring(0, wordData.kana.length - 2) + "きました",
						'informal': wordData.kana.substring(0, wordData.kana.length - 2) + "こなかった",
					}
				}
				tenses.t_form = wordData.kana.substring(0, wordData.kana.length - 2) + "きて";
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
				wordBase = wordData.kana.substring(0, wordData.kana.length - 2) + "よ";
			} else {
				wordBase = wordData.kana.substring(0, wordData.kana.length - 1);
			}
			tenses = {
				'affirmative': {
					'present': {
						'formal': wordData.kana + "です",
						'informal': wordBase + "い",
					},
					'past': {
						'formal': wordData.kana + "かったです",
						'informal': wordBase + "かった",
					},
				},
				'negative': {
					'present': {
						'formal': wordBase + "くないです",
						'informal': wordBase + "くない",
					},
					'past': {
						'formal': wordBase + "くなかったです",
						'informal': wordBase + "くなかった",
					},
				},
				't_form': wordBase + "くて",
				'word': wordBase,
			};

			//Exception
			if (wordData.kana.endsWith("いい")) {
				tenses.word = wordData.kana;
				tenses.affirmative.present.formal = wordData.kana + "です";
				tenses.affirmative.present.informal = wordData.kana;
			}

		} else if (wordData.subtype == "na") {
			const wordBase = wordData.kana.replace("（な）", "");
			tenses = {
				'affirmative': {
					'present': {
						'formal': wordBase + "です",
						'informal': wordBase + "だ",
					},
					'past': {
						'formal': wordBase + "でした",
						'informal': wordBase + "だった",
					},
				},
				'negative': {
					'present': {
						'formal': wordBase + "じゃないです",
						'informal': wordBase + "じゃない",
					},
					'past': {
						'formal': wordBase + "じゃなかったです",
						'informal': wordBase + "じゃなかった",
					},
				},
				't_form': wordBase + "で",
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
					'formal': wordData.kana + "です",
					'informal': wordData.kana + "だ",
				},
				'past': {
					'formal': wordData.kana + "でした",
					'informal': wordData.kana + "だった",
				},
			},
			'negative': {
				'present': {
					'formal': wordData.kana + "じゃないです",
					'informal': wordData.kana + "じゃない",
				},
				'past': {
					'formal': wordData.kana + "じゃなかったです",
					'informal': wordData.kana + "じゃなかった",
				},
			},
			't_form': wordData.kana + "で",
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

	return tenses;
}


//Change the ending of a verb based on predefined rules
function changeEnding(source: string, from: string, to: string, suffix: string) {
	let result = source;
	const root = source.substring(0, source.length-1);
	const ending = source.substring(source.length-1);

	if (to == "あ") {
		if (ending == "う")			result = root + "あ";
		else if (ending == "く")	result = root + "か";
		else if (ending == "す")	result = root + "さ";
		else if (ending == "つ")	result = root + "た";
		else if (ending == "ぬ")	result = root + "な";
		else if (ending == "ふ")	result = root + "は";
		else if (ending == "む")	result = root + "ま";
		else if (ending == "る")	result = root + "ら";
		else if (ending == "ぐ")	result = root + "が";
		else if (ending == "ぶ")	result = root + "ば";
	} else if (to == "い") {
		if (ending == "う")			result = root + "い";
		else if (ending == "く")	result = root + "き";
		else if (ending == "す")	result = root + "し";
		else if (ending == "つ")	result = root + "ち";
		else if (ending == "ぬ")	result = root + "に";
		else if (ending == "ふ")	result = root + "ひ";
		else if (ending == "む")	result = root + "み";
		else if (ending == "る")	result = root + "り";
		else if (ending == "ぐ")	result = root + "ぎ";
		else if (ending == "ぶ")	result = root + "び";
	}

	if (suffix != null)
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

		<h2>{{ t('nav.conjugation') }}</h2>

		<template v-if="displayWord">

			<p v-if="displayWord.word">Infinitif / dictionnaire: {{ displayWord.word }}</p>
			<p v-if="displayWord.t_form">Forme en -te: {{ displayWord.t_form }}</p>

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
						<td v-if="displayWord.affirmative && displayWord.affirmative.present && displayWord.affirmative.present.formal">
							{{ displayWord.affirmative.present.formal }}
						</td>
						<td v-if="displayWord.negative && displayWord.negative.present && displayWord.negative.present.formal">
							{{ displayWord.negative.present.formal }}
						</td>
					</tr>
					<tr>
						<td v-if="displayWord.affirmative && displayWord.affirmative.present && displayWord.affirmative.present.informal">
							{{ displayWord.affirmative.present.informal }}
						</td>
						<td v-if="displayWord.negative && displayWord.negative.present && displayWord.negative.present.informal">
							{{ displayWord.negative.present.informal }}
						</td>
					</tr>
					<tr>
						<td rowspan="2">Passé</td>
						<td v-if="displayWord.affirmative && displayWord.affirmative.past && displayWord.affirmative.past.formal">
							{{ displayWord.affirmative.past.formal }}
						</td>
						<td v-if="displayWord.negative && displayWord.negative.past && displayWord.negative.past.formal">
							{{ displayWord.negative.past.formal }}
						</td>
					</tr>
					<tr>
						<td v-if="displayWord.affirmative && displayWord.affirmative.past && displayWord.affirmative.past.informal">
							{{ displayWord.affirmative.past.informal }}
						</td>
						<td v-if="displayWord.negative && displayWord.negative.past && displayWord.negative.past.informal">
							{{ displayWord.negative.past.informal }}
						</td>
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
