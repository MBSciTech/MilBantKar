# Feature spec: IPO Funding Tracker for MilBantKar

## Context (existing project)
MilBantKar is a MERN group-expense app. Existing models: `User`, `Event`, `expenceLog`, `Alert`. Backend is a monolithic Express server (`backend/server.js`) with Mongoose models under `backend/models/`. Frontend is React with components under `frontend/src/components/` and pages under `frontend/src/pages/`. There's already a working file-upload flow used for expense receipts (`backend/upload/`) — reuse that same pattern for this feature rather than building new upload infra.

## The real-world problem being solved
Family members ("financiers") send money to other family members ("applicants") so each applicant can apply for an IPO individually (IPO applications are one-per-PAN/demat, so spreading applications across multiple people increases total allotment chances). After the IPO result is declared, money must flow back:
- If **not allotted** → applicant refunds the full amount to the financier.
- If **allotted** → applicant holds the shares, sells them later, and returns the **full sale proceeds (principal + 100% of profit)** to the financier. The applicant keeps nothing for themselves — there is no profit split.

This is currently tracked manually (WhatsApp/notes), causing confusion given the volume of transactions. This feature brings it into the existing app as a new event type.

## High-level structure
Add a new event type, `ipo`, alongside the existing default (`friendly`). Structurally:

```
Event (type: 'ipo')
  └── IPOApplication (one per company/IPO)
        └── FundingRecord (one per financier↔applicant↔amount)
```

This is one level deeper than friendly events (`Event → expenceLog`), because one IPO event commonly covers **multiple IPOs** over time, and each IPO can involve **multiple financier-applicant pairs** (financier assignment is fully flexible — any member can fund any other member, many-to-many, no fixed roles).

The IPO ledger must be built as a **separate flow from the existing expense-split engine** — it is not a shared-cost split, it's a directional loan-and-return lifecycle where the amount owed back isn't even known at funding time (it depends on a later, external event: the allotment result, and possibly the sale price).

## Data model additions

### Event (extend existing model)
- Add `type: { type: String, enum: ['friendly', 'ipo'], default: 'friendly' }`
- All existing fields/behavior remain unchanged for `type: 'friendly'`.

### New model: `IPOApplication`
| Field | Type | Notes |
|---|---|---|
| eventId | ObjectId ref `Event` | required |
| companyName | String | required |
| applicationDate | Date | |
| allotmentResultDate | Date | nullable, set when result is declared |
| status | enum: `open`, `result_declared`, `closed` | `closed` only when every child `FundingRecord` has reached a terminal status |
| notes | String | optional free text |
| createdBy | ObjectId ref `User` | |

### New model: `FundingRecord`
This is the core object — it implements the lifecycle state machine below.

| Field | Type | Notes |
|---|---|---|
| ipoApplicationId | ObjectId ref `IPOApplication` | required |
| financierId | ObjectId ref `User` | required |
| applicantId | ObjectId ref `User` | required, must differ from financierId |
| amountFunded | Number | required |
| fundingDate | Date | |
| fundingProofScreenshot | String (file path) | **required** before status can become `Funded` |
| allotmentStatus | enum: `pending`, `not_allotted`, `fully_allotted`, `partially_allotted` | default `pending` |
| allotedAmount | Number | relevant if fully/partially allotted; equals `amountFunded` if fully allotted |
| refundAmount | Number | computed = `amountFunded - allotedAmount`; relevant when `not_allotted` or `partially_allotted` |
| refundStatus | enum: `not_applicable`, `pending`, `settled` | default `not_applicable` |
| refundProofScreenshot | String (file path) | **required** before `refundStatus` can become `settled` |
| refundSettledDate | Date | |
| holdingStatus | enum: `not_applicable`, `holding`, `sold` | only relevant if `allotedAmount > 0` |
| saleProceeds | Number | entered when applicant sells; required to move `holdingStatus` to `sold` |
| saleDate | Date | |
| settlementStatus | enum: `not_applicable`, `pending`, `settled` | default `not_applicable` |
| settlementProofScreenshot | String (file path) | **required** before `settlementStatus` can become `settled` |
| settledDate | Date | |
| overallStatus | derived enum (see state machine) | for dashboard filtering — either compute on read or maintain on write |
| createdAt / updatedAt | Date | standard Mongoose timestamps |

