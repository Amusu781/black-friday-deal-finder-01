// main.js — state, search, filters, sorting and hash routing for Deal Beacon.
// Views render the HTML; this file owns what is shown and when.

import { DEALS, CATEGORIES, STORES, discountOf, savingOf } from "./data.js";
import { gridHtml, detailHtml, statsHtml } from "./views.js";

const grid = document.getElementById("grid");
const detail = document.getElementById("detail");
const controls = document.getElementById("controls");
const resultLine = document.getElementById("result-line");
const searchInput = document.getElementById("search");
const storeFilter = document.getElementById("store-filter");
const discountFilter = document.getElementById("discount-filter");
const sortSelect = document.getElementById("sort");
const chipsBox = document.getElementById("category-chips");

const state = { query: "", category: "", store: "", minDiscount: 0, sort: "discount" };

// Filters can also start from the address bar, so a filtered view is a
// real link: ?q=dyson, ?cat=TVs, ?store=Target, ?min=50, ?sort=saving.
const params = new URLSearchParams(window.location.search);
if (params.get("q")) {
  state.query = params.get("q");
  searchInput.value = state.query;
}
if (params.get("cat") && CATEGORIES.includes(params.get("cat"))) state.category = params.get("cat");
if (params.get("store") && STORES.includes(params.get("store"))) {
  state.store = params.get("store");
  storeFilter.value = state.store;
}
if (params.get("min")) {
  state.minDiscount = Number(params.get("min")) || 0;
  discountFilter.value = String(state.minDiscount);
}
if (params.get("sort") && ["discount", "saving", "price", "name"].includes(params.get("sort"))) {
  state.sort = params.get("sort");
  sortSelect.value = state.sort;
}

for (const store of STORES) {
  const option = document.createElement("option");
  option.value = store;
  option.textContent = store;
  storeFilter.append(option);
}

const allChip = chipButton("", "All categories");
chipsBox.append(allChip);
for (const category of CATEGORIES) {
  chipsBox.append(chipButton(category, category));
}

function chipButton(value, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.textContent = label;
  button.setAttribute("aria-pressed", value === state.category ? "true" : "false");
  button.addEventListener("click", () => {
    state.category = value;
    for (const chip of chipsBox.querySelectorAll(".chip")) {
      chip.setAttribute("aria-pressed", chip === button ? "true" : "false");
    }
    render();
  });
  return button;
}

function applyFilters() {
  const query = state.query.trim().toLowerCase();
  let list = DEALS.filter((deal) => {
    if (state.category && deal.category !== state.category) return false;
    if (state.store && deal.store !== state.store) return false;
    if (discountOf(deal) < state.minDiscount) return false;
    if (query) {
      const haystack = `${deal.product} ${deal.store} ${deal.category} ${deal.verdict}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  if (state.sort === "discount") {
    list = [...list].sort((a, b) => discountOf(b) - discountOf(a) || savingOf(b) - savingOf(a));
  } else if (state.sort === "saving") {
    list = [...list].sort((a, b) => savingOf(b) - savingOf(a));
  } else if (state.sort === "price") {
    list = [...list].sort((a, b) => a.sale - b.sale);
  } else if (state.sort === "name") {
    list = [...list].sort((a, b) => a.product.localeCompare(b.product));
  }
  return list;
}

function render() {
  const list = applyFilters();
  grid.innerHTML = gridHtml(list);
  const bits = [`<strong>${list.length}</strong> of ${DEALS.length} deals`];
  if (state.category) bits.push(`in ${state.category}`);
  if (state.store) bits.push(`at ${state.store}`);
  if (state.minDiscount) bits.push(`${state.minDiscount}% off or more`);
  if (state.query.trim()) bits.push(`matching “${state.query.trim()}”`);
  resultLine.innerHTML = `Showing ${bits.join(" · ")} — sorted by ${sortSelect.options[sortSelect.selectedIndex].text.toLowerCase()}.`;
}

function route() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/deal\/([\w-]+)$/);
  if (match) {
    const deal = DEALS.find((d) => d.id === match[1]);
    if (deal) {
      controls.hidden = true;
      grid.hidden = true;
      detail.hidden = false;
      detail.innerHTML = detailHtml(deal);
      document.title = `${deal.product} — Deal Beacon`;
      window.scrollTo(0, 0);
      return;
    }
  }
  controls.hidden = false;
  grid.hidden = false;
  detail.hidden = true;
  detail.innerHTML = "";
  document.title = "Deal Beacon — Black Friday 2026 Deal Finder";
  render();
}

searchInput.addEventListener("input", () => {
  state.query = searchInput.value;
  render();
});
storeFilter.addEventListener("change", () => {
  state.store = storeFilter.value;
  render();
});
discountFilter.addEventListener("change", () => {
  state.minDiscount = Number(discountFilter.value);
  render();
});
sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  render();
});
window.addEventListener("hashchange", route);

document.getElementById("stats").innerHTML = statsHtml();
route();
