import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const title = "The ESV Middle Case — Who Holds Crossway's Keys?";
const description =
  "The first essay in this series asked who owns the modern English Bible's pipelines and found a Murdoch family trust. The ESV is the control case: a not-for-profit ministry that owns its own translation outright. The fence, it turns out, looks remarkably similar. A sourced essay from garovartabedian.com, alongside The Afterlife Atlas.";
const url =
  "https://garovartabedian.com/evidence/frameworks/essays/esv-crossway";
const disclosure =
  "Every load-bearing fact traces to a named, checkable source: Crossway's own permissions page (read the day of drafting), the English Standard Version record, the Good News Publishers Form 990 figures reported through ProPublica's Nonprofit Explorer, and the public terms of the ESV's own digital channels. Where a claim comes from Crossway telling its own story — distribution counts, growth claims, the ministry framing — the essay says so rather than quoting it as neutral fact. An independent verification pass checked each numbered claim against the source it cites before drafting.";
const thesis =
  "The ESV proves the tollbooth is not a News Corp invention. A not-for-profit ministry that owns its own translation outright — no conglomerate, no private equity, no licensing pipeline in Nashville — still runs a 500-verse fence with permission forms behind it. Which means the honest question was never only who owns the pipeline. It is whether a modern translation can be funded at all without one.";
const datePublished = "2026-11-05";
const datePublishedLabel = "November 5, 2026";
const editorName = "Garo Vartabedian";

const AUTHOR_STATEMENT =
  "I write from explicit Christian commitment, and this essay touches that commitment directly: it is about the Bible. It is not apologetics. The first essay in this series traced the NIV and the NKJV into a secular media empire and asked who holds the keys. This one runs the same test on the translation many of my own tribe actually reads — published by a ministry, owned by a ministry, sold by a ministry. I hold the book itself to be the Word of God. That conviction is why the ownership question interests me, and it cuts in every direction: against the conglomerate in the first essay, and against any comfort I might take in a friendlier landlord here.";

const NOT_COVERED =
  "This essay treats one narrower question: what the Crossway model shows about translation ownership, using the first essay's record as the control. It does not retry the translation-philosophy wars (formal versus dynamic equivalence, the ESV's gender-language decisions, KJV-Onlyism); it does not review the ESV's translation quality, which is a different and longer argument; it does not open the Catholic, Anglican, or Lutheran editions of the ESV except where they touch licensing; it does not audit Crossway beyond its public Form 990, whose categories do not isolate the ESV as a product line; and it does not settle whether Crossway's giveaway claims describe the typical copy or the exceptional one — its own published numbers, examined below, do not fully agree with each other.";

const POSSIBLE_READINGS = [
  {
    label: "One",
    title: "Same tollbooth, friendlier sign",
    body: "The fence is the finding. Five hundred verses, a quarter of your work, half a book — Crossway's numbers sit almost exactly where Biblica's sat, and behind both fences stands a permissions office. Ownership changed; the regime did not. Copyright in a fresh translation creates the tollbooth whoever holds the copyright, and a ministry holding it is still a holder.",
  },
  {
    label: "Two",
    title: "The ministry difference is real",
    body: "No shareholder extracts anything from a not-for-profit. The surplus from a $62 million book house recycles into the mission that produced it; the text is free to read on the largest Bible app on earth; the API is free for non-commercial work. A fence around a commons, maintained by its gardeners, is not the same object as a fence around an asset, maintained for its owners.",
  },
  {
    label: "Three",
    title: "The system working as designed",
    body: "Copyright funded a translation committee of working scholars, a quarter-century of revisions, and hundreds of millions of printed copies — then the same legal tool let the open-translation movement build its exit. The ESV is what the system's defenders always said it would produce: private funding, public benefit, and a fence that is the price of the funding.",
  },
];

type SourceKind =
  | "primary"
  | "publisher record"
  | "journalism"
  | "project";