## Lifecycle (state machine) — the core logic of this feature

```
Funded
  → Result declared
      ├─ (not allotted / unallotted portion) → Refund pending → Refund settled   [TERMINAL]
      └─ (allotted, full or partial)         → Holding → Sold → Settled          [TERMINAL]
```

**Hard rules — enforce server-side, not just in the UI:**
1. A `FundingRecord` cannot enter `Funded` without `fundingProofScreenshot` attached.
2. A `FundingRecord` cannot enter `Refund settled` without `refundProofScreenshot` attached.
3. A `FundingRecord` cannot enter `Settled` without `settlementProofScreenshot` attached.
4. **No money transition into a terminal/settled state happens without an accompanying image file.** This is a global invariant across all three closing transitions.
5. On **partial allotment**, the single `FundingRecord` effectively runs both sub-flows at once: the unallotted portion follows Refund pending → Refund settled, and the allotted portion follows Holding → Sold → Settled. Recommended approach: keep both sets of fields on the same record and let them progress independently (simpler schema than splitting into child records) — flag this as a decision point if the implementer prefers otherwise.
6. **No profit split.** 100% of `saleProceeds` returns to the financier. There is no ratio/percentage field anywhere in this model — this was deliberately simplified after discussion.
7. `IPOApplication.status` becomes `closed` only when every associated `FundingRecord` has reached a terminal state on all applicable sub-flows.

## OCR-based amount verification (applies to all three proof screenshots)

Every screenshot upload (`fundingProofScreenshot`, `refundProofScreenshot`, `settlementProofScreenshot`) must be OCR-checked against the amount entered in the corresponding field (`amountFunded`, `refundAmount`, `saleProceeds`/settlement amount) **before** the associated status transition is allowed to complete. This is an extension of the existing "no transition into a settled state without proof attached" rule — now the proof must also numerically match.

**Engine: Tesseract, self-hosted** (e.g. a Node wrapper like `node-tesseract-ocr`, or a small internal service calling the Tesseract binary). Chosen deliberately over a cloud OCR API to keep screenshots in-house and avoid an external billing/API dependency — the trade-off accepted is a higher false-mismatch rate than a cloud OCR provider would give.

**Pipeline, on screenshot upload:**
1. Run Tesseract OCR on the image server-side, get raw text.
2. Regex-extract candidate amounts (₹ / Rs / INR followed by digits, with commas/decimals). If multiple candidates appear (e.g. "Amount Paid" vs "Available Balance"), prefer the one nearest amount-labeled context over the first number found.
3. Normalize both the OCR result and the stored field before comparing: strip currency symbols/commas, correct common OCR digit confusions (`O`↔`0`, `l`↔`1`).
4. **Match** → allow the transition to proceed.
5. **Mismatch or no amount detected** → block the transition. Return both the OCR-detected amount and the user-entered amount to the frontend so it can show something like *"We detected ₹4,999 on this screenshot but you entered ₹5,000 — check the amount or upload a clearer image."* The user can correct the amount or re-upload; do not dead-end them with an unrecoverable error.
6. **Preprocessing matters for Tesseract accuracy on phone screenshots** — grayscale conversion, upscaling, and contrast/threshold adjustment before OCR meaningfully improve the read rate on UI-rendered text. Build this into the pipeline, not as an afterthought.

