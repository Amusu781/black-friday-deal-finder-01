// views.js — turns deal data into HTML. One job: rendering, no state.

import { DEALS, CHECKED_DATE, discountOf, savingOf, money, VERDICT_LABELS } from "./data.js";

export function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function verdictBadge(deal) {
  return `<span class="verdict-badge verdict-${deal.verdict}">${VERDICT_LABELS[deal.verdict]}</span>`;
}

export function cardHtml(deal) {
  const off = discountOf(deal);
  const saved = savingOf(deal);
  return `<article class="card">
    <div class="card-top"><span class="store-badge">${escapeHtml(deal.store)}</span><span>${escapeHtml(deal.category)}</span></div>
    <h3><a href="#/deal/${deal.id}">${escapeHtml(deal.product)}</a></h3>
    <div class="price-row">
      <span class="sale-price">${money(deal.sale)}</span>
      <span class="usual-price">${money(deal.usual)}</span>
      <span class="off-badge">${off}% off</span>
      <span class="save-note">save ${money(saved)}</span>
    </div>
    <div class="verdict">${verdictBadge(deal)}<p>${escapeHtml(deal.evidence)}</p></div>
    <p class="checked">Checked ${CHECKED_DATE} · ${escapeHtml(deal.source)}</p>
    <div class="card-actions">
      <a class="btn" href="${escapeHtml(deal.url)}" target="_blank" rel="noopener">View at ${escapeHtml(deal.store)} →</a>
      <a class="details-link" href="#/deal/${deal.id}">Details</a>
    </div>
  </article>`;
}

export function gridHtml(deals) {
  if (deals.length === 0) {
    return `<p class="empty">No deals match those filters. Try clearing the search or lowering the discount filter.</p>`;
  }
  return deals.map(cardHtml).join("\n");
}

export function sameProductDeals(deal) {
  if (!deal.group) return [];
  return DEALS.filter((d) => d.group === deal.group && d.id !== deal.id);
}

export function detailHtml(deal) {
  const off = discountOf(deal);
  const saved = savingOf(deal);
  const others = sameProductDeals(deal);
  const compare = others.length
    ? `<div class="compare"><h3>Same product, another store</h3><ul>${others
        .map(
          (o) =>
            `<li><strong>${escapeHtml(o.store)}</strong>: ${money(o.sale)} (was ${money(o.usual)}, ${discountOf(o)}% off) — <a href="${escapeHtml(o.url)}" target="_blank" rel="noopener">view at ${escapeHtml(o.store)}</a></li>`,
        )
        .join("")}</ul></div>`
    : "";
  return `<article class="detail-card">
    <a class="back-link" href="#/">← Back to all deals</a>
    <h2>${escapeHtml(deal.product)}</h2>
    <div class="verdict">${verdictBadge(deal)}<p>${escapeHtml(deal.evidence)}</p></div>
    <dl class="detail-grid">
      <div><dt>Sale price</dt><dd class="big">${money(deal.sale)}</dd></div>
      <div><dt>Usual price</dt><dd>${money(deal.usual)}</dd></div>
      <div><dt>Discount</dt><dd>${off}% off — you save ${money(saved)}</dd></div>
      <div><dt>Store</dt><dd>${escapeHtml(deal.store)}</dd></div>
      <div><dt>Category</dt><dd>${escapeHtml(deal.category)}</dd></div>
      <div><dt>Checked</dt><dd>${CHECKED_DATE}</dd></div>
      <div><dt>Price source</dt><dd>${escapeHtml(deal.source)}</dd></div>
      <div><dt>How to get it</dt><dd>${escapeHtml(deal.note)}</dd></div>
    </dl>
    <p class="evidence">Why this verdict: ${escapeHtml(deal.evidence)}</p>
    <div class="card-actions">
      <a class="btn" href="${escapeHtml(deal.url)}" target="_blank" rel="noopener">View at ${escapeHtml(deal.store)} →</a>
    </div>
    ${compare}
  </article>`;
}

export function statsHtml() {
  const best = Math.max(...DEALS.map(discountOf));
  const totalSaved = DEALS.reduce((sum, d) => sum + savingOf(d), 0);
  return `<div><dt>Deals checked</dt><dd>${DEALS.length}</dd></div>
    <div><dt>Stores</dt><dd>${new Set(DEALS.map((d) => d.store)).size}</dd></div>
    <div><dt>Biggest cut</dt><dd>${best}% off</dd></div>
    <div><dt>Total savings</dt><dd>${money(totalSaved)}</dd></div>`;
}
