# Job report demo

`/work` links prominently to `/work/job-report`. The free, account-free demo
records business/job details, an optional date/customer, four explicit checklist
states, notes and one before/after photo each. The customized job-report tool is
included in the $100 USD total package with a landing page and an Excel handler
for one business. Each deliverable includes one revision and a handoff guide;
the shared `STARTER_MENU` in `src/lib/portfolio-content.ts` owns the package
price and inquiry. This supersedes the earlier individual-service pricing.
The inquiry opens the existing email address and never attaches the demo report.

Photos and report fields stay in the open browser page. There is no report API,
account, job archive or automatic persistence. Save before refreshing or closing.
Existing site analytics can still record ordinary page views; the feature does
not submit report fields, photos or their filenames to analytics or a server.
Selecting Share explicitly opens the supported OS share sheet; cancellation is
reported honestly and dialog completion does not establish recipient delivery.

The gallery input and camera capture button are separate so Android can retain
existing-photo selection. JPEG, PNG and WebP are accepted up to 10 MiB each;
headers/pixel dimensions are bounded before decoding, then photos are resized
to 1600 pixels maximum and re-encoded without original EXIF/location metadata.
HEIC requires a compatible JPEG/PNG/WebP export. The sample business, address,
work description and original illustrations are visibly fictional.

Export prepares a snapshot. Any change invalidates PDF and text links; replaced
or unmounted exports revoke their object URLs. The PDF uses locally drawn image
pages to preserve Unicode shaping and images without external fonts. It is a
visual PDF, not a tagged/selectable-text document. The HTML preview and UTF-8
text download retain readable words and explicit marked/unmarked states. The
text copy identifies photo presence but does not include image data. Pages are
composed sequentially with one canvas in memory; normal examples fit one page
and long notes paginate without dropping their final lines.

Targeted checks: nine Node cases cover boundaries, Gregorian dates, safe filenames,
malformed/decompression-size image headers and text-copy contents. Five browser
cases run on desktop and iPhone-sized Chrome emulation: real exported photo
pixels, one-page sample, Unicode/long notes, local data boundaries, gallery/camera
chooser behavior, bad replacement retention, stale export invalidation, reset
confirmation, share cancellation, keyboard, 320/390px layout and axe checks.
This is not physical-phone, Safari, actual camera hardware or share-destination
delivery evidence. The public feature needs no backend or paid service to run.
