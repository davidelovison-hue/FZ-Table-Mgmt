# Pacha Table Management System — Requirements Document

## 1. Context & Objective

This document defines the end-to-end requirements for building a nightclub table management system for Pacha (FIVE) within FeverZone.

This document uses Fourvenues as a baseline reference for the product to be built. Fourvenues has been developed in close collaboration with Pacha and reflects their current operational model. As a result, Pacha expects the new system to match a similar level of product maturity, usability, and operational coverage.

This is the first structured version of this system and aims to:

- replace fragmented tools (Fourvenues, manual coordination, etc.)
- support real nightclub operations at scale
- create a foundation that can be reused across venues (NY, Ibiza, etc.) and other partners

The system must work in a high-pressure environment, where:

- staff act fast (door, floor, concierge)
- multiple users operate at the same time
- bookings change during the night
- revenue comes from multiple systems (checkout + on-site consumption)

## 2. System Goal

The goal is not to build a simple booking tool.

**The system is a real-time operational and revenue orchestration layer.**

It should:

- manage table inventory and reservations
- keep track and allow for payments and settlements
- coordinate between booking, payments, POS, and access systems
- support staff during live operations before, during and after the event
- provide unified view of customer, his purchase history and CRM
- provide a unified view of revenue and activity

## 3. What is a Table

A table is the main unit of the system.

It represents:

- a physical space in the venue
- a commercial product (minimum spend / pricing)
- an operational entity (assignment, seating, upgrades)
- a financial entity (deposit + on-site consumption)

### Key characteristics

- A table belongs to a zone
- A table has a capacity range (min/max pax)
- A table has a price / minimum spend
- A table is always linked to a reservation
- A table is used to create a POS tab
- A table is linked to guests via QR and RFID

### Table lifecycle (high level)

Each table reservation follows a lifecycle that represents its progression from initial booking to its final outcome after the event.

This lifecycle can be understood in three main stages:

1. **Pre-event (Booking & Preparation)** — The reservation is created and prepared before the event. This includes capturing customer details, confirming the booking, optionally assigning a table, and ensuring any required validation or payment is completed. At this stage, the reservation is planned but not yet active.

2. **During event (On-site Usage)** — The reservation becomes active as guests arrive at the venue. Guests are checked in, seated at their table, and begin using the space. During this phase, the reservation may evolve as part of normal operations, such as adding guests, changing tables, or adapting to real-time conditions.

3. **Post-event (Final Outcome)** — After the event, the reservation reaches its final state based on what actually occurred. This may include being completed normally, released, or marked as a no-show. This stage ensures that the system reflects the real outcome of the reservation and supports accurate reporting.

## 4. Integration Model

The system integrates with external systems. Each has a clear role.

### Responsibilities

| System | Responsibility |
|--------|----------------|
| Fever | User CRM, Bookings, deposit payment and pre event settlements, table mgmt and assignment, on-site spend reconciliations |
| 3rd party POS | F&B orders and final payments to close the table Tab |
| 3rd party RFID / Wristbands | Guest identity and access control |

### Key flows

- **Booking → POS** → creates a tab/session
- **POS → FeverZone** → sends bill and payment info
- **Booking → RFID** → QR used to link wristbands
- **RFID → FeverZone** → sends attendance data
- **Checkout → Partner** → payment confirmation webhook

## 5. Reservation Lifecycle

The reservation lifecycle describes how a booking evolves from creation to completion, covering both pre-event preparation and real-time operations during the night.

Each reservation is treated as a live operational object that is:

- created and monetized
- assigned and prepared
- checked in and operated
- updated dynamically during the event
- finalized and reconciled

The lifecycle is not linear — reservations can change state multiple times based on real-world conditions (e.g. upgrades, added guests, no-shows).

### 5.0 Status Management

**Use case:** Each reservation moves through a defined lifecycle that reflects its progression before, during, and after the event.

Statuses are used to:

