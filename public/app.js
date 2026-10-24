/* eslint-env browser */
(function () {
  const date = localDate();
  const form = document.querySelector("#log-form");
  const list = document.querySelector("#entries");
  const total = document.querySelector("#total");
  const empty = document.querySelector("#empty");
  const error = document.querySelector("#form-error");
  const dateLabel = document.querySelector("#today");

  dateLabel.textContent = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function localDate() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }

  function showError(message) {
    error.hidden = false;
    error.textContent = message;
  }

  function clearError() {
    error.hidden = true;
    error.textContent = "";
  }

  function render(day) {
    total.textContent = String(day.total);
    list.replaceChildren();
    empty.hidden = day.entries.length > 0;

    day.entries.forEach((entry) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = entry.name;
      const amount = document.createElement("span");
      amount.textContent = String(entry.calories);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = "Remove";
      remove.addEventListener("click", () => {
        removeEntry(entry.id);
      });
      item.append(name, amount, remove);
      list.append(item);
    });
  }

  async function load() {
    const response = await fetch(`/calories?date=${date}`);
    if (!response.ok) {
      showError("Could not load today's log.");
      return;
    }
    render(await response.json());
  }

  async function removeEntry(id) {
    clearError();
    const response = await fetch(`/calories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      showError("Could not remove that food.");
      return;
    }
    await load();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const data = new FormData(form);
    const response = await fetch("/calories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        calories: Number(data.get("calories")),
        date,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      showError(body.error || "Could not add that food.");
      return;
    }

    form.reset();
    form.elements.name.focus();
    await load();
  });

  load();
})();
