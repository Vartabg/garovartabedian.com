# Mobile job report demo

Pricing update: Garo confirmed the landing page, Excel handler and customized
job-report tool are one $100 USD total package for one business. The scope below
describes the job-report deliverable within that package. `STARTER_MENU` in
`src/lib/portfolio-content.ts` owns current pricing and the package inquiry.

Garo authorizes a public phone-first job report demo discoverable on `/work`, so
visitors can try the workflow before paying $100 for a customized version.

- Build `/work/job-report`: editable details, optional before/after camera or photo
  inputs, an explicit work checklist and notes, accessible preview and real PDF.
- Include a clearly fictional example with original illustrative images; no
  invented clients, customer outcomes or adoption claims.
- Keep report data and photos in browser memory only. Bound/decode/downsize images,
  avoid uploading or silently persisting drafts, and explain refresh loses them.
- Prepare export on request, invalidate it after changes, and separate download
  from native sharing. A cancelled share must never claim the report was sent.
- Put the demo and truthful $100 customization scope near the top of `/work` and
  on its own route. Use the shared portfolio content spine and existing contact
  email; the CTA opens an inquiry and does not charge or submit the report.
- Verify units, responsive/keyboard/axe browser flows, photos and exported PDF,
  no report-data transmission, failure handling and current export contents.
- Run required lint/typecheck/unit+smoke/build, independent review, audited feature
  branch finish and PR merge; then use the repository's local production release.

The $100 customized version covers one business, one checklist/workflow, one
branded report layout and one revision. Team accounts, shared job archives,
cloud-photo storage, scheduling and payments need a separately scoped project.
Desktop emulation is not evidence of a physical phone or OS share destination.
