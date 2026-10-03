import { readChapters, removeChapter, readPreferences, savePreferences } from "./store.js";

const $ = (id) => document.getElementById(id);
const prefs = readPreferences();
let chapters = [];
let selected;
let unreadable = 0;
let size = typeof prefs.size === "number" ? Math.max(1, Math.min(1.8, prefs.size)) : 1;
let installPrompt;

function remember() { savePreferences({ ...prefs, selected: selected?.key, size }); }
function status(message) { $("status").textContent = message; }
function resize(delta = 0) {
  size = Math.round(Math.max(1, Math.min(1.8, size + delta)) * 10) / 10;
  document.documentElement.style.setProperty("--reading-size", `${1.2 * size}rem`);
  $("size").textContent = `${Math.round(size * 100)}%`;
  $("smaller").disabled = size <= 1;
  $("larger").disabled = size >= 1.8;
  if (selected) remember();
}

function showChapter(key, restore = false) {
  selected = chapters.find((chapter) => chapter.key === key) ?? chapters[0];
  $("tools").hidden = !selected;
  $("empty").hidden = Boolean(selected);
  $("chapter-footer").hidden = !selected;
  $("reading").replaceChildren();
  if (!selected) {
    $("title").textContent = "Your saved chapters";
    $("edition").textContent = "Scripture, within reach.";
    status(unreadable ? "A saved chapter could not be opened. Return to the library and save it again." : "No chapters saved on this device yet.");
    remember();
    return;
  }
  $("title").textContent = `${selected.bookName} ${selected.chapter}`;
  document.title = `${selected.bookName} ${selected.chapter} — Saved Scripture`;
  $("edition").textContent = selected.translationName;
  $("chapters").value = selected.key;
  $("attribution").textContent = `${selected.translationName} · ${selected.license}. Text saved ${new Date(selected.savedAt).toLocaleDateString()}.`;
  $("source").href = selected.sourcePath;
  const fragment = document.createDocumentFragment();
  selected.verses.forEach((text, index) => {
    if (!text) return;
    const p = document.createElement("p");
    p.className = "verse";
    p.id = `verse-${index + 1}`;
    const number = document.createElement("span");
    number.className = "verse-number";
    number.textContent = `${index + 1} `;
    number.setAttribute("aria-label", `Verse ${index + 1}.`);
    p.append(number, document.createTextNode(text));
    fragment.append(p);
  });
  $("reading").append(fragment);
  status(`Saved on this device · ${chapters.length} ${chapters.length === 1 ? "chapter" : "chapters"}.${unreadable ? " Some other saved chapters could not be opened; save them again from the library." : ""}`);
  if (restore && prefs.selected === selected.key && Number.isInteger(prefs.verse)) {
    requestAnimationFrame(() => $(`verse-${prefs.verse}`)?.scrollIntoView());
  }
  if (!restore) prefs.verse = 1;
  remember();
}

async function refresh(restore = false) {
  const data = await readChapters();
  chapters = data.entries;
  unreadable = data.unreadable;
  $("chapters").replaceChildren(...chapters.map((chapter) => {
    const option = document.createElement("option");
    option.value = chapter.key;
    option.textContent = `${chapter.bookName} ${chapter.chapter} · ${chapter.translationName}`;
    return option;
  }));
  showChapter(selected?.key ?? prefs.selected, restore);
}

$("chapters").addEventListener("change", (event) => showChapter(event.target.value));
$("larger").addEventListener("click", () => resize(0.1));
$("smaller").addEventListener("click", () => resize(-0.1));
$("remove").addEventListener("click", async () => {
  if (!selected) return;
  $("remove").disabled = true;
  try {
    await removeChapter(selected.key);
    selected = undefined;
    await refresh();
    $("title").setAttribute("tabindex", "-1");
    $("title").focus();
  } catch { status("Could not remove this saved chapter. Try again."); }
  finally { $("remove").disabled = false; }
});

let scrollTimer;
addEventListener("scroll", () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => {
    const verse = [...document.querySelectorAll(".verse")].find((p) => p.getBoundingClientRect().bottom > 80);
    if (verse) { prefs.verse = Number(verse.id.slice(6)); remember(); }
  }, 180);
}, { passive: true });

addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault(); installPrompt = event; $("install").hidden = false;
});
$("install").addEventListener("click", async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = undefined;
  $("install").hidden = true;
});

resize();
refresh(true).catch(() => {
  $("empty").hidden = false;
  status("Saved chapters are unavailable in this browser. Allow website storage or return to the online library.");
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/scripture-sw.js", { scope: "/scripture-reader/" }).catch(() => {
    if (!chapters.length) status("The offline reader could not be prepared. Connect to the internet and reload before saving a chapter.");
  });
}
