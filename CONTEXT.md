# GACS Checker

A single-purpose GACS compliance checklist for building owners: fill in, submit with email, receive results by mail. Acquisition for a configured provider is a product goal; there is no multi-tenant CMS.

## Language

**GACS**:
Gebouwautomatiserings- en Controlesysteem; compliance checked against the RVO checklist (NEN-EN-ISO 52120).
_Avoid_: GAKS

**Checklist**:
The fixed set of control points derived from the RVO “Checklist technische eisen GACS” v3 (7 sections, 43 control points). Hardcoded in the product; not editable via a CMS.
_Avoid_: Questionnaire (as a managed entity), survey

**Control point**:
One numbered checklist item (e.g. `1.1 Warmteafgifte`) with a single-choice set of options marked allowed or not allowed.
_Avoid_: Question (when meaning the regulatory item), requirement row

**Option**:
One selectable answer under a control point; each option is either allowed or not allowed for GACS.
_Avoid_: Answer choice (as a separate domain type)

**Submission**:
A checklist fill-in by a respondent at submit time: chosen options (possibly incomplete), email address, computed score, and advice. Unanswered control points are allowed.
_Avoid_: Lead, response, form post

**Respondent**:
The person who fills in the checklist and receives the results email.
_Avoid_: User, visitor, customer (when meaning the filler)

**Results**:
What the respondent receives by email: chosen options, compliance score, and advice text. Not shown on screen after submit.
_Avoid_: PDF report (unless we later add one), completion screen score

**Score**:
The percentage of *answered* control points whose chosen option is allowed. Unanswered control points are excluded from the denominator.
_Avoid_: NEN class, grade A/B/C (not computed by this product)

**Advice**:
Hardcoded guidance text from score bands (100 / ≥80 / ≥50 / &lt;50), included in the results email. Copy always steers toward contacting the configured provider (acquisition), using whichever Contact CTA fields are set.
_Avoid_: Motivational message (POC term), purely informational tone without CTA

**Provider**:
The single commercial party behind the checker that wants respondents as leads. Name comes from configuration (`PROVIDER_NAME`); the product chrome stays a neutral “GACS Checker,” while acquisition copy refers to that name.
_Avoid_: Tenant, multi-tenant brand

**Contact CTA**:
Configured contact details — URL, email, and/or phone — plus provider name. Shown in: every advice band in the results email, a dedicated links/button block at the bottom of the email, and the thank-you screen. Not shown as a sticky CTA during checklist fill-in. Empty contact fields are omitted.
_Avoid_: Tenant branding, in-form sticky “hulp nodig?”, notification email (POC)

**BCC recipient**:
Optional internal mailbox that receives a copy of the results email when configured via environment; absent means no BCC.
_Avoid_: Tenant notification, lead notification

**Mail identity**:
Outgoing mail uses display name “GACS Checker” and `SMTP_USER` as From (Gmail app password). `REPLY_TO` is used when set; otherwise replies go to `SMTP_USER`.
_Avoid_: Per-tenant from-address

**Thank-you screen**:
Post-submit UI: confirmation that mail is on the way, option to start the checklist again, and (acquisition) a clear path to contact the provider. No score or answers on screen.
_Avoid_: Completion screen, results page

**Results email**:
Dutch email containing: overall score, per-section scores, advice with provider CTA, count “X van 43 beantwoord”, and detail lines only for answered control points.
_Avoid_: On-screen results, NEN class report
