# Security & Code Audit Report

**Date:** 2026-05-14

---

## 🚨 Critical Findings (Immediate Action Required)

### Security

- **Admin-only actions lack server-side enforcement** — `src/pages/AdminPanel.jsx:111,123,164,166` (role updates, password reset RPC, confirm users, create profiles). Client-side checks can be bypassed; relies on weak RLS/RPC policies.
- **Role-based access controls only in UI** — Multiple components perform frontend-only role checks that can be bypassed:
  - `src/components/actions/AssignSicarFolio.jsx:14–36,45–51`
  - `src/components/actions/AdminReview.jsx:24–45,75–78`
  - `src/components/actions/ProcessResolution.jsx:65–98`
  - `src/components/actions/VendorHandover.jsx:46–57`
  - `src/pages/ReturnDetail.jsx:42–74,141–146`
  - `src/pages/WarrantyDetail.jsx:43–78,144–160`

### Requirements

- **PUBLIC SELECT on garantias/devoluciones** — Policies `Todos pueden ver devoluciones` and `Todos pueden ver garantías` (USING true) allow unauthenticated read of all warranty/return rows.
- **Authenticated SELECT exposes all rows** — Policies `Ver devoluciones` and `Ver garantias` (USING true) allow any authenticated user to read all rows across all sucursales.
- **PUBLIC UPDATE/INSERT on garantias/devoluciones** — Policies `Cajeros editan su sucursal *` and `Cajeros crean en su sucursal *` are PUBLIC; plus `Cajeros y Admins pueden crear *` uses `auth.role()` but is PUBLIC. This allows unauthenticated writes or weak role enforcement.
- **Overbroad status update policy** — `Restricción de Admin en Devoluciones/Garantias` is PUBLIC and allows non-admin updates for most statuses, enabling unauthorized status changes.
- **Permissive SELECT on perfiles** — Policy `Ver perfiles` (authenticated, USING true) exposes all profiles to any authenticated user. Public admin policies (`Creación/Edición/Borrado de perfiles`) should be restricted to authenticated admins.
- **SECURITY DEFINER without admin check** — Functions `admin_confirm_user` and `admin_create_user` lack admin validation. Any caller can confirm/create users (privilege escalation).
- **Evidence bucket privacy exposure** — Code uses `getPublicUrl` for evidence storage (`src/pages/MobileUpload.jsx`, `src/components/QuickQRUpload.jsx`, `src/components/actions/VendorHandover.jsx`). Evidence must use signed URLs with private bucket policies.

---

## Security Breaches

### High

- **Evidence uploads unauthenticated/public** — `src/pages/MobileUpload.jsx:21–29`, `src/components/QuickQRUpload.jsx:12–16,31–45`, `src/components/actions/VendorHandover.jsx:38–44`. Risk: tampering, spam, public exposure.
- **Client-side geolocation check only** — `src/pages/Login.jsx:56–105` — easily bypassed.

### Medium

- **RLS policies confirmed but critically permissive** — Public SELECT/UPDATE/INSERT policies on core tables allow data exposure and unauthorized writes.
- **.env.local contains anon key** — Low risk exposure.

### Low

- **EvidenceCard.jsx displays untrusted image URLs** — Potential for malicious content injection.

---

## Logic & Functional Issues

### Medium

- **WarrantyDetail/ReturnDetail redirect on any fetch error without user message** — `src/pages/WarrantyDetail.jsx:32–41`, `src/pages/ReturnDetail.jsx:31–40`. Poor UX; masks root cause.
- **Timezone normalization off-by-one risk** — `src/pages/WarrantyDetail.jsx:80–84`, `src/pages/ReturnDetail.jsx:77–81`.
- **Alert-only error feedback for process advancement** — `src/pages/WarrantyDetail.jsx:71–78`, `src/pages/ReturnDetail.jsx:68–75`. Users miss context on failure.

### Low–Medium

- **Potential state update after component unmount** — Race conditions in `src/pages/WarrantyDetail.jsx:44–69`, `src/pages/ReturnDetail.jsx:43–66`.
- **History view resets on data refresh** — `src/pages/WarrantyDetail.jsx:38–40,232–234`, `src/pages/ReturnDetail.jsx:37–39,196–197`. User loses scroll position.

---

## Performance & Tech Debt

### Medium

- **Duplicate logic across WarrantyDetail/ReturnDetail** — Maintenance burden; suggests opportunity for shared component.

### Low

- **Heavy inline styles and inline component definitions** — `src/pages/WarrantyDetail.jsx:91–106,112–116,238–271`, `src/pages/ReturnDetail.jsx:88–102,108–112,201–234`.

---

## PM Notes / Requirements Gaps

- No documentation found; expected behavior inferred from code.
- Status naming ambiguity: `pendiente_validacion` vs `activo`.
- Required fields per status transition not defined in code.
- Admin rejection reason not stored.
- Evidence stores only single URL; no audit trail.
- For returns, vendor fields may be overwritten during updates.

---

## Next Info Needed

- **Storage policy definitions** — Required to verify evidence bucket access controls are properly enforced (private bucket + signed URLs).
- **Clarify evidence access scope** — Which roles (admin/sucursal/owner) may view/download evidence once private.
