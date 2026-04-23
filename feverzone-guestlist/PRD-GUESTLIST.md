# PRD — Guestlist (Nightclubs)

| | |
|---|---|
| **Date** | Apr 22, 2026 |
| **Product Manager** | Davide Lovison |
| **Product Designer** | Marta Maria Fernandez De Santos Borrallo |

This file is the product source of truth for the **FeverZone / Fever** nightclub guestlist initiative. Implementation work in `feverzone-guestlist/` (and related Fever Zone surfaces) should align with this document.

---

## 1. Overview, problem and opportunities

### Overview

**Guestlist Types** let operators configure and manage list-based access per event in Fever. Each guestlist supports:

- One or more **entry conditions**
- **Distribution channels** (public, private link, internal/PR)
- **Limits and quotas** (global and channel-level)
- **Attendee data** collection
- Workflows for **PRs** and **door** staff
- **End-user** signup and confirmation

Targets the core “list type” workflow currently covered by **Fourvenues**.

### Problem

Nightclub operators need more than standard ticketing: PR-driven registrations, multiple lists/conditions, access by time/age/gender/perks/price, distribution via public / private link / internal PR tools, capacity across channels, and **real-time door** operations. Fever has primitives (plans, booking questions, purchase rules, channels) but **no native guestlist abstraction** → fragmentation, Fourvenues/workarounds.

### Opportunities

Replace Fourvenues for guestlists; centralize config, distribution, PR, and door in Fever; improve allocation control; foundation for check-in, PR attribution, live ops.

---

## 2. Hypothesis and validations

**Hypothesis:** If Fever delivers flexible rules, public + private-link + internal distribution, fast PR flows, real-time door visibility, and simple end-user signup/confirmation, operators will move guestlist ops into Fever.

**Validations (assumptions — need validation):** Private-link is core; PR UX must be high-speed/low-friction; door needs live visibility without refresh; operators adopt if fast enough; end users accept confirmation before formal check-in.

---

## 3. Goals and KPIs

**Goals:** Native guestlists; all main distribution channels; fast PR add; reliable door view; clear end-user signup/confirmation.

**KPIs:** % nightlife events using Guestlist Types; registrations per event; % by channel (public / private / internal); PR registrations per PR/event; % events using door view; time to register in PR flow; signup completion rate.

---

## 4. Audience and assumptions

**Audience:** Operators, PR teams, door staff, end users/attendees.

**Assumptions:** Multiple guestlists per event; lists are distribution + operational tool; shared and channel-specific limits; PR under time pressure; door needs live visibility, search, filter; end users need lightweight signup + clear confirmation.

---

## 5. Risks and dependencies (summary)

- **Product/Engineering:** Orchestration across primitives; multi-layer limits complexity; real-time consistency; PR + door may need dedicated UI/backend.
- **Data:** Registrations distinguishable from ticket purchases; clear channel attribution; analytics at guestlist/condition/channel level.
- **Operations:** Training for PR and door.
- **Design:** Same product for operator, PR, door, end-user; **mobile critical** for PR and door.

---

## 6. Competitive view

**Fourvenues strengths:** Dedicated list types; multiple conditions; public/restricted distribution; private links; PR allocation/quotas; real-time door usage.

**Fever gap:** No dedicated guestlist layer; no first-class private-link; no optimized PR workflow; no native door view.

**Implication:** Fever must solve **rules** (structure, conditions, limits), **distribution** (public, private, internal), **operations** (PR speed, door visibility), **end-user** (signup + confirmation).

---

## 7. UX flows (summary)

| Flow | Summary |
|------|---------|
| **Operator** | Create guestlist → conditions → timing/capacity → channels → attendee fields → assign PRs if internal → publish |
| **End-user public** | Event page → see public guestlists → select list + condition → review rules → fill data → submit → confirmation → email/app later |
| **End-user private link** | Unique URL → direct into flow → condition → review → submit → confirmation → email/app |
| **PR / internal** | FZ → assigned guestlist → condition if needed → add one/many → real-time quota validation → instant save → door/operator update |
| **Door** | Live view → search/filter → see record + context → manage entry |

---

## 8. Accessibility

End-user signup mobile-friendly; PR and door usable on mobile; conditions/status clearly readable; door search/filter usable under pressure.

---

## 9. Permissions

| Role | Permissions |
|------|-------------|
| **Operator** | Create, edit, publish, unpublish, configure, view, export, remove registrations |
| **PR / authorized** | Assigned internal guestlists; add within quota |
| **Door** | Read-only live guestlist view |
| **Public user** | Public guestlists only |
| **Private-link user** | Only guestlist behind that link |

---

## 10. Settings / configurations

### In-scope (product)

Guestlist types; entry conditions; distribution; limits/quotas; attendee data; attendee management; fast PR input; door view; end-user confirmation.

### Out-of-scope (listed in PRD)

Waitlist; approval flows; check-in/validation; PR incentives/payouts; reusable templates; dynamic pricing rules.

### Distribution channels

| Channel | Description |
|---------|-------------|
| **Public** | On event page; any user |
| **Private link** | Unique URL; not on event page |
| **Internal (PR / FZ)** | Authorized users in Fever Zone |

**Per-channel config:** Each guestlist can enable one or more accesses (main plan, private link, FZ input). Per enabled access: active flag; channel capacity cap; per-signup limit for that channel.

### Guestlist type fields

