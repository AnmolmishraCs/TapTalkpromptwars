export const EMOTIONS = {
  neutral: { rate: 0.95, pitch: 1, volume: 1, style: 'Read this clearly and naturally' },
  happy: { rate: 1.05, pitch: 1.25, volume: 1, style: 'Say cheerfully' },
  excited: { rate: 1.15, pitch: 1.4, volume: 1, style: 'Say with excitement' },
  sad: { rate: 0.8, pitch: 0.8, volume: 0.8, style: 'Say sadly, softly and slowly' },
  angry: { rate: 1.05, pitch: 0.85, volume: 1, style: 'Say in an angry, firm voice' },
  calm: { rate: 0.85, pitch: 0.95, volume: 0.85, style: 'Say calmly and gently' },
  urgent: { rate: 1.2, pitch: 1.15, volume: 1, style: 'Say urgently, as if help is needed right now' },
}

const RULES = [
  ['happy', /\b(happy|love|thank|thanks|great|wonderful|glad|welcome|congratulations|good morning|birthday|delicious)\b|खुश|प्यार|धन्यवाद|शुक्रिया|बधाई|सुप्रभात|स्वादिष्ट/i],
  ['urgent', /\b(help|emergency|ambulance|police|fire|accident|urgent|hurry|can(?:not|'t) breathe)\b|मदद|एम्बुलेंस|पुलिस|आग|दुर्घटना|जल्दी/i],
  ['angry', /\b(angry|furious|leave me alone|go away|enough)\b|गुस्सा|दूर जाओ|बस करो/i],
  ['sad', /\b(sad|sorry|miss you|lonely|cry|pain|hurt|sick|dizzy|headache|scared)\b|उदास|माफ़|याद|दर्द|बीमार|चक्कर|डर|अकेलापन/i],
  ['calm', /\b(calm|relax|slowly|good night|rest|sleep|please wait)\b|शांत|धीरे|शुभ रात्रि|आराम|सोना|रुकिए/i],
]

export function emotionOf(text) {
  for (const [emotion, pattern] of RULES) if (pattern.test(text)) return emotion
  return /!\s*$/.test(text) ? 'excited' : 'neutral'
}
