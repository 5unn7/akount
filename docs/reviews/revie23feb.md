
Critical Findings (Fix Before Production)
1. [SECURITY-HIGH] Global Tax Rate Pollution
Any authenticated user can create tax rates with entityId: null, visible to ALL tenants on the platform. A malicious user could inject a bogus "HST 0%" rate seen by everyone.

File: tax-rate.schema.ts line 17
Fix: Make entityId required in create schema, or gate entityId: null behind admin-only check.

2. [SECURITY-HIGH] tenantId Accepted from Request Body in Onboarding /complete
The /complete endpoint trusts tenantId from the client body. Currently mitigated by OWNER role check, but one RBAC regression makes it exploitable.

File: onboarding.ts lines 50-57
Fix: Derive tenantId server-side from user's active membership.

3. [FRONTEND-HIGH] HeroSection Bypasses SSR-Safe Wrapper
page.tsx imports HeroSection directly instead of the HeroSectionClient wrapper (which uses dynamic(..., { ssr: false })). The wrapper exists but is never used. One-line fix.

File: page.tsx line 1
Fix: import { HeroSectionClient as HeroSection } from '@/components/landing/HeroSectionClient'

Medium Findings (Fix This Sprint)
Security
#	Finding	File	Impact
S-2	listTaxRates returns incomplete data when entityId absent	tax-rate.service.ts:37-48	Users see only global rates, missing custom rates
S-4	Content-Disposition header injection via invoice number	invoices.ts:221	HTTP response splitting risk
S-5	z.record(z.unknown()) stores arbitrary JSON in onboarding	onboarding.ts:62-63	Potential stored XSS or prototype pollution
Financial
#	Finding	File	Impact
F-M1	updateInvoice/updateBill accepts PATCH totals without re-validating against line items	invoice.service.ts:180-203	Corrupted totals can exist in DRAFT state (mitigated: posting service catches at GL time)
F-M2	Transfer creates dual JEs via linkedEntryId -- reports may double-count	transfer.service.ts:186-293	GL reports must filter for deduplication or transfers appear 2x
Frontend
#	Finding	File	Impact
FE-2	Static key="create" on ClientForm/VendorForm -- latent bug when edit mode added	clients-list-client.tsx:226	Form fields will show stale data when switching records
FE-8	UpcomingPayments fetches client-side via useEffect (waterfall)	UpcomingPayments.tsx:23-33	Visible loading flash while rest of dashboard is populated
FE-9	15 instances of text-[10px] across dashboard files	Multiple	Should use text-micro utility per design token rules
TypeScript
#	Finding	File	Impact
TS-2	StatusBadge status: string instead of enum union	InvoiceStatusBadge.tsx:14, BillStatusBadge.tsx:14	No compile-time validation on status values
TS-4	Inline formatCents/parseCentsInput in line-item-builder	line-item-builder.tsx:50-58	Violates shared utility convention
TS-5	as string casts in updateLine without runtime narrowing	line-item-builder.tsx:94	5 unsafe casts mask type mismatches
TS-7	CALENDAR_SELECT/PERIOD_SELECT missing timestamps	fiscal-period.service.ts:9-36	Violates mandatory convention
Test Coverage
#	Finding	Impact
TC-1	transfer.service.test.ts lacks assertIntegerCents on monetary values	FIN-28 was a calc bug in this exact service -- needs regression protection
TC-2	data-export.service.ts and report-export.service.ts have zero tests	Risk of tenant data leakage in exports
Low Findings (Track as Tasks)
#	Category	Finding
F-L1	Financial	3-currency transfer approximation (has @todo, acceptable for solopreneurs)
FE-1	Frontend	Domain layouts now empty pass-throughs (add comment, not harmful)
FE-3	Frontend	ClientForm/VendorForm ~170 lines of structural duplication
FE-4	Frontend	onSuccess typed as () => void instead of () => void | Promise<void>
FE-7	Frontend	: any on Three.js dynamic imports in landing page
TS-3	TypeScript	BillStatusBadge APPROVED bypasses variant system with inline className
TS-6	TypeScript	onChange callback sync-only in LineItemBuilder
TS-8	TypeScript	validateEntityOwnership duplicated 3x across accounting services
TS-9	TypeScript	auditPeriodAction uses string for action/status params
S-6	Security	Unbounded intents array in onboarding schema
S-7	Security	catch (error: any) in onboarding (should use instanceof)
S-8	Security	TOCTOU on completedSteps array (no transaction wrap)
