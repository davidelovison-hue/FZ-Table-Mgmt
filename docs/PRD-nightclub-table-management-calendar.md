# PRD — Nightclub Table Management in FZ (Calendar View Adaptation)

| Field | Value |
|-------|-------|
| **Date** | Apr 22, 2026 |
| **Product Manager** | Davide Lovison |
| **Product Designer** | Marta Maria Fernandez De Santos Borrallo |

---

## 1. Context & Problem

FeverZone’s current Asset Calendar is designed for game center scheduling, not for nightclub table operations, which are:

- **High-frequency** — many bookings in short time
- **Revenue-sensitive** — table availability = revenue
- **Operationally intense** — real-time decisions during the night

Additionally, the system operates under a **single-table reservation model**:

- Each asset represents one table
- Each reservation is linked to one table
- Tables are booked individually (no combinations or merging)

**Today’s main issues:**

- No clear visibility of available vs occupied tables
- No grouping aligned with how venues operate (zones)
- Calendar is passive (view-only), not action-oriented
- Reservation flow is disconnected from availability view

---

## 2. Objective

Transform the calendar into a **real-time operational interface** for VIP table management, enabling:

- Instant identification of available tables
- Fast reservation creation directly from availability
- Clear grouping by zone

---

## 3. Scope

### In Scope

- Calendar UI adaptation for table management
- Zone-based grouping (via asset type)
- Availability visualization (color-coded)
- Direct reservation creation from calendar
- Reservation visibility within calendar
- Real-time availability updates

### Out of Scope (for now)

- Table map (Seats.io-style)
- Advanced pricing tiers within zones
- Drag & drop reassignment
- Multi-seating per table (e.g. early/late slots)
- PR-specific views
- Multi-table reservations

---

## 4. Data Model Assumption

- **Asset** = Table
- **Asset Type** = Zone (e.g. VIP, Main Room, Terrace)
- Reservations are always tied to a **single table**

### Event Configuration

The system supports two types of event configurations:

#### 1. One-off Events (Default / MVP)

- Events are treated as single day (one service window)
- No time or day granularity is required
- Each table has one availability state per event

**Implications:**

- A table can be booked **once per event**
- No overlapping or time-based reservations

#### 2. Recurring Events

- Events can repeat over time (e.g. weekly Fridays)
- Each occurrence is treated as a **separate session**
- Availability is managed **per session** (not globally)

**Important:**

- Even in recurring events, each session still follows the single-table, single-booking logic
- No intra-session time slots (e.g. early/late seating) in this phase

---

## 5. Core Features & User Stories

### 5.1 Filtering & View Controls

**User story:** As an operations manager, I want to filter the calendar by event, zone, and table status, and choose the most useful calendar view, so that I can manage table inventory efficiently for both one-off and recurring events.

**Acceptance criteria:**

- Select event/session to load calendar
- Filter by one or multiple zones (asset types)
- Filter by status: available, held, booked
- Filters update in real time without reload
- Switch between single-day view and multi-day view
- Single-day view is default for one-off events
- Multi-day view available for recurring events or when operators need multiple sessions together

### 5.2 Grouping by Zone

**User story:** As an operations manager, I want tables grouped by zone, so that the interface reflects how the venue is structured.

**Acceptance criteria:**

- Tables grouped by asset type (zone)
- Groups labeled clearly (e.g. VIP, Terrace)
- Groups are collapsible
- Zones follow configurable order

### 5.3 Availability Visualization

**User story:** As an operations manager, I want to clearly distinguish table availability, so that I can make fast booking decisions.

**Acceptance criteria:**

- Available → green (clickable)
- Held → yellow/orange
- Booked → neutral/filled
- Blocked → red/disabled
- Each cell shows: table name, optional capacity, status

### 5.4 Reservation Creation

**User story:** As an operations manager, I want to create a reservation directly from an available table, so that I can book tables quickly without switching tools.

**Acceptance criteria:**

- Clicking a green slot opens reservation flow
- Pre-filled: table (asset), zone (derived), date/time
- After booking, return to calendar view
- Calendar updates instantly after confirmation

### 5.5 Reservation Visibility

*(Already implemented)*

**User story:** As an operations manager, I want to see booking details directly in the calendar, so that I can understand occupancy at a glance.

**Acceptance criteria:**

- Each booking displays: booker name, party size, status
- Click → opens full reservation detail
- Updates reflected in real time

### 5.6 Table Reassignment (Move Asset)

**User story:** As an operations manager, I want to move a reservation to another table while seeing tables grouped by zone, so that I can make better reassignment decisions quickly.

**Acceptance criteria:**

- From an existing booking, trigger “Move table”
- Side panel shows available tables grouped by zone (asset type)
- Each zone clearly labeled (e.g. VIP, Main Room, Terrace)
- Tables show: name, availability status
- Only available tables selectable
- Selecting a table updates booking on confirmation
- Calendar updates instantly after reassignment

---

## 6. Future Evolution

### 6.1 Table Map View

Calendar should evolve into (or be complemented by):

- Visual table map (Seats.io-style)
- Real spatial representation of tables
- Direct interaction with table positions

**Ideal future setup:** Calendar → time navigation; Map → operational control

### 6.2 Operational Features

- Drag & drop table reassignment
- Table upgrade (Price X → Y)
- Multi-slot tables (multiple seatings per night)
- PR-specific access and permissions
- Integration with Casfid: link table ↔ booking ↔ on-site spend