- monitor reservations and table activity across the venue
- provide clear visibility of the current state of each reservation and its associated table
- support staff in managing bookings, check-in, seating, and on-site operations

The system acts primarily as a source of truth and visibility layer, rather than enforcing strict workflows.

It must ensure that:

- status changes are manually performed by staff, without enforcing strict transition rules
- any status change is reflected immediately across all views (list, map, reservation detail)
- status remains consistent and reliable for operational visibility and reporting

**Statuses**

- **Pre-service:** Pending; To review; Accepted; Cancelled by client; Canceled; Not completed
- **During service:** Arrival; Seated; Charged
- **Post service:** Released; No-show

**User stories (summary):** Staff update status manually; see status at a glance; consistency across list, map, detail; managers monitor operations; system stores status for reporting.

### 5.1 Create & Confirm Reservation

**Use case:** A reservation is created when demand is captured by a concierge, PR, or staff member (backoffice, phone/WhatsApp, web).

Operator inputs: customer name and contact; group size; zone or table (optional); pricing and deposit.

System: applies default pricing rules; validates inventory; captures PR attribution; optionally triggers payment.

**User stories (summary):** Quick create (name + pax); validate pax vs capacity on assign; assign or leave unassigned; lock/hide tables; auto price/deposit; overrides; attribution; internal vs customer notes; payment flow + webhook (system).

### 5.2 Assign & Prepare Reservations

**Use case:** Staff assigns/(re)assigns reservations using map view and availability list. Reservations can be assigned, moved, or left unassigned.

**User stories (summary):** Assign via map or list; one reservation per table; move reservations; immediate availability update; clear unassigned visibility; unassigned does not block tables; restrict locking (manager).

### 5.3 Reservation List & Monitoring

**Use case:** Main operational dashboard — reservations grouped by zone with tables reserved vs total, booking count, guests checked-in vs expected.

**User stories (summary):** Zone grouping; capacity summary; booking count; check-in vs expected; filter by status; highlight action-needed (late, unpaid, unassigned).

### 5.4 Reservation Detail

**Use case:** Full operational object: booking data; table assignment; financial status; customer data; attendance tracking.

**User stories (summary):** Status + table; total price, deposit, remaining; payment history; checked-in vs total; contact + history; internal and customer notes; consistent real-time data.

### 5.5 Edit Reservation

**Use case:** Modify customer info; change assignment; adjust price/deposit; add payments; validate and log.

**User stories (summary):** Edit customer; change table with availability validation; price/deposit with authorization; notes; audit log; revalidate consistency.

### 5.6 Check-in & Attendance

**Use case:** Check-in guests; issue RFID; link bands via QR; track attendance.

**User stories (summary):** Door search; one-action check-in; RFID + QR link; track RFID-linked count; attendance progress; partial group entry.

### 5.7 Live Operations (Changes & No-shows)

**Use case:** Add guests; upgrade/reassign tables; no-shows; late arrivals — without breaking availability.

**User stories (summary):** Add guests; change tables; no-show; release table after no-show; check-in/out times; maintain availability.

### 5.8 POS & Consumption

**Use case:** POS creates tab; FeverZone receives bill data for reporting.

**User stories (summary):** Send reservation to POS; session mapping; itemized bill ingest; link to reservation; consumption per table; handle delayed/missing POS data.

### 5.9 Payments & Financial Tracking

**Use case:** Track reservation-level payments separately from POS consumption; deposit and total; multiple payment entries; payment history.

**User stories (summary):** Store totals and outstanding; manual payments; payment history (method, date, amount, added by, actions); update totals after payments.

### 5.10 Settlement & Reporting

**Use case:** Aggregate booking data, POS consumption, attendance for managers.

**User stories (summary):** Pending payments; total revenue (deposit + consumption); occupancy and no-show rates; reconcile sources; consistent reporting.

---

**Repo note:** This file is the product PRD snapshot for the FeverZone **FZ-Table-Mgmt** prototype. Integration points (POS, RFID, checkout) are mocked in UI unless wired to backend.
