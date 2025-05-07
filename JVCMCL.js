console.log("wanakana?", typeof wanakana);

let fullDictionary = [];

async function loadAllDictionaryParts() {
  const partCount = 21;

  for (let i = 1; i <= partCount; i++) {
    try {
      const res = await fetch(`jmdict-part-${i}.json`);
      const entries = await res.json();
      console.log(`✅ Loaded part ${i}`, entries.length);

      // ✅ Push entries into the full dictionary
      fullDictionary.push(...entries); // better loop perfomance(21 files)

    } catch (err) {
      console.error(`❌ Failed to load jmdict-part-${i}.json`, err);
    }
  }

  console.log("📘 Dictionary preloaded:", fullDictionary.length, "entries");
  console.log("🔍 Sample entry:", fullDictionary[0]);
}

async function searchWord(userInput) {
  
  const kanaInput = wanakana.toKana(userInput);
  const kanjiInput = userInput;
 const selectedLanguage = document.getElementById("languageSelect").value;
  
  for (const entry of fullDictionary) {
    const japanese = entry.japanese || [];
    for (const form of japanese) {
      if (form.word === kanjiInput || form.reading === kanaInput) {
        const sense = entry.senses[0];
        let definitions;

        if (sense.definitions) {
          definitions = sense.definitions[selectedLanguage] || sense.definitions.en || ["No definition found."];
        } else {
          definitions = sense.english_definitions || ["No definition found."];
        }

        return {
          ...entry,
          definitions: definitions.join(", "),
          pos: sense.parts_of_speech?.join(", ") || "Unknown part of speech"
        };
      }
    }
  }

  return null; // ❌ Not found
}
  
function deconjugate(input) {
  const kanaInput = wanakana.toKana(input);

  // Handle Irregular Verbs
  if (kanaInput.startsWith("し") && (kanaInput.endsWith("ます") || kanaInput.endsWith("ました") || kanaInput.endsWith("ない") || kanaInput.endsWith("た") || kanaInput.endsWith("て"))) {
    return "する";
  }
  if (kanaInput.startsWith("き") && (kanaInput.endsWith("ます") || kanaInput.endsWith("ました") || kanaInput.endsWith("ない") || kanaInput.endsWith("た") || kanaInput.endsWith("て"))) {
    return "くる";
  }

  // Polite Forms
  if (kanaInput.endsWith("ました") || kanaInput.endsWith("ます")) {
    return kanaInput.slice(0, -3) + "る";
  }
  if (kanaInput.endsWith("ませんでした") || kanaInput.endsWith("ません")) {
    return kanaInput.slice(0, -4) + "る";
  }

  // Plain Past (た/だ)
  if (kanaInput.endsWith("った") || kanaInput.endsWith("んだ")) {
    return kanaInput.slice(0, -2) + "う"; // usually u-verbs
  }
  if (kanaInput.endsWith("いた")) {
    return kanaInput.slice(0, -2) + "く";
  }
  if (kanaInput.endsWith("いだ")) {
    return kanaInput.slice(0, -2) + "ぐ";
  }
  if (kanaInput.endsWith("した")) {
    return kanaInput.slice(0, -2) + "す";
  }

  // Plain Negative
  if (kanaInput.endsWith("ない")) {
    return kanaInput.slice(0, -2) + "る"; // for most ichidan
  }

  // Te-form (optional, not perfect)
  if (kanaInput.endsWith("って")) {
    return kanaInput.slice(0, -2) + "う"; // う-verb
  }
  if (kanaInput.endsWith("んで")) {
    return kanaInput.slice(0, -2) + "む"; // む, ぬ, ぶ usually
  }
  if (kanaInput.endsWith("いて")) {
    return kanaInput.slice(0, -2) + "く";
  }
  if (kanaInput.endsWith("いで")) {
    return kanaInput.slice(0, -2) + "ぐ";
  }
  if (kanaInput.endsWith("して")) {
    return kanaInput.slice(0, -2) + "す";
  }

  // If none matched, return original
  return kanaInput;
}

// Utilities

function saveToHistory(verb) {
  let history = JSON.parse(localStorage.getItem("conjugationHistory")) || [];
  history.unshift(verb); // Add new verb to beginning
  history = history.slice(0, 5); // Keep only latest 5
  localStorage.setItem("conjugationHistory", JSON.stringify(history));
}

function displayHistory() {
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";
  let history = JSON.parse(localStorage.getItem("conjugationHistory")) || [];
    history.forEach(verb => {
    const li = document.createElement("li");
    li.className = "list-group-item list-group-item-action";
    li.textContent = verb;
    li.onclick = () => {
      document.getElementById("verbInput").value = verb;
      generate(); // Re-generate when clicked
    };
    historyList.appendChild(li);
  });
}

