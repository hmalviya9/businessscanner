# Offline Opportunity Discovery Engine: Data Strategy

## 1. City And Opportunity Schema

Prototype storage should start as local JSON files with stable IDs. The first useful entities are `city`, `sector`, `opportunity`, `city_signal`, `opportunity_signal`, and `generated_plan`.

### City

```json
{
  "city_id": "pune_mh",
  "name": "Pune",
  "state": "Maharashtra",
  "tier": 1,
  "lat": 18.5204,
  "lng": 73.8567,
  "population_estimate": 7400000,
  "median_income_band": "upper_mid",
  "student_density_band": "high",
  "office_density_band": "high",
  "tourism_band": "medium",
  "source_confidence": 0.72
}
```

### Opportunity

```json
{
  "opportunity_id": "custom_misal_pav_qsr",
  "name": "Customized Misal Pav QSR",
  "sector": "food_beverage",
  "format": "offline_qsr",
  "investment_min_inr": 400000,
  "investment_max_inr": 1200000,
  "risk_level": "medium",
  "ideal_radius_km": 4,
  "target_customers": ["students", "office_workers", "families"],
  "success_city_ids": ["pune_mh", "nashik_mh"],
  "best_for_city_tiers": [1, 2, 3],
  "unit_economics_template_id": "qsr_small_format",
  "tags": ["regional_food", "customization", "high_repeat"]
}
```

### City Opportunity Signal

```json
{
  "city_id": "nagpur_mh",
  "opportunity_id": "custom_misal_pav_qsr",
  "poi_supply_count": 14,
  "adjacent_success_score": 0.78,
  "local_demand_score": 0.64,
  "competition_density_score": 0.31,
  "under_penetration_score": 0.69,
  "earlyness_score": 0.74,
  "unit_economics_score": 0.62,
  "overall_score": 0.69,
  "confidence": 0.58,
  "last_refreshed": "2026-04-25"
}
```

## 2. MVP Data Sources And Proxy Signals

Use public or low-friction sources first. Store raw snapshots in `data/raw/`, normalized JSON in `data/processed/`, and seed hand-curated assumptions in `data/seeds/`.

| Need | MVP Source | Proxy Signal |
|---|---|---|
| Existing local supply | OpenStreetMap Overpass, Google Places | POI count by category, review count, rating count, recency of new listings |
| Adjacent-city success | Google Places, Instagram/manual research, food delivery search, map listings | High review velocity, many similar operators, rating stability, category clustering |
| Demand | Google Trends, social search, local keywords, college/office/tourism density | Search interest, hashtag activity, nearby institutions, commute zones |
| Affordability | Census/public city data, local rent heuristics, brokerage listings/manual samples | Income band, rent band, purchasing-power band |
| Footfall | OSM transit/market/college/office POIs, maps | Count of colleges, metro/rail stops, malls, markets, offices within radius |
| Risk | Capex range, operational complexity, license burden, spoilage, labor intensity | Risk appetite match, failure-mode count |
| Local constraints | data.gov.in, OpenCity, state/city portals | civic zones, infra context, demographics, public services |

Do not block the prototype on perfect data. The first version should combine coarse automated signals with editable analyst notes.

## 3. Opportunity Scoring Formula

Score each opportunity for a selected city and radius.

```text
overall_score =
  0.22 * adjacent_success_score +
  0.20 * under_penetration_score +
  0.16 * local_demand_score +
  0.14 * unit_economics_score +
  0.10 * risk_fit_score +
  0.08 * radius_fit_score +
  0.06 * timing_earlyness_score +
  0.04 * founder_fit_score
```

MVP defaults:

- `adjacent_success_score`: are similar ideas visibly working in nearby/adjacent cities?
- `under_penetration_score`: is local supply low relative to demand proxies?
- `local_demand_score`: are the right customers nearby?
- `unit_economics_score`: can the model plausibly pay back within the user investment range?
- `risk_fit_score`: does the opportunity match user risk appetite?
- `radius_fit_score`: is enough demand reachable within selected radius?
- `timing_earlyness_score`: is the idea early but not too early?
- `founder_fit_score`: optional user-entered strengths, experience, or assets.

Confidence should be shown separately from score. A high-score, low-confidence opportunity should be presented as "promising but needs validation."

## 4. Earlyness And Under-Penetration Model

