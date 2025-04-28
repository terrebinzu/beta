// Main Logic

window.generate = async function () {
  const verbInput = document.getElementById("verbInput").value.trim();
  const output = document.getElementById("output");

  const result = await searchWord(verbInput);

  if (!result) {
    output.innerHTML = `<p>Unknown word or not dictionary form. Please enter a base-form verb like 食べる.</p>`;
    return;
  }

  const dictForm = result.slug;
  const definitions = result.senses[0]?.english_definitions.join(', ') || "No definition found";
  const pos = result.senses[0]?.parts_of_speech.join(', ') || "Unknown part of speech";
  const tags = result.is_common ? 'Common word' : '';

  let html = `<p><strong>Input:</strong> ${dictForm}</p>`;
  html += `<p><strong>Part of Speech:</strong> ${pos}</p>`;
  html += `<p><strong>Definition:</strong> ${definitions}</p>`;
  if (tags) html += `<p><strong>Tag:</strong> ${tags}</p>`;

  conjugateAndDisplay(dictForm, html);
};

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

// Utilities

function saveToHistory(verb) {
  let history = JSON.parse(localStorage.getItem("conjugationHistory")) || [];
  history.unshift(verb);
  history = history.slice(0, 5);
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
      generate();
    };
    historyList.appendChild(li);
  });
}

// Onload setup

window.onload = async function() {
  await loadDictionary();
  displayHistory();

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
};
