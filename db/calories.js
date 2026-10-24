const fs = require("fs");
const path = require("path");

// Local JSON file so the log survives a restart. Tests point CALORIES_FILE
// at a temp path before this module loads.
const filePath =
  process.env.CALORIES_FILE || path.join(__dirname, "..", "data", "calories.json");

function emptyState() {
  return { entries: [], nextId: 1 };
}

function load() {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const nextId = Number.isInteger(parsed.nextId) ? parsed.nextId : 1;
    return { entries, nextId };
  } catch (error) {
    if (error.code === "ENOENT") {
      return emptyState();
    }
    throw error;
  }
}

let state = load();

function persist() {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function summary(date) {
  const entries = state.entries.filter((entry) => entry.date === date);
  const total = entries.reduce((sum, entry) => sum + entry.calories, 0);
  return { date, total, entries };
}

function addEntry({ name, calories, date }) {
  const entry = { id: state.nextId, name, calories, date };
  state.nextId += 1;
  state.entries.push(entry);
  persist();
  return entry;
}

function removeEntry(id) {
  const index = state.entries.findIndex((entry) => entry.id === id);
  if (index === -1) {
    return false;
  }
  state.entries.splice(index, 1);
  persist();
  return true;
}

function reset() {
  state = emptyState();
  persist();
}

module.exports = { today, summary, addEntry, removeEntry, reset };