const SOURCES: { href: string; kind: SourceKind; label: ReactNode }[] = [
  {
    href: "https://www.crossway.org/permissions/",
    kind: "primary",
    label: (
      <>
        <strong>Crossway.</strong> &ldquo;ESV Bible Permissions.&rdquo; The
        live rulebook, read on the day of drafting: the ESV text &copy;
        2001 by Crossway, a publishing ministry of Good News Publishers;
        quotation up to and including 500 verses in print, digital, and
        audio without a formal license, provided the verses are no more
        than half of any one book, under 25 percent of the quoting work,
        and not in a commentary or biblical reference work; no Creative
        Commons release and no translation without permission; copyright
        notice required. No AI or machine-learning clause appears on the
        page.
      </>
    ),
  },
  {
    href: "https://api.esv.org/",
    kind: "primary",
    label: (
      <>
        <strong>Crossway.</strong> The ESV API terms: free for
        non-commercial use within the same 500-verse and half-a-book caps,
        revocable; use beyond the caps is reserved to organizations. The
        digital fence, stated by its owner.
      </>
    ),
  },
  {
    href: "https://projects.propublica.org/nonprofits/search?q=Good+News+Publishers",
    kind: "primary",
    label: (
      <>
        <strong>Good News Publishers, Form 990</strong> (via ProPublica
        Nonprofit Explorer; EIN 36-1143987). Fiscal year ending May 2025:
        revenue of about $62.2 million, of which inventory sales were
        about 92.6 percent ($57.6 million), contributions about $1.4
        million, and royalties about $2.7 million. The filing does not
        isolate the ESV as a product line.
      </>
    ),
  },
  {
    href: "https://en.wikipedia.org/wiki/English_Standard_Version",
    kind: "publisher record",
    label: (
      <>
        <strong>English Standard Version (record).</strong> Published
        September 2001 by Crossway; derived from the 1971 Revised
        Standard Version under a September 1998 agreement with the
        National Council of Churches; a fourteen-member translation
        oversight committee chaired by Lane T. Dennis, with J. I. Packer
        as general editor and Leland Ryken as literary stylist; text
        editions in 2007, 2011, 2016, and 2025. The current notice reads
        &copy; 2001, &ldquo;ESV Text Edition: 2025.&rdquo;
      </>
    ),
  },
  {
    href: "https://www.biblica.com/permissions/",
    kind: "primary",
    label: (
      <>
        <strong>Biblica.</strong> &ldquo;Permissions.&rdquo; The contrast
        fence from the first essay in this series: 500 or fewer verses,
        no complete book, under 25 percent of the work — with separate
        gates Crossway&rsquo;s page does not have, including an AI/ML license
        requirement and commercial print licensing routed to
        HarperCollins Christian Publishing in Nashville.
      </>
    ),
  },
  {
    href: "https://www.bible.com/versions/59",
    kind: "project",
    label: (
      <>
        <strong>YouVersion (Life.Church).</strong> The ESV reading page,
        titled &ldquo;ESV 2025&rdquo; and marked 100% free — while the
        copyright notice carried on the page still names the 2016 text
        edition. Free reading is real; its paperwork lags its marketing,
        which this essay notes rather than resolves.
      </>
    ),
  },
];

const RELATED: { href: string; name: string; relation: string }[] = [
  {
    href: "/evidence/frameworks/essays/bible-nobody-owns",
    name: "The Bible Nobody Owns",
    relation:
      "Essay No. 1 in this series: the NIV and NKJV pipelines inside News Corp, and the open-licensing exit. This essay is its control case.",
  },
  {
    href: "/evidence/frameworks",
    name: "The Afterlife Atlas",
    relation:
      "54 world traditions read the same way this essay reads a publishing record — sources first, then observation, inference, and the stated limit.",
  },
  {
    href: "/scriptures",
    name: "The Scripture Library",
    relation:
      "Read the texts in their public-domain and open editions — the counter-movement made readable.",
  },
  {
    href: "/church",
    name: "The Church Room",
    relation:
      "What the gathered church did with the text once it could hold a copy — councils, creeds, and disputes.",
  },
  {
    href: "/word/free",
    name: "The Free Way",
    relation:
      "The site's own record of source and license chains for the texts it hosts — the essay's subject, inspected up close.",
  },
  {
    href: "/jesus",
    name: "The Jesus World",
    relation:
      "The words underneath every licensed translation: the sayings, the parables, and the historical record they descend from.",
  },
];

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: "1.5rem 0 0",
        fontSize: "1.02rem",
        lineHeight: 1.85,
        color: "var(--ink)",
        maxWidth: "44rem",
      }}
    >
      {children}
    </p>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "var(--accent-deep)",
        textDecoration: "underline",
        textDecorationThickness: "1px",
        textUnderlineOffset: "0.18em",
        textDecorationColor: "color-mix(in srgb, var(--accent) 45%, transparent)",
      }}
    >
      {children}
    </a>
  );
}

function AtlasLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        color: "var(--accent-deep)",
        textDecoration: "none",
        borderBottom: "1px dotted color-mix(in srgb, var(--accent) 60%, transparent)",
      }}
    >
      {children}
    </Link>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        margin: "4rem 0 0",
        fontSize: "clamp(1.7rem, 3vw, 2.3rem)",
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
        maxWidth: "24ch",
        textWrap: "balance",
      }}
    >
      {children}
    </h2>
  );
}

function AuthorStatement() {
  return (
    <section
      aria-label="From the author"
      style={{
        margin: "2.5rem 0 0",
        maxWidth: "44rem",
        border: "1px solid var(--line)",
        borderLeft: "4px solid var(--accent)",
        borderRadius: "10px",
        background: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
        padding: "1.25rem 1.5rem",
      }}
    >
      <div className="hw-kicker" style={{ marginBottom: "0.6rem" }}>
        From the author
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "0.95rem",
          lineHeight: 1.75,
          color: "var(--ink)",
        }}
      >
        {AUTHOR_STATEMENT}
      </p>
    </section>
  );
}

function ThesisBlock() {
  return (
    <figure
      style={{
        margin: "1.75rem 0 0",
        maxWidth: "44rem",
        borderTop: "3px double var(--accent)",
        borderBottom: "3px double var(--accent)",
        padding: "1.5rem 0.25rem",
      }}
    >
      <figcaption className="hw-kicker" style={{ marginBottom: "0.75rem" }}>
        The thesis
      </figcaption>
      <blockquote
        style={{
          margin: 0,
          fontSize: "clamp(1.25rem, 2.4vw, 1.6rem)",
          lineHeight: 1.55,
          letterSpacing: "-0.01em",
          color: "var(--ink)",
        }}
      >
        {thesis}
      </blockquote>
    </figure>
  );
}

function ReadingsFrame() {
  return (
    <figure
      style={{
        margin: "2rem 0 0",
        maxWidth: "58rem",
        overflow: "hidden",
        border: "1px solid var(--line)",
        borderRadius: "12px",
        background: "var(--surface)",
      }}
    >
      <figcaption
        style={{
          borderBottom: "1px solid var(--line)",
          padding: "1rem 1.25rem",
        }}
      >
        <div className="hw-kicker" style={{ marginBottom: "0.4rem" }}>
          Three readings
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--muted)",
          }}
        >
          The record assembled above is compatible with at least three
          honest readings. The essay does not force one; it separates
          them, then says where its author leans.
        </p>
      </figcaption>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {POSSIBLE_READINGS.map((reading, i) => (
          <div
            key={reading.label}
            style={{
              padding: "1.25rem",
              borderLeft: i > 0 ? "1px solid var(--line)" : undefined,
            }}
          >
            <div
              className="hw-kicker"
              style={{ color: "var(--muted)", marginBottom: "0.5rem" }}
            >
              {reading.label}
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.15rem",
                letterSpacing: "-0.01em",
              }}
            >
              {reading.title}
            </h3>
            <p
              style={{
                margin: "0.6rem 0 0",
                fontSize: "0.9rem",
                lineHeight: 1.65,
                color: "var(--muted)",
              }}
            >
              {reading.body}
            </p>
          </div>
        ))}
      </div>
    </figure>
  );
}

