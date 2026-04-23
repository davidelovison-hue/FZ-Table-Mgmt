# PRD — Table Modification from FZ (Reassignment, Upgrade/Downgrade & Group Size Change)

| Field | Value |
|-------|-------|
| **Product** | FeverZone |
| **Context** | Asset-Based Table Management (Nightclubs) |
| **Date** | Apr 22, 2026 |
| **Product Manager** | Davide Lovison |
| **Product Designer** | Marta Maria Fernandez De Santos Borrallo |

---

## 1. Overview

Enable Ops users in FeverZone to modify an existing table booking through a **unified flow** that supports:

- Table reassignment (change table)
- Upgrade / downgrade (price change)
- Group size change

The system must ensure:

- Real-time asset availability consistency
- Correct price recalculation
- Proper handling of additional payments

---

## 2. Current State

Today, FeverZone allows:

- Reassigning bookings between tables (assets)

**With constraints:**

- Same activity
- Compatible group size
- Availability

**Gaps:**

- Price differences are not handled in-system
- Payment collection is external/manual
- Group size changes are not standardized

---

## 3. Problem

Nightclub operations are dynamic:

- Guests change group size
- Tables are upgraded or reassigned
- Layout is optimized in real time

Without a unified system:

- Revenue is lost (upsells, extra guests)
- Payments are not tracked consistently
- Inventory and booking data drift apart

---

## 4. Goals

- Enable all booking modifications in **one flow**
- Capture incremental revenue (table + guests)
- Maintain consistency across booking, inventory, and payment
- Reduce manual/off-system operations

---

## 5. Scope

### In Scope

- Table reassignment
- Upgrade / downgrade
- Group size increase / decrease
- Price recalculation
- Payment handling for upgrades
- Booking + inventory update

### Out of Scope

- Refunds
- Multi-table bookings
- Self-service upgrades

---

## 6. User Stories

| Area | User story |
|------|------------|
| **Upgrade table (same group size)** | As an Ops user, I want to move a booking to a higher-value table while keeping the same group size so that I can upsell premium inventory and increase revenue. |
| **Upgrade group size (same table)** | As an Ops user, I want to increase the group size of a booking so that I can accommodate more guests and capture additional revenue. |
| **Upgrade (table + group size)** | As an Ops user, I want to move a booking to a better table and increase the group size at the same time so that I can maximize both capacity and revenue. |
| **Reassignment (same value)** | As an Ops user, I want to move a booking to another equivalent table so that I can optimize layout without impacting pricing. |
| **Downgrade table** | As an Ops user, I want to move a booking to a lower-value table so that I can adapt to operational constraints or customer requests, **without triggering a refund**. |
| **Reduce group size** | As an Ops user, I want to decrease the group size so that the booking reflects actual attendance, **without changing the price**. |
| **Validation & constraints** | As an Ops user, I want the system to only allow valid combinations of table and group size so that I don’t create invalid or unserviceable bookings. |
| **Pricing visibility** | As an Ops user, I want to clearly see the price impact (delta) of any modification before confirming so that I can communicate it to the customer. |
| **Payment handling (upgrades)** | As an Ops user, I want to collect or register additional payment when the modification increases the booking value so that revenue is properly captured. |
| **Inventory consistency** | As an Ops user, I want the system to update table availability automatically when I modify a booking so that inventory remains accurate across all channels. |

---

## 7. Ops Flow (FeverZone)

1. Open booking from **Order view** or **Asset calendar**
2. Click **Modify Booking**
3. Select: **New table**, **New group size**
4. System shows: **Current vs new setup**, **Updated price**, **Delta**
5. If **delta > 0**: collect or request payment
6. **Confirm modification**
7. System updates: **Booking**, **Table assignment**, **Group size**, **Payment status**