**Recommended safety valve (flagged as a decision, but strongly recommended given Tesseract's known false-mismatch rate):** after a small number of failed OCR attempts on the same upload (e.g. 2), allow a manual override that records the transition anyway, tagged with an audit note (e.g. `"manually verified — OCR override"`) so it's visible later that automatic verification didn't succeed. Without this, a single stubborn blurry screenshot could permanently block a real transfer from ever being recorded — which defeats the feature's purpose.

## Backend work (Node/Express + Mongoose)

- New models: `IPOApplication.js`, `FundingRecord.js` — mirror the style/conventions already used in `models/Event.js` and `models/expenceLog.js`.
- Extend `Event.js` schema with the `type` field.
- New routes (mirror existing route conventions in `server.js`):
  - `POST /api/events/:eventId/ipo-applications` — create an IPO application (only if `event.type === 'ipo'`)
  - `GET /api/events/:eventId/ipo-applications` — list IPOs under an event
  - `POST /api/ipo-applications/:id/funding-records` — create funding record(s). **Support batch creation**: accept an array of `{applicantId, amount}` for a single financier in one call, since one person commonly funds several relatives for the same IPO at once. Reuse the existing upload middleware for the screenshot.
  - `PATCH /api/funding-records/:id/allotment` — mark allotment result (`not_allotted` / `fully_allotted` / `partially_allotted` + `allotedAmount`)
  - `PATCH /api/funding-records/:id/refund` — attach `refundProofScreenshot`, mark `refundStatus` → `settled`
  - `PATCH /api/funding-records/:id/sale` — record `saleProceeds`, `saleDate`, move `holdingStatus` → `sold`
  - `PATCH /api/funding-records/:id/settle` — attach `settlementProofScreenshot`, mark `settlementStatus` → `settled`
  - `GET /api/funding-records?userId=&role=financier|applicant&status=` — for dashboard/history filtering
- **Validation**: reject any status-transition request missing the required screenshot for that transition (rule 4 above) — this must be enforced in the route handler, not just assumed from frontend behavior.
- **OCR dependency**: add Tesseract (binary + Node wrapper) to the backend, and run the OCR amount-check (see "OCR-based amount verification" above) as part of the same route handlers that accept `fundingProofScreenshot`, `refundProofScreenshot`, and `settlementProofScreenshot` — reject the request with a clear mismatch message if verification fails, per the override rule above.
- **Alerts** (reuse existing `Alert` model as-is, no schema changes needed): generate alerts such as:
  - "Mark allotment result for [Company]" — after N days post-`applicationDate` with no result declared
  - "Shares in holding for [Company] — N days, not yet sold"
  - "Refund pending for N days — [Company]"
  - "Settlement pending for N days after sale — [Company]"

## Frontend work (React)

- `Events.js` — add an event-type selector (Friendly / IPO) at event creation.
- `EventPage.js` — branch rendering on `event.type`. If `'ipo'`, render a list of `IPOApplication`s instead of the expense list.
- New component, e.g. `IPOApplicationPage.js` — shows one IPO's funding records with their current lifecycle stage, using the states defined above.
- New component, e.g. `FundingRecordForm.js` — batch-capable: pick one financier, multi-select applicants, per-applicant amount, mandatory screenshot upload. (Open UX question below: one screenshot per record vs. one per batch.)
- Reuse the existing receipt-upload UI pattern (wherever it currently lives, likely inside `Transaction.js`) for all three screenshot fields (`fundingProofScreenshot`, `refundProofScreenshot`, `settlementProofScreenshot`).
- `History.js` / `Visualise.js` — add a separate **IPO Ledger** tab/section. **Do not merge IPO amounts into the friendly-event owe/owed balance** — IPO amounts are not fixed settle-up debts, they change status and value over time (e.g. an unsold holding has no fixed "amount owed" yet).
- `Dashboard.js` — add a "Pending IPO settlements" widget, separate from the main balance number, sourced from `GET /api/funding-records` filtered to non-terminal statuses for the logged-in user (as financier or applicant).

## Explicitly out of scope
- **No automated scraping** of IPO registrar sites (KFin Technologies, Link Intime, etc.) for allotment status. Status is entered manually. Optionally, add a convenience button/link that opens the registrar's public status-check page in a new tab so the user can check and then come back to update the app.
- **No profit-split logic or ratio configuration** — 100% of sale proceeds return to the financier, always.
- **No payment-gateway/bank API integration.** Screenshots are the agreed proof mechanism, not programmatic verification.

## Open decisions to confirm before/during implementation
1. Batch funding entry: does the screenshot apply per individual `FundingRecord`, or once per batch (single transfer covering multiple applicants)?
2. Partial allotment: keep both refund and settlement fields on one `FundingRecord` (recommended, simpler) vs. splitting into two linked child records?
3. Alert thresholds (in days) for each "stale" reminder — needs a sensible default; should ideally be configurable later rather than hardcoded.
4. OCR override threshold — how many failed verification attempts before allowing a manual override, and who is allowed to trigger it (the uploader themselves, or does it need the other party in the transaction to also confirm)?