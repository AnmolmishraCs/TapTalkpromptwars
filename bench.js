import { bench, TASKS } from './public/predict.js'

const names = { A: 'Words', B: 'Phrases', C: 'Personal', D: 'Adaptive' }

for (const lang of Object.keys(TASKS)) {
  const res = bench(lang)
  console.log(`\n${lang}: actions per task (in brackets: change versus typing every letter)`)
  console.table(
    Object.fromEntries(
      TASKS[lang].map((t, i) => [
        t.name,
        Object.fromEntries(Object.keys(names).map(k => [`${k} ${names[k]}`, `${res[k][i].effort} (${-res[k][i].saved})`])),
      ])
    )
  )
}
