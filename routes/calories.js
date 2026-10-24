const express = require("express");
const store = require("../db/calories");

const router = express.Router();

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// GET /calories?date=YYYY-MM-DD — foods logged on that day, plus the total
router.get("/", (req, res) => {
  const date = req.query.date || store.today();
  if (!isIsoDate(date)) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  }
  res.json(store.summary(date));
});

// POST /calories — log one food
router.post("/", (req, res) => {
  const { name, calories, date } = req.body || {};
  const food = typeof name === "string" ? name.trim() : "";
  const entryDate = date || store.today();

  if (!food) {
    return res.status(400).json({ error: "name is required" });
  }
  if (food.length > 80) {
    return res.status(400).json({ error: "name must be 80 characters or fewer" });
  }
  if (!isIsoDate(entryDate)) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  }
  if (
    typeof calories !== "number" ||
    !Number.isInteger(calories) ||
    calories < 0 ||
    calories > 20000
  ) {
    return res.status(400).json({
      error: "calories must be a whole number from 0 to 20000",
    });
  }

  const entry = store.addEntry({ name: food, calories, date: entryDate });
  res.status(201).json(entry);
});

// DELETE /calories/:id — remove one food from the log
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !store.removeEntry(id)) {
    return res.status(404).json({ error: "Entry not found" });
  }
  res.status(204).end();
});

module.exports = router;
