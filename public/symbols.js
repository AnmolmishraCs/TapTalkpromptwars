const s = (id, en, hi, sayEn, sayHi, d) => ({ id, en, hi, say: { en: sayEn, hi: sayHi }, d })

export const SYMBOLS = [
  s('water', 'Water', 'पानी', 'I want some water', 'मुझे पानी चाहिए', '<path d="M12 8h24l-3 32H15z"/><path d="M14.5 20h19"/>'),
  s('food', 'Food', 'खाना', 'I am hungry', 'मुझे भूख लगी है', '<path d="M7 13c11-7 23-7 34 0L24 43z"/><circle class="dot" cx="19" cy="18" r="2.5"/><circle class="dot" cx="29" cy="20" r="2.5"/><circle class="dot" cx="24" cy="30" r="2.5"/>'),
  s('toilet', 'Toilet', 'शौचालय', 'I need to use the bathroom', 'मुझे शौचालय जाना है', '<path d="M15 6h18v14H15z"/><path d="M9 22h30c0 10-6 16-15 16S9 32 9 22z"/><path d="M19 38l-2 6M29 38l2 6"/>'),
  s('pain', 'Pain', 'दर्द', 'I am in pain', 'मुझे दर्द हो रहा है', '<path d="M27 4L11 27h11l-4 17 19-25H26z"/>'),
  s('help', 'Help', 'मदद', 'I need help', 'मुझे मदद चाहिए', '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="6"/><path d="M12 12l7 7M36 12l-7 7M12 36l7-7M36 36l-7-7"/>'),
  s('medicine', 'Medicine', 'दवाई', 'I need my medicine', 'मुझे अपनी दवाई चाहिए', '<g transform="rotate(-40 24 24)"><rect x="5" y="15" width="38" height="18" rx="9"/><path d="M24 15v18"/></g>'),
  s('happy', 'Happy', 'खुश', 'I am happy', 'मैं खुश हूँ', '<circle cx="24" cy="24" r="18"/><path d="M15 28c2 7 16 7 18 0"/><circle class="dot" cx="17" cy="19" r="2"/><circle class="dot" cx="31" cy="19" r="2"/>'),
  s('sad', 'Sad', 'उदास', 'I am sad', 'मुझे उदासी लग रही है', '<circle cx="24" cy="24" r="18"/><path d="M16 34c2-6 14-6 16 0"/><circle class="dot" cx="17" cy="19" r="2"/><circle class="dot" cx="31" cy="19" r="2"/>'),
  s('tired', 'Tired', 'थकान', 'I am tired', 'मुझे थकान लग रही है', '<circle cx="24" cy="24" r="18"/><path d="M13 21h7M28 21h7"/><ellipse cx="24" cy="33" rx="3.5" ry="3"/>'),
  s('hot', 'Hot', 'गर्मी', 'I am hot', 'मुझे गर्मी लग रही है', '<circle cx="24" cy="24" r="8"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M10 38l4-4"/>'),
  s('cold', 'Cold', 'ठंड', 'I am cold', 'मुझे ठंड लग रही है', '<path d="M24 4v40M7 14l34 20M41 14L7 34"/>'),
  s('yes', 'Yes', 'हाँ', 'Yes', 'हाँ', '<circle cx="24" cy="24" r="18"/><path d="M14 25l7 7 13-15"/>'),
  s('no', 'No', 'नहीं', 'No', 'नहीं', '<circle cx="24" cy="24" r="18"/><path d="M16 16l16 16M32 16L16 32"/>'),
  s('wait', 'Wait', 'रुकिए', 'Please wait', 'कृपया रुकिए', '<path d="M12 6h24M12 42h24M14 6c0 10 10 12 10 18S14 32 14 42M34 6c0 10-10 12-10 18s10 8 10 18"/>'),
  s('stop', 'Stop', 'बस', 'Stop please', 'कृपया बस कीजिए', '<path d="M17 5h14l12 12v14L31 43H17L5 31V17z"/><path d="M14 24h20"/>'),
  s('home', 'Home', 'घर', 'I want to go home', 'मुझे घर जाना है', '<path d="M5 24L24 7l19 17"/><path d="M11 20v22h26V20"/><path d="M20 42V30h8v12"/>'),
  s('phone', 'Phone', 'फ़ोन', 'I need my phone', 'मुझे मेरा फ़ोन चाहिए', '<rect x="13" y="4" width="22" height="40" rx="5"/><path d="M21 38h6"/>'),
  s('music', 'Music', 'गाना', 'I want to listen to music', 'मुझे गाना सुनना है', '<path d="M8 30v-6a16 16 0 0132 0v6"/><rect x="5" y="28" width="9" height="14" rx="3"/><rect x="34" y="28" width="9" height="14" rx="3"/>'),
  s('tv', 'TV', 'टीवी', 'Please turn on the TV', 'कृपया टीवी चालू कीजिए', '<rect x="5" y="12" width="38" height="26" rx="4"/><path d="M16 43h16M18 5l6 7 6-7"/>'),
  s('sleep', 'Sleep', 'नींद', 'I want to sleep', 'मुझे सोना है', '<path d="M36 31A16 16 0 1117 9a13 13 0 0019 22z"/>'),
  s('doctor', 'Doctor', 'डॉक्टर', 'Please call the doctor', 'कृपया डॉक्टर को बुलाइए', '<circle cx="24" cy="24" r="18"/><path d="M24 13v22M13 24h22"/>'),
  s('family', 'Family', 'परिवार', 'Please call my family', 'कृपया मेरे परिवार को बुलाइए', '<circle cx="16" cy="14" r="6"/><circle cx="33" cy="17" r="5"/><path d="M5 41c0-9 4-15 11-15s11 6 11 15zM28 41c0-6 2-10 6-10s8 4 8 10z"/>'),
  s('love', 'Love', 'प्यार', 'I love you', 'मुझे आपसे बहुत प्यार है', '<path d="M24 41S6 30 6 17a9 9 0 0118-3 9 9 0 0118 3c0 13-18 24-18 24z"/>'),
  s('thanks', 'Thanks', 'धन्यवाद', 'Thank you very much', 'बहुत धन्यवाद', '<rect x="7" y="19" width="34" height="22"/><path d="M5 12h38v7H5zM24 12v29"/><path d="M24 12c-3-8-12-7-10-3s7 3 10 3zM24 12c3-8 12-7 10-3s-7 3-10 3z"/>'),
]

const EMO = { happy: 'happy', sad: 'sad', pain: 'sad', help: 'urgent', tired: 'calm', love: 'happy', thanks: 'happy', stop: 'urgent', wait: 'calm', sleep: 'calm' }
for (const sym of SYMBOLS) sym.emo = EMO[sym.id]
