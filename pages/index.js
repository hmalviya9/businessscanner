import Head from "next/head";
import Script from "next/script";

export default function Home() {
  return (
    <>
      <Head>
        <title>Bazaar Radar</title>
        <meta
          name="description"
          content="India-first offline business opportunity discovery workspace."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <div className="app-shell">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              ↗
            </span>
            <div>
              <p className="eyebrow">
                Inspired by market maps / AI search / trading desks
              </p>
              <h1>Bazaar Radar</h1>
            </div>
          </div>
          <div className="design-note">
            <strong>Business waves</strong>
            <span>spot what is moving city to city</span>
          </div>
          <div className="topbar-actions">
            <a className="ghost-button link-button" href="/pitch-coach">
              Pitch coach
            </a>
            <button className="ghost-button" id="resetFilters" type="button">
              Reset
            </button>
            <button className="print-button" id="printReport" type="button">
              Founder memo
            </button>
          </div>
        </header>

        <section className="command-rail" aria-label="Scan controls">
          <div className="rail-label">
            <span>Run scan</span>
            <strong>City arbitrage</strong>
          </div>
          <label>
            <span>Target city</span>
            <select id="cityFilter" />
          </label>

          <label>
            <span>Sector</span>
            <select id="sectorFilter" />
          </label>

          <label>
            <span>Budget</span>
            <select id="budgetFilter" defaultValue="99999999">
              <option value="99999999">Any budget</option>
              <option value="500000">Under Rs 5L</option>
              <option value="1000000">Under Rs 10L</option>
              <option value="2000000">Under Rs 20L</option>
              <option value="3500000">Under Rs 35L</option>
            </select>
          </label>

          <label>
            <span>Radius</span>
            <select id="radiusFilter" defaultValue="99">
              <option value="99">Any radius</option>
              <option value="1">1 km</option>
              <option value="2">2 km</option>
              <option value="3">3 km</option>
              <option value="5">5 km</option>
            </select>
          </label>

          <label>
            <span>Risk</span>
            <select id="riskFilter" defaultValue="99">
              <option value="99">Any risk</option>
              <option value="35">Low risk</option>
              <option value="55">Medium risk</option>
              <option value="75">Higher risk</option>
            </select>
          </label>

          <details className="advanced-controls">
            <summary>Advanced</summary>
            <label>
              <span>Locality</span>
              <select id="localityFilter" />
            </label>

            <label>
              <span>Footfall</span>
              <select id="footfallFilter" defaultValue="0">
                <option value="0">Any footfall</option>
                <option value="1500">1500+ daily</option>
                <option value="3000">3000+ daily</option>
                <option value="5000">5000+ daily</option>
              </select>
            </label>
          </details>
        </section>

        <main className="workspace">
          <section className="cards-panel signal-stack" aria-label="Ranked opportunities">
            <div className="section-head">
              <div>
                <p className="eyebrow">Signal stack</p>
                <h2>
                  <span id="matchCount">0</span> market windows
                </h2>
              </div>
              <span className="live-dot">Watchlist</span>
            </div>
            <div id="opportunityCards" className="opportunity-grid" />
          </section>

          <section className="transfer-canvas" aria-label="Market transfer canvas">
            <div id="canvasContent" />
            <div className="proof-timeline">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Proof receipts</p>
                  <h2>Street Pulse</h2>
                </div>
                <span id="pulseCity" className="mono" />
              </div>
              <div id="timeline" className="timeline" />
            </div>
          </section>

          <aside className="plan-panel" aria-label="Business plan">
            <div id="planContent" />
            <section className="scout-panel" aria-label="Scout assistant prompts">
              <div className="chat-head">
                <strong>Scout</strong>
                <span>field analyst</span>
              </div>
              <div className="prompt-chips">
                <button type="button">Make this cheaper</button>
                <button type="button">Find the unfair wedge</button>
                <button type="button">Break this plan</button>
              </div>
            </section>
          </aside>
        </main>
      </div>

      <Script src="/data/opportunities.js" strategy="beforeInteractive" />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