async function conjugateAndDisplay(baseForm, html) {
  const output = document.getElementById("output");

  const normalizedKana = wanakana.toKana(baseForm);
  const stripped = wanakana.stripOkurigana(baseForm);
  const baseKana = wanakana.toKana(stripped);

  const showPolite = document.getElementById("formPolite").checked;
  const showNegative = document.getElementById("formNegative").checked;
  const showPast = document.getElementById("formPast").checked;
  const showTe = document.getElementById("formTe").checked;

  const ending = normalizedKana.slice(-1);

  const uVerbStemMap = { "う":"い", "く":"き", "ぐ":"ぎ", "す":"し", "つ":"ち", "ぬ":"に", "ぶ":"び", "む":"み", "る":"り" };
  const negMap = { "う":"わ", "つ":"た", "る":"ら", "む":"ま", "ぶ":"ば", "ぬ":"な", "く":"か", "ぐ":"が", "す":"さ" };
  const pastMap = { "う":"った", "つ":"った", "る":"った", "む":"んだ", "ぶ":"んだ", "ぬ":"んだ", "く":"いた", "ぐ":"いだ", "す":"した" };
  const teMap = { "う":"って", "つ":"って", "る":"って", "む":"んで", "ぶ":"んで", "ぬ":"んで", "く":"いて", "ぐ":"いで", "す":"して" };


  if (normalizedKana === "する") {
    if (showPolite) html += `<p><strong>Polite:</strong> します</p>`;
    if (showNegative) html += `<p><strong>Negative:</strong> しない</p>`;
    if (showPast) html += `<p><strong>Past:</strong> した</p>`;
    if (showTe) html += `<p><strong>Te-form:</strong> して</p>`;
    output.innerHTML = html;
    saveToHistory(baseForm);
    displayHistory();
    return;
  }

  if (normalizedKana === "くる") {
    if (showPolite) html += `<p><strong>Polite:</strong> きます</p>`;
    if (showNegative) html += `<p><strong>Negative:</strong> こない</p>`;
    if (showPast) html += `<p><strong>Past:</strong> きた</p>`;
    if (showTe) html += `<p><strong>Te-form:</strong> きて</p>`;
    output.innerHTML = html;
    saveToHistory(baseForm);
    displayHistory();
    return;
  }

  if (normalizedKana.endsWith("る") && ["い", "え"].includes(baseKana.slice(-1))) {
    const stem = baseKana;
    if (showPolite) html += `<p><strong>Polite:</strong> ${stem}ます</p>`;
    if (showNegative) html += `<p><strong>Negative:</strong> ${stem}ない</p>`;
    if (showPast) html += `<p><strong>Past:</strong> ${stem}た</p>`;
    if (showTe) html += `<p><strong>Te-form:</strong> ${stem}て</p>`;
    output.innerHTML = html;
    saveToHistory(baseForm);
    displayHistory();
    return;
  }

  if (uVerbStemMap[ending]) {
    const stem = normalizedKana.slice(0, -1) + uVerbStemMap[ending];
    if (showPolite) html += `<p><strong>Polite:</strong> ${stem}ます</p>`;
    if (showNegative) html += `<p><strong>Negative:</strong> ${normalizedKana.slice(0, -1)}${negMap[ending]}ない</p>`;
    if (showPast) html += `<p><strong>Past:</strong> ${normalizedKana.slice(0, -1)}${pastMap[ending]}</p>`;
    if (showTe) html += `<p><strong>Te-form:</strong> ${normalizedKana.slice(0, -1)}${teMap[ending]}</p>`;
    output.innerHTML = html;
    saveToHistory(baseForm);
    displayHistory();
    return;
  }

  output.innerHTML = `<p>I do not know how to conjugate "${baseForm}" yet.</p>`;
}
window.generate = async function () {
  const verbInput = document.getElementById("verbInput").value.trim();
  const output = document.getElementById("output");
  const selectedLanguage = document.getElementById("languageSelect").value;
  const result = await searchWord(verbInput);
  const normalizedInput = deconjugate(verbInput); // Try deconjugation first

  // Show deconjugation notice if different
const deconjugateNotice = document.getElementById("deconjugateNotice");
if (normalizedInput !== wanakana.toKana(verbInput)) {
  deconjugateNotice.innerHTML = `🔄 Deconjugated Input: <strong>${verbInput}</strong> ➔ <strong>${normalizedInput}</strong>`;
} else {
  deconjugateNotice.innerHTML = ""; // Clear if no change
}
  
  if (!result) {
    output.innerHTML = `<p>Unknown word or not dictionary form. Please enter a base-form verb.</p>`;
    return;
  }
   const dictForm = result.japanese?.[0]?.word || result.japanese?.[0]?.reading || "N/A";

 // const dictForm = result.slug;
  
let definitions; // Pick definition based on selected language
switch(selectedLanguage) {
  case "chinese":
    definitions = result.senses[0]?.chinese_definitions?.join(', ') || "";
    break;
  case "spanish":
    definitions = result.senses[0]?.spanish_definitions?.join(', ') || "";
    break;
  case "thai":
    definitions = result.senses[0]?.thai_definitions?.join(', ') || "";
    break;
     case "korean":
    definitions = result.senses[0]?.korean_definitions?.join(', ') || "";
    break;
  default:
    definitions = result.senses[0]?.english_definitions?.join(', ') || "";
}
  
  // Fallback to English if the selected language isn't available
if (!definitions) {
  
  definitions = result.senses[0]?.english_definitions.join(', ') || "No definition found.";
}
  const pos = result.senses[0]?.parts_of_speech.join(', ') || "Unknown part of speech";
  const tags = result.is_common ? 'Common word' : '';

  let html = `<p><strong>Input:</strong> ${dictForm}</p>`;
  html += `<p><strong>Part of Speech:</strong> ${pos}</p>`;
  html += `<p><strong>Definition:</strong> ${definitions}</p>`;
  if (tags) html += `<p><strong>Tag:</strong> ${tags}</p>`;

  conjugateAndDisplay(dictForm, html);
};

window.onload = async function() {
  await loadAllDictionaryParts();  // ← good place to preload dictionary
  displayHistory();
};

document.getElementById("verbInput").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
      generate();
    }
  });
  
document.getElementById("darkModeToggle").addEventListener('change', function() {
  if (this.checked) {
    document.body.classList.add("bg-dark", "text-white");
    document.getElementById("output").classList.remove("bg-white");
    document.getElementById("output").classList.add("bg-secondary");
  } else {
    document.body.classList.remove("bg-dark", "text-white");
    document.getElementById("output").classList.remove("bg-secondary");
    document.getElementById("output").classList.add("bg-white");
  }
});