function ArticleStructuredData() {
  const json = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished,
    author: {
      "@type": "Person",
      name: editorName,
      url: "https://garovartabedian.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Garo Vartabedian",
      url: "https://garovartabedian.com",
    },
    creditText:
      "Load-bearing facts traced to the named sources in the essay's source list.",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    isPartOf: {
      "@type": "CollectionPage",
      name: "How We Know — Essays",
      url: "https://garovartabedian.com/evidence/frameworks/essays",
    },
    keywords:
      "ESV, English Standard Version, Crossway, Good News Publishers, Bible copyright, Bible licensing, RSV, Bible permissions",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export const metadata: Metadata = {
  title: `${title} — Essays`,
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    type: "article",
    url,
    siteName: "Garo Vartabedian",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function EsvCrosswayEssayPage() {
  return (
    <div
      style={{ maxWidth: "58rem", margin: "0 auto", padding: "2rem 1.5rem 5rem" }}
    >
      <ArticleStructuredData />

      <article>
        <p className="hw-kicker">
          <Link href="/evidence/frameworks">← The Afterlife Atlas</Link>
          {" · "}
          <Link href="/evidence/frameworks/essays">Essays</Link>
          {" · No. 2 of an ongoing series"}
        </p>

        <header style={{ marginTop: "0.5rem" }}>
          <h1
            style={{
              fontSize: "clamp(2.1rem, 4.4vw, 3.3rem)",
              margin: "0.25rem 0 0.5rem",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              maxWidth: "18ch",
              textWrap: "balance",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: "1rem 0 0",
              maxWidth: "46rem",
              fontSize: "1.12rem",
              lineHeight: 1.7,
              color: "var(--muted)",
            }}
          >
            {thesis}
          </p>
          <p
            className="hw-kicker"
            style={{ marginTop: "1.5rem", color: "var(--muted)" }}
          >
            <time dateTime={datePublished}>{datePublishedLabel}</time>
          </p>
        </header>

        <figure style={{ margin: "2rem 0 0" }}>
          <Image
            src="/evidence/essays/esv-crossway/hero.jpg"
            alt="An open modern study Bible on a wooden desk, a ministry book warehouse behind it in soft window light"
            width={1920}
            height={1280}
            priority
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </figure>

        <AuthorStatement />

        <div style={{ marginTop: "1rem" }}>
          <Paragraph>
            Start where the first essay in this series started: a Sunday
            morning, a reading, a phone open beside the pew Bible. This
            time the words are more likely to be the English Standard
            Version. The ESV is the translation of the sermon podcast, the
            seminary classroom, the church plant with the carefully
            designed website. It feels — and this is the feeling this essay
            exists to test — like the translation that escaped the story
            told in{" "}
            <AtlasLink href="/evidence/frameworks/essays/bible-nobody-owns">
              The Bible Nobody Owns
            </AtlasLink>
            . No Murdoch. No Nashville permissions post-office box inside a
            media empire. A ministry in Wheaton, Illinois, publishing the
            book it translated, under its own name, for its own stated
            mission. If the first essay&rsquo;s argument was that the
            pipeline matters as much as the text, the ESV is the case
            where the pipeline and the text have the same owner — and the
            owner is a church-adjacent nonprofit. So run the same test.
            Read the permissions page. Read the tax filing. Ask who can
            say no, and to what, and on what terms. The answers are more
            interesting than either tribe&rsquo;s slogan.
          </Paragraph>

          <SectionHeading>
            A translation born from another translation
          </SectionHeading>

          <Paragraph>
            The ESV did not begin as a translation from the Hebrew and
            Greek in the way its marketing sometimes lets readers assume.
            It began as a negotiation. In the early 1990s, Lane T. Dennis,
            president of Crossway — the publishing ministry of Good News
            Publishers, in Wheaton — was arguing that evangelical churches
            needed a new essentially literal translation, the kind that
            tracks the wording of the original closely rather than
            restating its sense. In 1997 Dennis, alongside Trinity
            Evangelical Divinity School professor Wayne Grudem, went to
            the National Council of Churches to ask for the use of a text
            the Council already owned: the 1971 edition of the Revised
            Standard Version. In September 1998 the agreement was reached.
            Crossway could use the 1971 RSV — and modify it.
          </Paragraph>

          <Paragraph>
            Pause on the strangeness of that, because the first essay&rsquo;s
            readers have met this Council before. The NCC is the body whose
            opening of the RSV license ended Thomas Nelson&rsquo;s
            exclusivity in the story told there — the landlord whose
            decision taught a publisher to want a copyright of its own.
            A generation later, the same landlord rented the same base text
            to the evangelicals who had criticized the RSV most sharply,
            and the ESV is what they built on the lot. The translation
            often described as the conservative answer to the RSV is,
            legally and textually, the RSV&rsquo;s licensed descendant.
            The record describes a fourteen-member translation oversight
            committee chaired by Dennis himself, with J. I. Packer as
            general editor and Leland Ryken as literary stylist, aided by
            more than fifty review scholars and an advisory council of
            more than fifty more. The ESV was announced in February 1999
            and published in September 2001; the first print edition, the
            Classic Reference Bible, is dated October 31 of that year.
            Committee member Wayne Grudem has said that roughly eight
            percent of the 1971 text — some 60,000 words — was revised for
            that first edition. That figure is Grudem&rsquo;s own account,
            repeated in the secondary record; no independent audit of it
            exists, and this essay treats it the way it treats every
            interested party&rsquo;s number: as a claim about the work by
            the people who did the work, plausible, probably broadly
            right, and not a measurement.
          </Paragraph>

          <SectionHeading>The owner is the ministry</SectionHeading>

          <Paragraph>
            Here is the structural fact that separates this case from
            everything in the first essay. The copyright line reads: the
            Holy Bible, English Standard Version, &copy; 2001 by Crossway,
            a publishing ministry of Good News Publishers. The translator,
            the copyright holder, and the publisher are one organization,
            and the organization is a not-for-profit. There is no Biblica
            holding a text at arm&rsquo;s length from a commercial
            licensee. There is no acquisition chain — no 1988 family sale,
            no private-equity flips in 2006 and 2010, no July closing in a
            conglomerate&rsquo;s fiscal year. The Dennis family still runs
            the house; Josh Dennis, the founder-president&rsquo;s son, is
            its chief executive. Whatever else is true of the ESV, no one
            can buy Crossway out from under it without buying a ministry
            whose assets are locked, by nonprofit law, to its charitable
            purpose.
          </Paragraph>

          <Paragraph>
            And the ministry is, by its own tax filing, a book business.
            The Form 990 is the one document a nonprofit cannot
            narrate: it is sworn, categorized, and public. For the fiscal
            year ending May 2025, Good News Publishers reported revenue
            of about $62.2 million. Of that, about $57.6 million — 92.6
            percent — was inventory sales: books and Bibles, sold.
            Contributions were about $1.4 million. Royalties — the line
            where a licensing empire would show its rents — were about
            $2.7 million. Two honest conclusions fit inside those three
            numbers. The first is that nobody is getting rich the way a
            shareholder gets rich; there are no shareholders. The second
            is that the ESV&rsquo;s world is funded overwhelmingly by
            selling copies, not by donations and not, in the main, by
            licensing the text to others. The filing does not separate
            the ESV from Crossway&rsquo;s trade books, so no one outside
            Wheaton knows the translation&rsquo;s true share of that
            $57.6 million. Anyone who tells you otherwise is guessing,
            including anyone who guesses in Crossway&rsquo;s favor.
          </Paragraph>

          <SectionHeading>The fence, itemized</SectionHeading>

          <Paragraph>
            Now the permissions page —{" "}
            <ExternalLink href="https://www.crossway.org/permissions/">
              Crossway&rsquo;s own
            </ExternalLink>
            , read the day this essay was drafted, the same test the
            first essay applied to Biblica. The ESV text may be quoted in
            print, digital, and audio formats up to and including five
            hundred verses without a formal license or express written
            permission. The conditions: the verses quoted must not amount
            to more than one-half of any one book of the Bible, nor
            account for twenty-five percent or more of the total text of
            the work doing the quoting; and the verses must not be quoted
            in a commentary or other biblical reference work. A copyright
            notice is required. Beyond the allowance: permission. The
            text may not be released under Creative Commons, and it may
            not be translated, without permission. That is the fence.
            Stand back and look at its measurements next to the one from
            the first essay. Biblica&rsquo;s NIV fence: five hundred
            verses, no complete book, under twenty-five percent.
            Crossway&rsquo;s ESV fence: five hundred verses, half a book,
            under twenty-five percent. Different owners — a
            text-holding nonprofit with a conglomerate licensee on one
            side, a single ministry owner-publisher on the other — and
            the central numbers are the same numbers, because the numbers
            were never really about the owner. They are what a
            permissions regime looks like when it is calibrated to let
            ordinary quotation breathe and route everything larger
            through an office that can say yes, say no, and keep records.
          </Paragraph>

          <Paragraph>
            The fences are not identical, and the differences are the most
            instructive part of the comparison. Crossway&rsquo;s half-book
            cap is tighter than Biblica&rsquo;s whole-book cap: you may
            quote fewer consecutive verses of a short book before you
            need the office. Crossway expressly excludes commentaries and
            reference works from the free allowance, the category where
            quotation is densest and most commercial. But two gates from
            the first essay are simply absent here. There is no separate
            license requirement for AI or machine-learning features —
            Biblica&rsquo;s newest fence, the one that routes every
            AI-touching app to a permission form, has no counterpart on
            Crossway&rsquo;s page or in its API terms; whether that is
            policy or merely a page not yet updated, the text today does
            not contain it. And there is no Nashville: commercial print
            licensing for the ESV does not route to a conglomerate&rsquo;s
            permissions department in another company&rsquo;s building.
            It routes to Wheaton — to the same ministry that translated
            the text. The tollbooth has one booth, and the people in it
            work for the people who built the road.
          </Paragraph>

          <SectionHeading>The permanent text that wasn&rsquo;t</SectionHeading>

          <Paragraph>
            Ownership confers one more power the first essay could only
            watch from outside: the power to change the text. The ESV has
            been revised in editions dated 2007, 2011, and 2016 — and
            then Crossway did something no licensing pipeline would dare.
            With the 2016 edition it announced that the text would stand
            unchanged in all future editions: a permanent text, fixed the
            way its readers&rsquo; grandparents&rsquo; King James had
            been fixed. Within weeks, in September 2016, Lane Dennis
            said the sentence out loud: the unchanged-forever line
            &ldquo;was a mistake.&rdquo; A text owned by scholars can be
            corrected by scholars; a text promised permanent cannot, and
            the ministry chose correction over the promise. In February
            2025 Crossway issued a further text edition — sixty-eight
            words, by its own accounting, including the restoration of
            the 2001 renderings at Genesis 3:16 and 4:7. The current
            copyright notice tells the story in miniature: &copy; 2001,
            &ldquo;ESV Text Edition: 2025.&rdquo; One owner means one
            address for every argument about a word — and it also means
            the argument can actually be won there. The NIV&rsquo;s
            readers petition a committee chartered to be unpetitionable,
            voting under a seventy-percent rule, while its licensee sells
            the result. The ESV&rsquo;s readers petition the publisher
            itself, and once, famously, the publisher apologized.
          </Paragraph>

          <SectionHeading>Free as in reading</SectionHeading>

          <Paragraph>
            The strongest evidence for the ministry reading is not the tax
            filing. It is the phone in the pew. The ESV is free to read
            on YouVersion — the largest Bible app in the world lists it
            as one hundred percent free — free on BibleGateway, and free
            on Crossway&rsquo;s own esv.org, whose free apps include the
            full text and a complete study Bible, the Global Study Bible.
            The subscription Crossway sells, at $3.99 a month after a
            trial, buys study Bibles, commentaries, and premium audio —
            the apparatus around the text, not the text. Its API, the
            door through which other people&rsquo;s software reads the
            translation, is free for non-commercial use inside the same
            five-hundred-verse and half-a-book caps, revocable, with
            larger use reserved to organizations. Compare the first
            essay&rsquo;s map honestly: the NIV is also free to read on
            the same apps, through an express royalty-free channel with a
            single remarkable carve-out — any AI or machine-learning
            feature voids it. The ESV&rsquo;s terms contain no such
            carve-out today. Two details keep this paragraph honest.
            YouVersion&rsquo;s ESV page is titled for the 2025 text while
            the copyright notice it carries still names the 2016 edition;
            free reading is real, and its paperwork lags its marketing,
            here as everywhere. And free to read is not free to reuse:
            the reader in the pew may open the text without limit and
            quote five hundred verses of it, and may not publish a
            translation, a commentary, or a Creative Commons edition of
            it at any price of asking nicely. The gate is at the
            republication line, exactly where Biblica put it.
          </Paragraph>

          <SectionHeading>The honest dispute</SectionHeading>

          <Paragraph>
            Steelman the ministry, because it deserves its strongest
            form. Nobody compelled Crossway to exist. A family-founded
            publishing house looked at the translation landscape in the
            1990s, mortgaged its future on a committee of scholars, and
            produced the text a large share of the English-speaking
            church now reads — then reported, in its own anniversary
            accounting, that most of the copies it prints are given away
            freely through ministry partners around the world, with
            cumulative print distribution passing three hundred million.
            If that is even roughly the shape of reality, the ESV is the
            best-case version of the first essay&rsquo;s system: the
            fence funds the garden, and the garden feeds people who never
            see the fence. Now the audit, because this essay audits
            friends the way it audits empires. The giveaway claim and the
            distribution ladder are Crossway&rsquo;s own numbers,
            unaudited, and they do not sit still: a single October 2026
            article on Crossway&rsquo;s site gives both &ldquo;more than
            369 million&rdquo; and &ldquo;over 355 million&rdquo; for the
            same cumulative count, and the Form 990 — the sworn document
            — cannot confirm any of it, because it does not isolate ESV
            units and because distributed is not sold. The same article
            says ESV sales &ldquo;nearly doubled over the last two
            years&rdquo;; retellings that upgrade that to more than
            doubled, or that attach it to a named executive the article
            does not name, are improving the story past its source. What
            survives audit is narrower and still significant: a
            not-for-profit reported $57.6 million of inventory sales
            against $1.4 million of contributions, gives its text away
            free in the channels where most people actually read, and
            keeps a permissions office with familiar measurements. The
            ministry is real. So is the market. Both facts are in the
            filing.
          </Paragraph>

          <SectionHeading>The thesis</SectionHeading>

          <ThesisBlock />

          <Paragraph>
            Read the two essays as one experiment with a control group.
            Essay one: a translation whose text is held by a ministry
            and whose pipeline is held by a conglomerate. This essay: a
            translation whose text and pipeline are held by the ministry
            itself. The variable that changes is the owner&rsquo;s
            character. The variable that does not change is the fence —
            its height, its gate, its office. That is the experiment&rsquo;s
            result, and it disciplines both of the first essay&rsquo;s
            temptations: the temptation to make News Corp the villain of
            a story that would read almost identically without it, and
            the temptation to make nonprofit ownership the hero of a
            story in which the hero still keeps the keys. What ownership
            changes is not whether there is a gate. It is who answers
            when you knock, what the surplus does after it is collected,
            and whether the text can be argued with at a single address.
            On those three questions the ESV&rsquo;s answers are
            genuinely better. On the existence of the gate, its answer
            is the same as Nashville&rsquo;s.
          </Paragraph>

          <SectionHeading>What the record leaves open</SectionHeading>

          <Paragraph>
            The sources assembled above settle the facts; they do not
            settle the reading. At least three honest interpretations
            remain on the table, and the essay refuses to collapse them
            prematurely.
          </Paragraph>

          <ReadingsFrame />

          <Paragraph>
            Reading one — same tollbooth, friendlier sign. The fence is
            the finding, and the character of the fence-keeper is a
            comfort, not a refutation. Reading two — the ministry
            difference is real. A surplus that recycles into mission is
            not a dividend; a text free in every channel where reading
            actually happens is not a locked asset; and a publisher that
            can apologize for a text decision is accountable in a way a
            licensing chain structurally is not. Reading three — the
            system working as designed. Copyright paid the scholars,
            funded the revisions, printed the hundreds of millions, and
            left the open movement free to build the exit with the same
            tool. The data underdetermine which reading is finally
            right, and good evidence work says so rather than pretending
            otherwise. What the record does settle is structure: where
            the rights sit, what the rules say, and where the money line
            runs — $57.6 million of it, through a Wheaton warehouse.
          </Paragraph>

          <SectionHeading>Where this essay lands</SectionHeading>

          <Paragraph>
            The author&rsquo;s lean, stated as a lean: the ESV case has
            made me less interested in the owner&rsquo;s virtue and more
            interested in the gate&rsquo;s terms. A ministry can hold
            keys badly and a conglomerate can hold them politely; the
            documents do not care about our tribes. But if the gate is
            unavoidable — if every funded translation arrives with one —
            then the questions worth asking of any holder are the three
            this essay could actually answer from public record. Can the
            text be read, freely, where people read? Yes — Crossway
            passes, and passes cleanly. Does the surplus serve the
            text&rsquo;s stated mission or exit to owners? It recycles;
            there are no owners to exit to. Can the holder be argued
            with, at one address, on the record? Once, on the record, it
            apologized. By those tests the middle case is not the first
            essay&rsquo;s villain with better branding. It is a genuinely
            different settlement of the same tension — &ldquo;freely you
            have received, freely give&rdquo; (Matthew 10:8, from the
            public-domain King James text) administered by people who
            also have a warehouse to pay for. The tension does not
            dissolve. It is, here, being carried by the right kind of
            carrier — and it is still being carried, at five hundred
            verses a crossing.
          </Paragraph>

          <Paragraph>
            What the data do not settle is equally worth saying. Whether
            the giveaway or the sale is the typical ESV copy; what the
            translation alone earns inside a $62 million book house;
            whether the missing AI clause is a policy or an oversight
            that a future permissions page will quietly repair; and
            whether a text revised in 2025 can hold the loyalty that the
            promise of permanence was invented, in 2016, to protect.
            Those are reporting assignments, not conclusions, and a
            future essay in this series may take them up.
          </Paragraph>

          <SectionHeading>Scope of this essay</SectionHeading>

          <Paragraph>{NOT_COVERED}</Paragraph>

          <SectionHeading>Method and sources</SectionHeading>

          <Paragraph>{disclosure}</Paragraph>
        </div>

        <section
          aria-label="Keep reading"
          style={{ marginTop: "4rem", maxWidth: "46rem" }}
        >
          <h2
            className="hw-kicker"
            style={{ margin: "0 0 1rem", color: "var(--muted)" }}
          >
            Keep reading
          </h2>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: "0.75rem",
            }}
          >
            {RELATED.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{ color: "var(--accent-deep)", textDecoration: "none" }}
                >
                  {item.name}
                </Link>
                <span style={{ color: "var(--muted)" }}>
                  {" — "}
                  {item.relation}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <footer style={{ marginTop: "4rem" }}>
          <h2
            className="hw-kicker"
            style={{ margin: "0 0 1rem", color: "var(--muted)" }}
          >
            Sources
          </h2>
          <p
            style={{
              margin: "0 0 1rem",
              fontSize: "0.85rem",
              lineHeight: 1.6,
              color: "var(--muted)",
              maxWidth: "44rem",
            }}
          >
            Underlined links leave this site for outside sources.
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gap: "1rem",
              maxWidth: "46rem",
            }}
          >
            {SOURCES.map((source, index) => (
              <li
                key={`${source.href}-${index}`}
                style={{
                  borderLeft: "2px solid var(--line)",
                  paddingLeft: "1rem",
                  fontSize: "0.88rem",
                  lineHeight: 1.7,
                  color: "var(--ink)",
                }}
              >
                <span
                  className="hw-kicker"
                  style={{
                    display: "inline-block",
                    marginRight: "0.5rem",
                    marginBottom: 0,
                    fontSize: "0.62rem",
                  }}
                >
                  {source.kind}
                </span>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textUnderlineOffset: "0.18em" }}
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      </article>
    </div>
  );
}