| Field | Required | Notes |
|-------|----------|--------|
| Name | Yes | Internal + user-visible |
| Visibility | Yes | Hidden / Public |
| Opening datetime | Yes | Signup start |
| Deadline datetime | Yes | Signup end |
| Max capacity | No | Global cap |
| Description | No | Optional |
| Enabled channels | Yes | Public / Private / Internal |
| Per-channel caps | No | Else shares global pool |
| Per-channel per-signup limits | No | Optional |

### Entry condition fields

| Field | Required | Notes |
|-------|----------|--------|
| Price | Yes | Can be 0 |
| Start time | Yes | Entry window start |
| End time | Yes | Overnight supported |
| Minimum age | No | |
| Gender restriction | No | |
| Includes | No | Perks (free text) |
| Additional info | No | |

### Attendee data fields

Standard: name, email, phone, DOB, gender, country/postcode, ID number. Custom: text, single choice, boolean. Per field: required / optional / hidden where applicable.

---

## 11. User stories and requirements

### 11.1 Summary table (from PRD)

| Area | Priority / note |
|------|-----------------|
| Guestlist management (multi, CRUD, publish needs ≥1 condition) | MVP |
| Distribution public + internal | Internal MVP; **public + private link Post-MVP** |
| Per-channel limits | MVP |
| Entry conditions (multiple, selectable) | TBD MVP scope |
| Timing (open/deadline) | MVP |
| Capacity/quotas | Global MVP; rest Post-MVP |
| Permissions | MVP |
| Attendee data + custom questions | MVP |
| Attendee management (view/filter/export/remove) | MVP |
| PR workflow (fast + bulk, real-time quota) | MVP |
| Door (live, search, filter) | MVP |
| End-user signup | Post-MVP |
| End-user confirmation + persistent | Post-MVP |
| System integrity (real-time enforce all constraints) | MVP |

### 11.2 Detailed user stories (IDs US-1 … US-27)

Full acceptance criteria are in the stakeholder PRD; implement against these IDs:

- **11.2.1 Guestlist management:** US-1 create/edit/publish/unpublish/delete; multiple per event; cannot publish without ≥1 condition; changes visible without manual sync.
- **11.2.2 Distribution:** US-2 public; US-3 private link; US-4 internal/FZ; US-5 channel-level allocation + global cap + real-time remaining.
- **11.2.3 Entry conditions:** US-6 multiple conditions; US-7 attributes (price, times, age, gender, includes, info); US-8 overnight windows (e.g. 20:00–03:00).
- **11.2.4 Timing:** US-9 opening/deadline; block outside window; invalid config prevented; all channels.
- **11.2.5 Capacity:** US-10 global capacity; US-11 per-signup by channel; US-12 PR/group quotas.
- **11.2.6 Permissions:** US-13 assignments; unauthorized blocked; door read-only when granted.
- **11.2.7 Attendee data:** US-14 standard fields; US-15 custom questions; export includes answers.
- **11.2.8 Attendee management:** US-16 view all; US-17 filter/export CSV; US-18 remove + capacity/quota/door update.
- **11.2.9 PR workflow:** US-19 fast manual; US-20 bulk/partial success + clear failures.
- **11.2.10 Door:** US-21 real-time no refresh; all channels; US-22 search + filters (guestlist/condition/channel), fast enough for ops.
- **11.2.11 End-user:** US-23 simple mobile signup; US-24 condition visibility before submit; US-25 confirmation screen; US-26 persistent via email/web/mobile.
- **11.2.12 System integrity:** US-27 real-time enforcement; concurrency/no overbooking; convergent state across operator/PR/door.

---

## 12. Translations

Guestlist names, descriptions, condition text, confirmation, restrictions/status — translatable/localizable.

---

## 13. Affected products

Fever marketplace; **Fever Zone**; Reporting API.

---

## 14. M and As / subsidiaries

DICE: possible nightlife overlap; Casfid: future check-in/access validation.

---

## 15. Analytics (events + properties)

**Candidate events:** Guestlist viewed; condition selected; signup started; signup completed; registration created by PR; registration removed; door view opened.

**Candidate properties:** Guestlist ID; entry condition ID; channel (public / private link / internal); event ID; PR user ID when applicable.

---

## 16. Development phasing strategy

### Phase 1 — Operational guestlist inside Fever (replace manual tools)

**Goal:** Venues run guestlist operationally in Fever.

**In scope:** Guestlist CRUD (basic); entry conditions **simplified: time window + price**; **guestlist-level capacity**; **internal channel only (PR/FZ)**; attendee data + custom questions via **BQ**; basic PR assignment; **fast PR input (single + bulk)**; basic operator attendee list; access control (view all / each guestlist); search by attendee name; **validate attendee**.

**Explicitly out of scope for Phase 1:** Public guestlists; private links; advanced conditions (gender, perks, etc.); advanced quotas and per-channel limits; advanced door (filters, segmentation, performance tuning).

### Phase 2 — User-facing and controlled distribution

**In scope:** Public on event page; end-user signup; condition selection/visibility; confirmation screen + persistent access; **private-link** unique URLs; channel attribution (public vs private link).

### Phase 3 — Competitor parity / complex venues

**In scope:** Multi-layer limits (per-channel caps, per-signup, PR/group quotas); advanced conditions (gender, age validation, perks/info); advanced reporting/analytics.

---

_End of PRD capture. For implementation details and exact wording of every AC, defer to stakeholder docs and this file’s section 11._
