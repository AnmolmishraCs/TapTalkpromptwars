const SETS = {
  en: {
    morning: ['Good morning', 'I am hungry', 'Please help me get dressed'],
    afternoon: ['Good afternoon', 'I am hungry', 'I want to rest'],
    evening: ['Good evening', 'I am hungry', 'Can we go out'],
    night: ['Good night', 'I want to sleep', 'I need my medicine'],
  },
  hi: {
    morning: ['सुप्रभात', 'मुझे भूख लगी है', 'कृपया कपड़े पहनने में मेरी मदद कीजिए'],
    afternoon: ['शुभ दोपहर', 'मुझे भूख लगी है', 'मुझे आराम करना है'],
    evening: ['शुभ संध्या', 'मुझे भूख लगी है', 'क्या हम बाहर चल सकते हैं'],
    night: ['शुभ रात्रि', 'मुझे सोना है', 'मुझे अपनी दवाई चाहिए'],
  },
}

export const partOfDay = hour => (hour < 5 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night')

export const contextPhrases = (date, lang) => SETS[lang][partOfDay(date.getHours())]

export function frequent(history, lang, n = 2) {
  const counts = new Map()
  for (const h of history) if (h.l === lang) counts.set(h.t, (counts.get(h.t) || 0) + 1)
  return [...counts].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t)
}
