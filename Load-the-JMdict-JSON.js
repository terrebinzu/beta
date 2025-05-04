dictionary = []; // no 'let'

async function loadDictionary() {
  try {
    const response = await fetch('https://github.com/user-attachments/files/20027342/jmdict-all-3.6.1%2B20250428122401.json.zip');
    dictionary = await response.json();
    console.log('JMdict loaded:', dictionary.length, 'entries');
  } catch (error) {
    console.error('Failed to load JMdict:', error);
  }
}

// Load dictionary as soon as page loads
window.onload = async function() {
  await loadDictionary();
  displayHistory();
}
async function searchWord(userInput) {
  if (dictionary.length === 0) {
    console.error('Dictionary not loaded yet!');
    return null;
  }

  const kanaInput = wanakana.toKana(userInput); // Normalize user input to Kana if needed
  const kanjiInput = userInput; // Keep original in case it's Kanji

  for (const entry of dictionary) {
    const japanese = entry.japanese || [];
    for (const form of japanese) {
      if (form.word === kanjiInput || form.reading === kanaInput) {
        return entry; // Found match
      }
    }
  }

  return null; // Not found
};
