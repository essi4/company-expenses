# EASY Business Platform — Master Blueprint

## Product boundary

EASY is a web-first multi-business SaaS platform. The platform is the product; each Business is a configurable workspace running on the same core.

```
EASY Web Platform
├─ Public / Landing
├─ Authentication & EASY ID
├─ Super Admin / Control Center
├─ Business Workspace
├─ Customer Portal
└─ Shared Core Services
   ├─ Identity & Access
   ├─ Customer
   ├─ Catalog
   ├─ Appointment / Order
   ├─ Invoice / Receipt
   ├─ Payment / Cashier
   ├─ Ledger
   ├─ Inventory
   ├─ Notification
   ├─ Automation
   ├─ Reporting / Analytics
   ├─ Integration / API
   └─ Audit / Governance
```

## Business contract

Every Business has:
- stable identity and slug
- category + mode
- plan / subscription
- locale, timezone and currency
- contact and legal profile
- enabled module set
- payment methods
- invoice policy
- roles and permissions
- working hours and operational settings
- extensible JSON configuration for business-specific fields

Business-specific capability must be implemented as configuration or a module, not by branching the core for every business type.

## Core module strategy

Modules are reusable across categories. A business may enable or disable modules according to platform policy and subscription entitlement.

Core modules currently include customers, appointments, catalog, staff, invoicing, payments, cashier, ledger, inventory, reports, online booking and notifications.

## Financial strategy

Payment is not synonymous with invoice.

Supported flows:
1. Appointment / Order → Quick Payment → Receipt/transaction
2. Appointment / Order → Optional Invoice → Payment → Receipt
3. Invoice → Partial Payment(s) → Due balance → Settlement
4. Mixed payment: card terminal + cash/transfer

Invoice is a document. Payment is a transaction. Ledger is the financial source of truth.

## UX system

Persian RTL is the default web locale. Forms use a shared field registry so labels, validation, sensitivity, searchability and input semantics remain consistent. Phone/email/reference values are LTR; money and numeric values use tabular numerals.

## Scale rules

Design for hundreds of Business categories without creating hundreds of app codebases:
- category registry
- mode registry
- module registry
- field registry
- workflow registry
- permission registry
- theme/token system
- provider adapters
- event contracts

## Non-negotiable architecture rules

- UI does not own business rules.
- Financial writes are idempotent and auditable.
- Tenant/business boundaries are enforced at the data layer.
- Sensitive fields are explicit in the field registry.
- Business-specific extensions do not fork the platform core.
- Production database changes stay behind explicit approval.
- Feature branch changes are tested before merge; production deployment remains a separate final step.
