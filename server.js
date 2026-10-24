const path = require("path");
const express = require("express");

const usersRoutes = require("./routes/users");
const healthRoutes = require("./routes/health");
const caloriesRoutes = require("./routes/calories");

const app = express();

app.use(express.json());

app.use("/users", usersRoutes);
app.use("/health", healthRoutes);
app.use("/calories", caloriesRoutes);
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

// Only start the server when this file is run directly (e.g. `npm run dev`),
// so the tests can import `app` without opening a real port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Calorie log listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
