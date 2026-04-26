const state = {
  opportunities: [],
  filtered: [],
  activeId: null,
  activeTab: "snapshot",
  activePulse: 0
};

const filters = {
  city: document.querySelector("#cityFilter"),
  locality: document.querySelector("#localityFilter"),
  sector: document.querySelector("#sectorFilter"),
  radius: document.querySelector("#radiusFilter"),
  budget: document.querySelector("#budgetFilter"),
  risk: document.querySelector("#riskFilter"),
  footfall: document.querySelector("#footfallFilter")
};

const templateLibrary = [
  { id: "memo-minimal", name: "Memo Minimal", bg: "#ffffff", ink: "#111827", muted: "#64748b", accent: "#2563eb", accent2: "#111827", pattern: "clean" },
  { id: "venture-black", name: "Venture Black", bg: "#0b0f17", ink: "#f8fafc", muted: "#a7b0c0", accent: "#d8ff3e", accent2: "#38bdf8", pattern: "dark" },
  { id: "market-map", name: "Market Map", bg: "#f7f2e8", ink: "#17130f", muted: "#6f6658", accent: "#f4ff4f", accent2: "#2457d6", pattern: "grid" },
  { id: "operator-red", name: "Operator Red", bg: "#fff7f2", ink: "#1f1713", muted: "#785f55", accent: "#ff3b2f", accent2: "#111827", pattern: "bold" },
  { id: "growth-green", name: "Growth Green", bg: "#f3fff7", ink: "#102017", muted: "#547164", accent: "#18a558", accent2: "#ecff3d", pattern: "clean" },
  { id: "ai-blueprint", name: "AI Blueprint", bg: "#f4f8ff", ink: "#101828", muted: "#667085", accent: "#2457d6", accent2: "#00b8d9", pattern: "blueprint" },
  { id: "premium-gold", name: "Premium Gold", bg: "#101010", ink: "#fffaf0", muted: "#c8b98e", accent: "#d4af37", accent2: "#ffffff", pattern: "dark" },
  { id: "street-receipt", name: "Street Receipt", bg: "#fffbe7", ink: "#17130f", muted: "#716859", accent: "#ff7a00", accent2: "#2457d6", pattern: "receipt" },
  { id: "studio-violet", name: "Studio Violet", bg: "#fbf7ff", ink: "#191427", muted: "#746987", accent: "#6737ff", accent2: "#ff3b9a", pattern: "bold" },
  { id: "banker-clean", name: "Banker Clean", bg: "#f8fafc", ink: "#0f172a", muted: "#64748b", accent: "#0f766e", accent2: "#1e293b", pattern: "clean" }
];

const els = {
  cards: document.querySelector("#opportunityCards"),
  plan: document.querySelector("#planContent"),
  count: document.querySelector("#matchCount"),
  reset: document.querySelector("#resetFilters"),
  print: document.querySelector("#printReport"),
  canvas: document.querySelector("#canvasContent"),
  timeline: document.querySelector("#timeline"),
  pulseCity: document.querySelector("#pulseCity")
};

const formatter = new Intl.NumberFormat("en-IN");

init();

async function init() {
  try {
    if (Array.isArray(window.BAZAAR_RADAR_DATA)) {
      state.opportunities = window.BAZAAR_RADAR_DATA;
    } else {
      const response = await fetch("data/opportunities.json");
      if (!response.ok) {
        throw new Error(`Data request failed with ${response.status}`);
      }
      state.opportunities = await response.json();
    }
    state.activeId = state.opportunities[0]?.id;
    populateFilters();
    bindEvents();
    applyFilters();
  } catch (error) {
    renderLoadError(error);
  }
}

function populateFilters() {
  setOptions(filters.city, ["All cities", ...unique("city")]);
  setOptions(filters.locality, ["All localities", ...unique("locality")]);
  setOptions(filters.sector, ["All sectors", ...unique("sector")]);
}

function unique(key) {
  return [...new Set(state.opportunities.map((item) => item[key]))].sort();
}

function setOptions(select, values) {
  select.innerHTML = values
    .map((value, index) => `<option value="${index === 0 ? "all" : value}">${value}</option>`)
    .join("");
}

function bindEvents() {
  Object.values(filters).forEach((filter) => {
    filter.addEventListener("change", () => {
      state.activePulse = 0;
      applyFilters();
    });
  });

  els.reset.addEventListener("click", () => {
    Object.values(filters).forEach((filter) => {
      filter.selectedIndex = 0;
    });
    state.activePulse = 0;
    state.activeTab = "snapshot";
    applyFilters();
  });

  els.print.addEventListener("click", () => window.print());
}

