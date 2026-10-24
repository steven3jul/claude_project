const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

process.env.CALORIES_FILE = path.join(os.tmpdir(), `calories-${process.pid}.json`);

const app = require("../server");
const store = require("../db/calories");

test("GET / serves the calorie log", async () => {
  const res = await request(app).get("/");

  assert.strictEqual(res.status, 200);
  assert.match(res.headers["content-type"], /html/);
  assert.match(res.text, /Calorie log/);
  assert.match(res.text, /id="log-form"/);
});

describe("calorie log writes", { concurrency: false }, () => {
  test("calorie log adds, totals, and removes foods for one day", async () => {
    store.reset();
    const date = "2026-10-24";

    const empty = await request(app).get("/calories").query({ date });
    assert.strictEqual(empty.status, 200);
    assert.strictEqual(empty.body.total, 0);
    assert.deepStrictEqual(empty.body.entries, []);

    const oatmeal = await request(app)
      .post("/calories")
      .send({ name: "  Oatmeal  ", calories: 150, date });
    assert.strictEqual(oatmeal.status, 201);
    assert.strictEqual(oatmeal.body.name, "Oatmeal");
    assert.strictEqual(oatmeal.body.calories, 150);

    const apple = await request(app)
      .post("/calories")
      .send({ name: "Apple", calories: 95, date });
    assert.strictEqual(apple.status, 201);

    const day = await request(app).get("/calories").query({ date });
    assert.strictEqual(day.status, 200);
    assert.strictEqual(day.body.total, 245);
    assert.strictEqual(day.body.entries.length, 2);

    const otherDay = await request(app).get("/calories").query({ date: "2026-10-23" });
    assert.strictEqual(otherDay.body.total, 0);

    const removed = await request(app).delete(`/calories/${oatmeal.body.id}`);
    assert.strictEqual(removed.status, 204);

    const after = await request(app).get("/calories").query({ date });
    assert.strictEqual(after.body.total, 95);
    assert.strictEqual(after.body.entries.length, 1);
    assert.strictEqual(after.body.entries[0].name, "Apple");

    fs.unlinkSync(process.env.CALORIES_FILE);
  });

  test("calorie log rejects bad input and missing entries", async () => {
    store.reset();

    const missingName = await request(app).post("/calories").send({ calories: 100 });
    assert.strictEqual(missingName.status, 400);

    const badCalories = await request(app)
      .post("/calories")
      .send({ name: "Soup", calories: 1.5, date: "2026-10-24" });
    assert.strictEqual(badCalories.status, 400);

    const tooMany = await request(app)
      .post("/calories")
      .send({ name: "Feast", calories: 20001, date: "2026-10-24" });
    assert.strictEqual(tooMany.status, 400);

    const badDate = await request(app).get("/calories").query({ date: "yesterday" });
    assert.strictEqual(badDate.status, 400);

    const missing = await request(app).delete("/calories/9999");
    assert.strictEqual(missing.status, 404);

    fs.unlinkSync(process.env.CALORIES_FILE);
  });
});