The useful zone is not "zero competitors." It is "enough proof elsewhere, weak local saturation."

```text
demand_supply_gap =
  normalized_demand_proxy - normalized_local_supply_proxy

adjacent_proof =
  average(success_score in nearest comparable cities)

earlyness_score =
  adjacent_proof * clamp(demand_supply_gap, 0, 1) * novelty_decay
```

Where:

- `normalized_demand_proxy`: customer-density, search-interest, institution-density, and spending proxies.
- `normalized_local_supply_proxy`: local POI count per 100k population or per selected radius.
- `adjacent_proof`: visible traction in similar nearby cities.
- `novelty_decay`: penalizes ideas already exploding locally or too culturally mismatched.

Under-penetration:

```text
expected_supply = comparable_city_supply_per_100k * target_city_population / 100000
under_penetration_ratio = max(0, expected_supply - observed_supply) / max(expected_supply, 1)
under_penetration_score = clamp(under_penetration_ratio * demand_quality_multiplier, 0, 1)
```

Add a sanity penalty:

```text
if observed_supply == 0 and adjacent_proof < 0.35:
  under_penetration_score *= 0.5
```

This prevents the engine from mistaking "nobody wants this" for "massive opportunity."

## 5. Unit Economics Assumptions

Each opportunity needs a small model, not a spreadsheet monster.

```json
{
  "template_id": "qsr_small_format",
  "capex_min_inr": 400000,
  "capex_max_inr": 1200000,
  "gross_margin_pct": 0.58,
  "monthly_fixed_cost_min_inr": 90000,
  "monthly_fixed_cost_max_inr": 220000,
  "avg_order_value_inr": 140,
  "orders_per_day_base": 90,
  "payback_months_base": 18,
  "break_even_revenue_monthly_inr": 170000,
  "key_sensitivities": ["rent", "daily_orders", "food_cost", "staffing"]
}
```

Calculate:

```text
monthly_revenue = avg_order_value * orders_per_day * operating_days
gross_profit = monthly_revenue * gross_margin_pct
operating_profit = gross_profit - monthly_fixed_cost
payback_months = capex / max(operating_profit, 1)
unit_economics_score = clamp(1 - ((payback_months - 12) / 36), 0, 1)
```

## 6. Seed Dataset Structure

Recommended files:

```text
data/
  seeds/
    cities.json
    opportunities.json
    unit_economics_templates.json
    city_opportunity_signals.json
  processed/
    poi_counts.json
    city_feature_vectors.json
  raw/
    osm/
    places/
    trends/
```

A starter seed dataset is available in `seed-opportunities.json`.

## 7. Analytics Events

Instrument the app from the first prototype.

| Event | When | Key Properties |
|---|---|---|
| `city_selected` | user chooses city | `city_id`, `state`, `tier` |
| `filters_updated` | sector/radius/investment/risk changes | `sector`, `radius_km`, `investment_min`, `investment_max`, `risk_appetite` |
| `opportunity_list_viewed` | ranked ideas shown | `city_id`, `result_count`, `top_opportunity_ids`, `scoring_version` |
| `opportunity_card_viewed` | card enters view | `opportunity_id`, `rank`, `overall_score`, `confidence` |
| `opportunity_opened` | user opens detail | `opportunity_id`, `rank`, `score_components` |
| `score_explanation_expanded` | user inspects why | `opportunity_id`, `component_name` |
| `business_plan_requested` | user asks for plan | `opportunity_id`, `city_id`, `investment_range`, `risk_appetite` |
| `business_plan_generated` | plan completes | `opportunity_id`, `plan_version`, `generation_latency_ms` |
| `plan_section_viewed` | user reads plan section | `section_name`, `time_spent_ms` |
| `save_opportunity` | user saves idea | `opportunity_id`, `rank` |
| `share_opportunity` | user shares | `opportunity_id`, `channel` |
| `validation_task_clicked` | user acts on next step | `task_type`, `opportunity_id` |
| `feedback_submitted` | user rates idea/plan | `rating`, `reason`, `opportunity_id` |

Core product metrics:

- Activation: first `business_plan_generated`.
- Intent: `save_opportunity` or `validation_task_clicked`.
- Trust: score explanation expansion followed by save/share.
- Quality: user rating of idea relevance.
- Learning loop: feedback rate by score bucket.