function applyFilters() {
  const selected = {
    city: filters.city.value,
    locality: filters.locality.value,
    sector: filters.sector.value,
    radius: Number(filters.radius.value),
    budget: Number(filters.budget.value),
    risk: Number(filters.risk.value),
    footfall: Number(filters.footfall.value)
  };

  state.filtered = state.opportunities
    .filter((item) => selected.city === "all" || item.city === selected.city)
    .filter((item) => selected.locality === "all" || item.locality === selected.locality)
    .filter((item) => selected.sector === "all" || item.sector === selected.sector)
    .filter((item) => item.radiusKm <= selected.radius)
    .filter((item) => item.startupCost <= selected.budget)
    .filter((item) => item.riskScore <= selected.risk)
    .filter((item) => item.footfall >= selected.footfall)
    .sort((a, b) => b.earlynessScore - a.earlynessScore);

  if (!state.filtered.some((item) => item.id === state.activeId)) {
    state.activeId = state.filtered[0]?.id ?? null;
  }

  els.count.textContent = state.filtered.length;
  renderCards();
  renderCanvas();
  renderPlan();
  renderTimeline();
}

function renderCards() {
  if (!state.filtered.length) {
    els.cards.innerHTML = `<div class="empty-state">No opportunities match this filter stack. Loosen budget, radius, or risk to reopen the map.</div>`;
    return;
  }

  els.cards.innerHTML = state.filtered
    .map((item, index) => {
      const isActive = item.id === state.activeId ? "active" : "";
      return `
        <article class="opportunity-card signal-strip ${isActive}" data-id="${escapeAttribute(item.id)}" role="button" tabindex="0" aria-label="View plan for ${escapeAttribute(item.name)}">
          <span class="signal-score">${item.earlynessScore}</span>
          <div>
            <div class="card-topline">
              <span class="rank">#${index + 1}</span>
              <span class="chip blue">${escapeHTML(item.city)}</span>
              <span class="chip">${escapeHTML(item.locality)}</span>
              <span class="chip green">${escapeHTML(item.sector)}</span>
            </div>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.thesis)}</p>
            <div class="card-metrics" aria-label="Opportunity metrics">
              <span><strong>${money(item.startupCost)}</strong> capex</span>
              <span><strong>${item.projections.breakEvenMonth} mo</strong> break-even</span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".opportunity-card").forEach((card) => {
    const selectCard = () => {
      state.activeId = card.dataset.id;
      state.activeTab = "snapshot";
      state.activePulse = 0;
      renderCards();
      renderCanvas();
      renderPlan();
      renderTimeline();
    };

    card.addEventListener("click", selectCard);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCard();
      }
    });
  });
}

function renderCanvas() {
  const item = activeOpportunity();
  if (!item) {
    els.canvas.innerHTML = `<div class="empty-state">Run a scan or loosen the filters to reveal a transfer route.</div>`;
    return;
  }

  const route = sourceMarket(item);
  els.canvas.innerHTML = `
    <div class="inspiration-strip" aria-label="Design inspiration">
      <span>Market map</span>
      <span>AI search</span>
      <span>Trading terminal</span>
      <span>Street notebook</span>
    </div>
    <div class="canvas-head">
      <div>
        <p class="eyebrow">Transfer route</p>
        <div class="route-line" aria-label="Business format transfer route">
          <span>${escapeHTML(route)}</span>
          <strong>${escapeHTML(item.city)}</strong>
        </div>
      </div>
      <div class="earlyness-dial" style="--dial: ${item.earlynessScore * 3.6}deg">
        <span>${item.earlynessScore}</span>
        <p>${scoreLabel(item.earlynessScore)}</p>
      </div>
    </div>

    <div class="canvas-hero">
      <p class="eyebrow">Business wave detected</p>
      <h2>${escapeHTML(item.name)}</h2>
      <p>${escapeHTML(item.thesis)}</p>
    </div>

    <div class="wave-layers" aria-hidden="true">
      <span class="wave wave-1"></span>
      <span class="wave wave-2"></span>
      <span class="wave wave-3"></span>
    </div>

    <div class="hard-numbers" aria-label="Selected opportunity metrics">
      ${metric("Capex", money(item.startupCost))}
      ${metric("Gross margin", `${item.unitEconomics.grossMargin}%`)}
      ${metric("Payback", `${item.projections.breakEvenMonth} months`)}
      ${metric("Footfall", formatter.format(item.footfall))}
    </div>

    <div class="research-lens" aria-label="Research basis">
      <div>
        <span class="metric-label">Source market proof</span>
        <strong>${escapeHTML(item.sourceMarket || sourceMarket(item))}</strong>
      </div>
      <div>
        <span class="metric-label">Arbitrage thesis</span>
        <p>${escapeHTML(item.researchBasis || "Transferable demand pattern with visible source-market proof and local under-penetration.")}</p>
      </div>
    </div>

    <div class="receipt-board" aria-label="Evidence receipts">
      ${item.evidence.map((chip, index) => `
        <button class="proof-receipt ${escapeAttribute(chip.tone)} receipt-${index + 1}" type="button">
          <span>${escapeHTML(chip.label)}</span>
          <strong>${receiptCopy(chip.label)}</strong>
          <small>Tap Street Pulse below to verify locally.</small>
        </button>
      `).join("")}
    </div>
  `;
}

function renderPlan() {
  const item = activeOpportunity();
  if (!item) {
    els.plan.innerHTML = `<div class="empty-state">Select a live opportunity to generate the business plan.</div>`;
    return;
  }

  els.plan.innerHTML = `
    <div class="plan-title">
      <div>
        <p class="eyebrow">Business plan</p>
        <h2>${escapeHTML(item.name)}</h2>
        <p>${escapeHTML(item.city)} / ${escapeHTML(item.locality)} / ${item.radiusKm} km catchment</p>
      </div>
      <div class="earlyness-card plan-score">
        <span class="metric-label">Earlyness</span>
        <strong>${item.earlynessScore}</strong>
        <div class="earlyness-track" aria-hidden="true">
          <span style="width: ${item.earlynessScore}%"></span>
        </div>
        <p>${scoreLabel(item.earlynessScore)}</p>
      </div>
    </div>
    <div class="tab-list" role="tablist">
      ${tabButton("snapshot", "Snapshot")}
      ${tabButton("economics", "Unit Econ")}
      ${tabButton("projections", "Projections")}
      ${tabButton("marketing", "Marketing")}
      ${tabButton("risks", "Risks")}
    </div>
    <div class="tab-panel">${tabContent(item)}</div>
    <section class="export-studio" aria-label="Business plan and pitch deck export">
      <p class="eyebrow">Export studio</p>
      <label>
        <span>Startup name</span>
        <input id="startupName" type="text" value="${escapeAttribute(item.name)}">
      </label>
      <label>
        <span>Founder / team</span>
        <input id="founderName" type="text" value="Founder Team">
      </label>
      <label>
        <span>Language</span>
        <select id="exportLanguage">
          <option value="en">English</option>
          <option value="hi">Hindi</option>
        </select>
      </label>
      <label>
        <span>Deck template</span>
        <select id="deckTemplate">
          ${templateLibrary.map((template) => `<option value="${template.id}">${template.name}</option>`).join("")}
        </select>
      </label>
      <div class="export-actions">
        <button id="downloadPlan" type="button">Business plan PDF</button>
        <button id="downloadDeck" type="button">Pitch deck PDF</button>
        <button id="randomTemplate" type="button">Randomize style</button>
      </div>
    </section>
  `;

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      renderPlan();
    });
  });

  bindExportControls(item);
}

function tabButton(id, label) {
  const selected = state.activeTab === id;
  return `<button class="tab-button ${selected ? "active" : ""}" data-tab="${id}" type="button" role="tab" aria-selected="${selected}">${label}</button>`;
}

function tabContent(item) {
  const tabs = {
    snapshot: `
      <div class="metric-grid">
        ${metric("Startup cost", money(item.startupCost))}
        ${metric("Daily footfall", formatter.format(item.footfall))}
        ${metric("Payback", `${item.projections.breakEvenMonth} months`)}
        ${metric("Risk score", `${item.riskScore}/100`)}
      </div>
      <div class="score-breakdown">
        ${breakdown("Novelty", item.scoreBreakdown.novelty)}
        ${breakdown("Demand", item.scoreBreakdown.demand)}
        ${breakdown("Timing", item.scoreBreakdown.timing)}
        ${breakdown("Moat", item.scoreBreakdown.moat)}
      </div>
      <ul class="brief-list">
        <li class="win">${escapeHTML(item.snapshot)}</li>
      </ul>
    `,
    economics: `
      <div class="metric-grid">
        ${metric("Ticket", money(item.unitEconomics.avgTicket))}
        ${metric("Gross margin", `${item.unitEconomics.grossMargin}%`)}
        ${metric("Daily orders", item.unitEconomics.dailyOrders)}
        ${metric("Rent range", money(item.unitEconomics.rent))}
      </div>
      <div class="cost-breakdown">
        <p class="eyebrow">Startup cost breakdown</p>
        ${costBreakdown(item).map((row) => `
          <div class="cost-row">
            <span>${escapeHTML(row.label)}</span>
            <strong>${money(row.amount)}</strong>
          </div>
        `).join("")}
        <p class="assumption-note">Source logic: prototype estimates use sector benchmarks, local rent assumptions, lean equipment setup, launch inventory, licensing/compliance, and a 10 percent contingency. Treat as a planning range until verified with local vendor quotes.</p>
      </div>
      <ul class="brief-list">
        ${item.unitEconomics.notes.map((note) => `<li>${escapeHTML(note)}</li>`).join("")}
      </ul>
    `,
    projections: `
      <div class="metric-grid">
        ${metric("Month 3 revenue", money(item.projections.month3Revenue))}
        ${metric("Month 6 revenue", money(item.projections.month6Revenue))}
        ${metric("Month 12 revenue", money(item.projections.month12Revenue))}
        ${metric("Break-even", `${item.projections.breakEvenMonth} month`)}
      </div>
      <ul class="brief-list">
        ${item.projections.notes.map((note) => `<li class="win">${escapeHTML(note)}</li>`).join("")}
      </ul>
    `,
    marketing: `
      <ul class="brief-list">
        ${item.marketingPlan.map((step) => `<li class="win">${escapeHTML(step)}</li>`).join("")}
      </ul>
    `,
    risks: `
      <ul class="brief-list">
        ${item.risks.map((risk) => `<li class="risk">${escapeHTML(risk)}</li>`).join("")}
      </ul>
    `
  };

  return tabs[state.activeTab];
}

function renderTimeline() {
  const item = activeOpportunity();
  if (!item) {
    els.timeline.innerHTML = "";
    els.pulseCity.textContent = "";
    return;
  }

  els.pulseCity.textContent = `${item.city} / ${item.locality}`;
  els.timeline.innerHTML = item.streetPulse
    .map((pulse, index) => `
      <div class="pulse-item ${index === state.activePulse ? "active" : ""}">
        <button type="button" data-pulse="${index}">
          <span class="pulse-date">${escapeHTML(pulse.date)}</span>
          <strong>${escapeHTML(pulse.signal)}</strong>
          <p>${escapeHTML(index === state.activePulse ? pulse.detail : pulse.short)}</p>
        </button>
      </div>
    `)
    .join("");

  document.querySelectorAll("[data-pulse]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePulse = Number(button.dataset.pulse);
      renderTimeline();
    });
  });
}

function activeOpportunity() {
  return state.opportunities.find((item) => item.id === state.activeId);
}

function metric(label, value) {
  return `
    <div class="metric">
      <span class="metric-label">${escapeHTML(label)}</span>
      <strong class="metric-value">${escapeHTML(String(value))}</strong>
    </div>
  `;
}

function breakdown(label, value) {
  return `
    <div class="bar-row">
      <span>${escapeHTML(label)}</span>
      <div class="bar"><span style="width: ${value}%"></span></div>
      <strong>${value}</strong>
    </div>
  `;
}

function money(value) {
  return `Rs ${formatter.format(value)}`;
}

function costBreakdown(item) {
  const cost = item.startupCost;
  const splits = [
    ["Equipment and fit-out", 0.32],
    ["Deposit and first rent", 0.18],
    ["Initial inventory", 0.16],
    ["Licenses and compliance", 0.08],
    ["Launch marketing", 0.12],
    ["Working capital buffer", 0.14]
  ];
  let used = 0;
  return splits.map(([label, pct], index) => {
    const amount = index === splits.length - 1 ? cost - used : Math.round(cost * pct);
    used += amount;
    return { label, amount };
  });
}

function bindExportControls(item) {
  const plan = document.querySelector("#downloadPlan");
  const deck = document.querySelector("#downloadDeck");
  const random = document.querySelector("#randomTemplate");
  if (!plan || !deck || !random) return;
  plan.addEventListener("click", () => exportBusinessPlan(item));
  deck.addEventListener("click", () => exportPitchDeck(item));
  random.addEventListener("click", () => {
    const select = document.querySelector("#deckTemplate");
    select.selectedIndex = Math.floor(Math.random() * templateLibrary.length);
  });
}

function exportContext() {
  const templateId = document.querySelector("#deckTemplate")?.value ?? templateLibrary[0].id;
  return {
    startupName: document.querySelector("#startupName")?.value.trim() || "New Venture",
    founderName: document.querySelector("#founderName")?.value.trim() || "Founder Team",
    language: document.querySelector("#exportLanguage")?.value ?? "en",
    template: templateLibrary.find((template) => template.id === templateId) ?? templateLibrary[0]
  };
}

function exportBusinessPlan(item) {
  const context = exportContext();
  openPrintableDocument(`${context.startupName} Business Plan`, businessPlanHTML(item, context));
}

function exportPitchDeck(item) {
  const context = exportContext();
  openPrintableDocument(`${context.startupName} Pitch Deck`, pitchDeckHTML(item, context));
}

function openPrintableDocument(title, body) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHTML(title)}</title>${printStyles()}</head><body>${body}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function printStyles() {
  return `<style>
    @page { size: landscape; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; background: #111; }
    .doc { --bg:#fff; --ink:#111827; --muted:#64748b; --accent:#2563eb; --accent2:#111827; background: var(--bg); color: var(--ink); }
    .slide { position: relative; width: 100vw; min-height: 100vh; overflow: hidden; padding: 44px 52px; break-after: page; background: var(--bg); color: var(--ink); }
    .slide::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .9; }
    .doc[data-pattern="grid"] .slide::before, .doc[data-pattern="blueprint"] .slide::before { background: linear-gradient(rgba(0,0,0,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.06) 1px, transparent 1px); background-size: 34px 34px; }
    .doc[data-pattern="dark"] .slide::before { background: radial-gradient(circle at 80% 18%, color-mix(in srgb, var(--accent), transparent 60%), transparent 30%); }
    .doc[data-pattern="receipt"] .slide::before { background: repeating-linear-gradient(0deg, rgba(0,0,0,.045), rgba(0,0,0,.045) 1px, transparent 1px, transparent 24px); }
    .doc[data-pattern="bold"] .slide::before { background: radial-gradient(circle at 92% 8%, color-mix(in srgb, var(--accent), transparent 45%), transparent 26%), radial-gradient(circle at 8% 92%, color-mix(in srgb, var(--accent2), transparent 70%), transparent 28%); }
    .content { position: relative; z-index: 1; height: calc(100vh - 88px); display: grid; align-content: start; }
    .split { display: grid; grid-template-columns: 1.1fr .9fr; gap: 34px; align-items: center; }
    .three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .two { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .eyebrow { display: inline-flex; width: max-content; align-items: center; min-height: 28px; padding: 0 10px; border: 1px solid color-mix(in srgb, var(--ink), transparent 68%); border-radius: 999px; color: var(--ink); background: color-mix(in srgb, var(--accent), transparent 72%); font-size: 11px; font-weight: 800; letter-spacing: .02em; text-transform: uppercase; }
    h1 { max-width: 920px; margin: 18px 0 16px; font-family: "Arial Narrow", Impact, Inter, sans-serif; font-size: clamp(58px, 8vw, 116px); line-height: .86; letter-spacing: 0; text-transform: uppercase; }
    h2 { max-width: 820px; margin: 10px 0 14px; font-size: 44px; line-height: .98; letter-spacing: -.02em; }
    h3 { margin: 0 0 8px; font-size: 22px; line-height: 1.05; }
    p, li { font-size: 17px; line-height: 1.46; color: color-mix(in srgb, var(--ink), var(--muted) 34%); }
    ul, ol { margin: 0; padding-left: 22px; }
    li { margin-bottom: 8px; }
    .lead { max-width: 780px; font-size: 24px; line-height: 1.25; color: var(--ink); }
    .caption { color: var(--muted); font-size: 13px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 22px; }
    .kpi, .card, .receipt, .bar-card { border: 1px solid color-mix(in srgb, var(--ink), transparent 72%); border-radius: 22px; background: color-mix(in srgb, var(--bg), white 38%); padding: 18px; box-shadow: 0 18px 60px rgba(0,0,0,.08); }
    .kpi span { display: block; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .kpi strong { display: block; margin-top: 8px; font-size: 30px; line-height: 1; }
    .mega-number { font-family: "Arial Narrow", Impact, sans-serif; font-size: 118px; line-height: .85; color: var(--accent); }
    .route { display: grid; grid-template-columns: 1fr 80px 1fr; gap: 12px; align-items: center; margin-top: 24px; }
    .route > div { min-height: 150px; border: 2px solid var(--ink); border-radius: 28px; padding: 18px; background: color-mix(in srgb, var(--accent), transparent 82%); }
    .arrow { display: grid; place-items: center; min-height: 80px; border-radius: 999px; background: var(--accent); color: #111; font-size: 36px; font-weight: 900; }
    .bars { display: grid; gap: 12px; }
    .bar-row { display: grid; grid-template-columns: 150px 1fr 70px; gap: 10px; align-items: center; font-size: 14px; }
    .bar { height: 18px; border-radius: 999px; background: color-mix(in srgb, var(--ink), transparent 86%); overflow: hidden; }
    .bar span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--accent2)); }
    .funds { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: center; }
    .donut { width: 280px; height: 280px; border-radius: 50%; background: conic-gradient(var(--accent) 0 32%, var(--accent2) 32% 50%, #ff7a00 50% 66%, #18a558 66% 78%, #ef4444 78% 90%, #94a3b8 90% 100%); display: grid; place-items: center; color: var(--ink); font-weight: 900; margin: auto; }
    .donut span { display: grid; place-items: center; width: 150px; height: 150px; border-radius: 50%; background: var(--bg); text-align: center; }
    .timeline { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-top: 20px; }
    .timeline .card { min-height: 170px; }
    .quote { border-left: 8px solid var(--accent); padding-left: 18px; font-size: 30px; line-height: 1.18; color: var(--ink); }
    .footer { position: absolute; left: 52px; right: 52px; bottom: 24px; display: flex; justify-content: space-between; color: var(--muted); font-size: 12px; }
    @media print { body { background: transparent; } .slide { width: 100vw; height: 100vh; } }
  </style>`;
}

function businessPlanHTML(item, context) {
  const hi = context.language === "hi";
  const title = hi ? "निवेशक-तैयार व्यापार योजना" : "Investor-ready business plan";
  return `<main class="doc" data-pattern="${context.template.pattern}" style="${templateVars(context)}">
    ${slideShell(context, 1, `<span class="eyebrow">${title}</span><h1>${escapeHTML(context.startupName)}</h1><p class="lead">${escapeHTML(item.thesis)}</p><div class="kpi-grid">${kpi("Founder", context.founderName)}${kpi("City", `${item.city} / ${item.locality}`)}${kpi("Capex", money(item.startupCost))}${kpi("Payback", `${item.projections.breakEvenMonth} mo`)}</div>`)}
    ${slideShell(context, 2, `<span class="eyebrow">${hi ? "सारांश" : "Executive summary"}</span><h2>${hi ? "यह अवसर क्यों मजबूत है" : "Why this opportunity is investable"}</h2><p class="lead">${escapeHTML(item.snapshot)}</p><div class="three">${item.evidence.map((e)=>receipt(e.label, receiptCopy(e.label))).join("")}</div>`)}
    ${slideShell(context, 3, `<span class="eyebrow">${hi ? "ग्राहक और बाजार" : "Customer and market"}</span><h2>${escapeHTML(item.city)} में शुरुआती मांग / Early demand</h2><div class="split"><div><p>${escapeHTML(item.thesis)}</p><ul><li>Target catchment: ${escapeHTML(item.locality)} within ${item.radiusKm} km.</li><li>Footfall proxy: ${formatter.format(item.footfall)} daily.</li><li>Earlyness score: ${item.earlynessScore}/100.</li></ul></div>${marketGraphic(item)}</div>`)}
    ${slideShell(context, 4, `<span class="eyebrow">${hi ? "लागत" : "Startup cost logic"}</span><h2>${money(item.startupCost)} setup estimate</h2><div class="funds"><div class="donut"><span>Use of<br>funds</span></div><div>${costTable(item)}</div></div><p class="caption">Planning estimate based on lean first outlet assumptions. Replace with local vendor quotations before investment.</p>`)}
    ${slideShell(context, 5, `<span class="eyebrow">${hi ? "यूनिट इकॉनॉमिक्स" : "Unit economics"}</span><h2>Daily orders drive the model</h2><div class="kpi-grid">${kpi("Avg ticket", money(item.unitEconomics.avgTicket))}${kpi("Gross margin", `${item.unitEconomics.grossMargin}%`)}${kpi("Daily orders", item.unitEconomics.dailyOrders)}${kpi("Rent", money(item.unitEconomics.rent))}</div><div class="bars">${scoreBars(item)}</div>`)}
    ${slideShell(context, 6, `<span class="eyebrow">${hi ? "मार्केटिंग" : "Go-to-market"}</span><h2>First 30 days launch plan</h2><div class="timeline">${item.marketingPlan.map((m, i)=>`<div class="card"><h3>Week ${i + 1}</h3><p>${escapeHTML(m)}</p></div>`).join("")}</div>`)}
    ${slideShell(context, 7, `<span class="eyebrow">${hi ? "जोखिम" : "Risks"}</span><h2>What can kill this business</h2><div class="three">${item.risks.map((risk)=>`<div class="card"><h3>Risk</h3><p>${escapeHTML(risk)}</p></div>`).join("")}</div>`)}
    ${slideShell(context, 8, `<span class="eyebrow">${hi ? "सत्यापन" : "Validation plan"}</span><h2>14-day proof sprint</h2><div class="timeline">${item.streetPulse.map((pulse)=>`<div class="card"><h3>${escapeHTML(pulse.date)}</h3><p><strong>${escapeHTML(pulse.signal)}</strong></p><p>${escapeHTML(pulse.detail)}</p></div>`).join("")}</div>`)}
  </main>`;
}

function pitchDeckHTML(item, context) {
  const hi = context.language === "hi";
  const label = {
    investor: hi ? "निवेशक पिच डेक" : "Investor pitch deck",
    problem: hi ? "समस्या" : "Problem",
    solution: hi ? "समाधान" : "Solution",
    whyNow: hi ? "अभी क्यों" : "Why now",
    customer: hi ? "ग्राहक" : "Customer",
    proof: hi ? "प्रूफ सिग्नल" : "Proof signals",
    format: hi ? "प्रोडक्ट / फॉर्मेट" : "Product / format",
    model: hi ? "बिजनेस मॉडल" : "Business model",
    funds: hi ? "फंड का उपयोग" : "Use of funds",
    traction: hi ? "ट्रैक्शन प्लान" : "Traction plan",
    gtm: hi ? "गो-टू-मार्केट" : "Go-to-market",
    finance: hi ? "वित्तीय अनुमान" : "Financial projection",
    risk: hi ? "जोखिम नियंत्रण" : "Risk control",
    ask: hi ? "निवेश प्रस्ताव" : "Investment ask"
  };
  return `<main class="doc" data-pattern="${context.template.pattern}" style="${templateVars(context)}">
    ${slideShell(context, 1, `<span class="eyebrow">${label.investor}</span><h1>${escapeHTML(context.startupName)}</h1><p class="lead">${escapeHTML(item.thesis)}</p><div class="kpi-grid">${kpi(hi ? "संस्थापक" : "Founder", context.founderName)}${kpi(hi ? "अवसर" : "Opportunity", item.name)}${kpi(hi ? "बाजार" : "Market", `${item.city}`)}${kpi(hi ? "राउंड" : "Ask", hi ? "सीड / एंजेल" : "Seed / Angel")}</div>`)}
    ${slideShell(context, 2, `<span class="eyebrow">${label.problem}</span><h2>${hi ? "ऑफलाइन अवसर धीरे-धीरे फैलते हैं। स्थानीय फाउंडर अक्सर देर से देखते हैं।" : "Offline opportunities travel slowly. Local founders see them late."}</h2><p class="lead">${hi ? "जो फॉर्मेट एक शहर में काम करता है, उसे समान बाजारों तक पहुँचने में महीनों या साल लग सकते हैं। जो फाउंडर इस गैप को जल्दी पकड़ता है, वह saturation से पहले local mindshare जीत सकता है।" : "Formats that work in one city often take months or years to reach comparable markets. The founder who spots the gap early can capture local mindshare before saturation."}</p>`)}
    ${slideShell(context, 3, `<span class="eyebrow">${label.solution}</span><h2>${escapeHTML(item.name)}</h2><p class="lead">${escapeHTML(item.thesis)}</p><div class="route"><div><h3>${hi ? "Source proof" : "Source proof"}</h3><p>${escapeHTML(sourceMarket(item))}</p></div><span class="arrow">→</span><div><h3>${hi ? "Target gap" : "Target gap"}</h3><p>${escapeHTML(item.city)} / ${escapeHTML(item.locality)}</p></div></div>`)}
    ${slideShell(context, 4, `<span class="eyebrow">${label.whyNow}</span><h2>${item.earlynessScore}/100 ${hi ? "earlyness window" : "earlyness window"}</h2><div class="split"><p class="quote">${escapeHTML(item.snapshot)}</p><div class="bars">${scoreBars(item)}</div></div>`)}
    ${slideShell(context, 5, `<span class="eyebrow">${label.customer}</span><h2>${hi ? "स्थानीय demand pocket" : "Local demand pocket"}</h2><div class="split"><div><p>${hi ? "Primary catchment" : "Primary catchment"}: <strong>${escapeHTML(item.locality)}</strong>, ${item.radiusKm} km.</p><p>${hi ? "Footfall proxy" : "Footfall proxy"}: <strong>${formatter.format(item.footfall)}</strong> daily.</p><p>${hi ? "लोग adjacent categories में पहले से spend कर रहे हैं, लेकिन exact format अभी under-served है।" : "Initial customer thesis: people already spend in adjacent categories, but the exact format is still under-served."}</p></div>${marketGraphic(item)}</div>`)}
    ${slideShell(context, 6, `<span class="eyebrow">${label.proof}</span><h2>${hi ? "Lease से पहले evidence" : "Evidence before lease"}</h2><div class="three">${item.evidence.map((e)=>receipt(e.label, receiptCopy(e.label))).join("")}</div>`)}
    ${slideShell(context, 7, `<span class="eyebrow">${label.format}</span><h2>${hi ? "Lean first outlet, vanity flagship नहीं" : "Lean first outlet, not a vanity flagship"}</h2><div class="two">${item.unitEconomics.notes.map((note)=>`<div class="card"><h3>${hi ? "Operating principle" : "Operating principle"}</h3><p>${escapeHTML(note)}</p></div>`).join("")}</div>`)}
    ${slideShell(context, 8, `<span class="eyebrow">${label.model}</span><h2>${hi ? "Unit economics" : "Unit economics"}</h2><div class="kpi-grid">${kpi(hi ? "Avg ticket" : "Avg ticket", money(item.unitEconomics.avgTicket))}${kpi(hi ? "Gross margin" : "Gross margin", `${item.unitEconomics.grossMargin}%`)}${kpi(hi ? "Daily orders" : "Daily orders", item.unitEconomics.dailyOrders)}${kpi(hi ? "Break-even" : "Break-even", `${item.projections.breakEvenMonth} mo`)}</div>`)}
    ${slideShell(context, 9, `<span class="eyebrow">${label.funds}</span><h2>${money(item.startupCost)} ${hi ? "launch budget" : "launch budget"}</h2><div class="funds"><div class="donut"><span>${hi ? "Launch<br>capital" : "Launch<br>capital"}</span></div><div>${costTable(item)}</div></div>`)}
    ${slideShell(context, 10, `<span class="eyebrow">${label.traction}</span><h2>${hi ? "Scaling से पहले validation sprint" : "Validation sprint before scaling"}</h2><div class="timeline">${item.streetPulse.map((pulse)=>`<div class="card"><h3>${escapeHTML(pulse.date)}</h3><p><strong>${escapeHTML(pulse.signal)}</strong></p><p>${escapeHTML(pulse.short)}</p></div>`).join("")}</div>`)}
    ${slideShell(context, 11, `<span class="eyebrow">${label.gtm}</span><h2>${hi ? "पहले 30 दिन" : "First 30 days"}</h2><div class="timeline">${item.marketingPlan.map((m, i)=>`<div class="card"><h3>${hi ? "Move" : "Move"} ${i + 1}</h3><p>${escapeHTML(m)}</p></div>`).join("")}</div>`)}
    ${slideShell(context, 12, `<span class="eyebrow">${label.finance}</span><h2>${hi ? "Revenue ramp" : "Revenue ramp"}</h2><div class="bars">${projectionBars(item)}</div><div class="kpi-grid">${kpi("Month 3", money(item.projections.month3Revenue))}${kpi("Month 6", money(item.projections.month6Revenue))}${kpi("Month 12", money(item.projections.month12Revenue))}${kpi("Payback", `${item.projections.breakEvenMonth} mo`)}</div>`)}
    ${slideShell(context, 13, `<span class="eyebrow">${label.risk}</span><h2>${hi ? "Known risks, planned mitigations" : "Known risks, planned mitigations"}</h2><div class="three">${item.risks.map((risk)=>`<div class="card"><h3>${hi ? "Risk" : "Risk"}</h3><p>${escapeHTML(risk)}</p></div>`).join("")}</div>`)}
    ${slideShell(context, 14, `<span class="eyebrow">${label.ask}</span><h2>${hi ? "Format saturate होने से पहले local operator को back करें" : "Back the local operator before the format saturates"}</h2><p class="lead">${hi ? `Funding fit-out, launch marketing, working capital और rapid validation के लिए है। अगला milestone ${escapeHTML(item.locality)} में repeat purchase और scalable acquisition channel prove करना है।` : `Funding supports fit-out, launch marketing, working capital, and rapid validation. The next milestone is proof of repeat purchase and one scalable acquisition channel in ${escapeHTML(item.locality)}.`}</p><div class="kpi-grid">${kpi(hi ? "संस्थापक" : "Founder", context.founderName)}${kpi(hi ? "Capital use" : "Capital use", hi ? "Launch + validation" : "Launch + validation")}${kpi(hi ? "Milestone" : "Milestone", "100 paid orders")}${kpi(hi ? "Next step" : "Next step", "Investor Q&A")}</div>`)}
  </main>`;
}

function templateVars(context) {
  const template = context.template;
  return `--bg:${template.bg};--ink:${template.ink};--muted:${template.muted};--accent:${template.accent};--accent2:${template.accent2}`;
}

function slideShell(context, index, content) {
  return `<section class="slide"><div class="content">${content}</div><div class="footer"><span>${escapeHTML(context.startupName)}</span><span>${String(index).padStart(2, "0")} / Bazaar Radar</span></div></section>`;
}

function kpi(label, value) {
  return `<div class="kpi"><span>${escapeHTML(label)}</span><strong>${escapeHTML(String(value))}</strong></div>`;
}

function receipt(label, text) {
  return `<div class="receipt"><h3>${escapeHTML(label)}</h3><p>${escapeHTML(text)}</p><p class="caption">Validation note: confirm with local customer interviews, competitor counts, and vendor quotes.</p></div>`;
}

function marketGraphic(item) {
  return `<div class="bar-card">
    <h3>Market signal stack</h3>
    <div class="bars">
      ${barRow("Earlyness", item.earlynessScore)}
      ${barRow("Demand", item.scoreBreakdown.demand)}
      ${barRow("Timing", item.scoreBreakdown.timing)}
      ${barRow("Moat", item.scoreBreakdown.moat)}
    </div>
  </div>`;
}

function costTable(item) {
  return `<div class="bars">${costBreakdown(item).map((row) => {
    const pct = Math.round((row.amount / item.startupCost) * 100);
    return barRow(row.label, pct, money(row.amount));
  }).join("")}</div>`;
}

function scoreBars(item) {
  return [
    ["Novelty", item.scoreBreakdown.novelty],
    ["Demand", item.scoreBreakdown.demand],
    ["Timing", item.scoreBreakdown.timing],
    ["Moat", item.scoreBreakdown.moat]
  ].map(([label, value]) => barRow(label, value)).join("");
}

function projectionBars(item) {
  const max = Math.max(item.projections.month3Revenue, item.projections.month6Revenue, item.projections.month12Revenue);
  return [
    ["Month 3", item.projections.month3Revenue],
    ["Month 6", item.projections.month6Revenue],
    ["Month 12", item.projections.month12Revenue]
  ].map(([label, value]) => barRow(label, Math.round((value / max) * 100), money(value))).join("");
}

function barRow(label, value, displayValue = `${value}/100`) {
  const width = Math.max(3, Math.min(100, Number(value)));
  return `<div class="bar-row"><span>${escapeHTML(label)}</span><div class="bar"><span style="width:${width}%"></span></div><strong>${escapeHTML(displayValue)}</strong></div>`;
}

function sourceMarket(item) {
  if (item.name.toLowerCase().includes("misal")) return "Pune / Nashik";
  if (item.sector === "Mobility") return "Bengaluru fleet belts";
  if (item.sector === "Creator Tools") return "Jaipur maker clusters";
  if (item.sector === "Services") return "Ahmedabad societies";
  return "Proven nearby city";
}

function receiptCopy(label) {
  const copy = {
    "student belt": "Dense repeat audience, low education cost.",
    "high repeat": "Habit-forming format with frequent purchase loops.",
    "spice theatre": "The product can become a visible street ritual.",
    "night market": "Existing late-night footfall lowers launch friction.",
    "low capex": "Cart-first model keeps experiments cheap.",
    "taste risk": "Needs local adaptation before scaling.",
    "office clusters": "Predictable weekday lunch demand.",
    "group orders": "Batching improves delivery economics.",
    "delivery mess": "Packaging quality is the make-or-break detail."
  };
  return copy[label] ?? "Useful proxy signal, needs local validation.";
}

function scoreLabel(score) {
  if (score >= 90) return "Very early";
  if (score >= 75) return "Early";
  if (score >= 60) return "Possible";
  if (score >= 40) return "Crowded";
  return "Late";
}

function renderLoadError(error) {
  const message = `
    <div class="empty-state">
      <strong>Opportunity data could not be loaded.</strong>
      <p>Run this folder through a local static server, then reload the app. Details: ${escapeHTML(error.message)}</p>
    </div>
  `;
  els.cards.innerHTML = message;
  els.plan.innerHTML = message;
  els.timeline.innerHTML = "";
  els.count.textContent = "0";
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value).replaceAll("`", "&#096;");
}
