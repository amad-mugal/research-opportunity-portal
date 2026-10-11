const API = "/api/opportunities";
const form = document.querySelector("#opportunityForm");
const list = document.querySelector("#opportunityList");
const details = document.querySelector("#details");
const message = document.querySelector("#message");
let opportunities = [];
let editingId = null;
let selectedId = null;

function showMessage(text, kind = "success") {
  message.textContent = text;
  message.className = `message ${kind}`;
  message.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.setTimeout(() => { message.hidden = true; }, 5000);
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`);
  return payload;
}

function safe(value) {
  const node = document.createElement("span");
  node.textContent = value ?? "";
  return node.innerHTML;
}

function renderList() {
  if (!opportunities.length) {
    list.innerHTML = '<div class="empty">No opportunities yet. Add the first research project using the form.</div>';
    return;
  }
  list.innerHTML = opportunities.map(item => `
    <article class="card ${selectedId === item.id ? "selected" : ""}" data-id="${item.id}" tabindex="0" role="button" aria-label="View ${safe(item.title)}">
      <div class="card-top"><div><h3>${safe(item.title)}</h3><p>${safe(item.research_area)} · ${safe(item.department)}</p></div><span class="badge ${item.status === "Closed" ? "closed" : ""}">${safe(item.status)}</span></div>
      <div class="card-meta"><span>👤 ${safe(item.faculty_name)}</span><span>◉ ${item.positions} position${item.positions === 1 ? "" : "s"}</span><span>Deadline ${safe(item.deadline)}</span></div>
    </article>`).join("");
  list.querySelectorAll(".card").forEach(card => {
    const open = () => selectOpportunity(Number(card.dataset.id));
    card.addEventListener("click", open);
    card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
  });
}

async function loadOpportunities() {
  try {
    opportunities = await request(API);
    document.querySelector("#apiState").textContent = "API connected";
    document.querySelector("#apiState").className = "api-state online";
    renderList();
    if (selectedId && opportunities.some(item => item.id === selectedId)) await selectOpportunity(selectedId, false);
    else { selectedId = null; details.hidden = true; }
  } catch (error) {
    document.querySelector("#apiState").textContent = "API unavailable";
    document.querySelector("#apiState").className = "api-state offline";
    list.innerHTML = '<div class="empty">Could not load opportunities. Start MySQL and the Flask server, then refresh.</div>';
    showMessage(error.message, "error");
  }
}

async function selectOpportunity(id, refreshList = true) {
  try {
    const item = await request(`${API}/${id}`);
    selectedId = id;
    details.innerHTML = `
      <p class="eyebrow">OPPORTUNITY DETAILS</p><h2>${safe(item.title)}</h2><p>${safe(item.description)}</p>
      <div class="detail-grid">
        <div><strong>Research area</strong>${safe(item.research_area)}</div><div><strong>Faculty</strong>${safe(item.faculty_name)}</div><div><strong>Department</strong>${safe(item.department)}</div>
        <div><strong>Required skills</strong>${safe(item.required_skills)}</div><div><strong>Positions</strong>${item.positions}</div><div><strong>Deadline · Status</strong>${safe(item.deadline)} · ${safe(item.status)}</div>
      </div><div class="detail-actions"><button class="button secondary" id="editButton">Edit details</button><button class="button secondary" id="toggleStatus">Mark ${item.status === "Open" ? "closed" : "open"}</button><button class="button danger" id="deleteButton">Delete</button></div>`;
    details.hidden = false;
    document.querySelector("#editButton").onclick = () => startEdit(item);
    document.querySelector("#toggleStatus").onclick = async () => {
      try { await request(`${API}/${id}`, { method: "PUT", body: JSON.stringify({ status: item.status === "Open" ? "Closed" : "Open" }) }); showMessage(`Opportunity marked ${item.status === "Open" ? "Closed" : "Open"}.`); await loadOpportunities(); }
      catch (error) { showMessage(error.message, "error"); }
    };
    document.querySelector("#deleteButton").onclick = async () => {
      if (!window.confirm(`Delete “${item.title}”?`)) return;
      try { await request(`${API}/${id}`, { method: "DELETE" }); selectedId = null; details.hidden = true; showMessage("Opportunity deleted."); await loadOpportunities(); }
      catch (error) { showMessage(error.message, "error"); }
    };
    if (refreshList) renderList();
  } catch (error) { showMessage(error.message, "error"); }
}

function startEdit(item) {
  editingId = item.id;
  for (const [key, value] of Object.entries(item)) if (form.elements[key]) form.elements[key].value = value;
  document.querySelector("#formHeading").textContent = "Update opportunity";
  document.querySelector("#submitButton").textContent = "Save changes";
  document.querySelector("#cancelButton").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetForm() {
  editingId = null;
  form.reset();
  form.elements.positions.value = 1;
  document.querySelector("#formHeading").textContent = "Create opportunity";
  document.querySelector("#submitButton").textContent = "Create opportunity";
  document.querySelector("#cancelButton").hidden = true;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  data.positions = Number(data.positions);
  try {
    const wasEditing = editingId !== null;
    const saved = await request(wasEditing ? `${API}/${editingId}` : API, { method: wasEditing ? "PUT" : "POST", body: JSON.stringify(data) });
    resetForm();
    selectedId = saved.id;
    showMessage(wasEditing ? "Opportunity updated." : "Opportunity created.");
    await loadOpportunities();
  } catch (error) { showMessage(error.message, "error"); }
});

document.querySelector("#newButton").addEventListener("click", () => { resetForm(); form.scrollIntoView({ behavior: "smooth", block: "center" }); form.elements.title.focus(); });
document.querySelector("#cancelButton").addEventListener("click", resetForm);
loadOpportunities();