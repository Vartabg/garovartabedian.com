import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const title = "The Bible Nobody Owns — and the Empire That Publishes It";
const description =
  "You cannot copyright the Word of God — only the words it was just translated into. How a Murdoch family trust came to sit at the top of the bestselling book in human history, and why believers are building open-licensed translations in answer. A sourced essay from garovartabedian.com, alongside The Afterlife Atlas.";
const url =
  "https://garovartabedian.com/evidence/frameworks/essays/bible-nobody-owns";
const disclosure =
  "Every load-bearing fact traces to a named, checkable source: Biblica's own permissions page (re-read the day of drafting), the Wikipedia publisher records for Zondervan and Thomas Nelson, the News Corp record and its FY2025 Form 10-K figures, the King James Version copyright record, and the New York Times and Reuters reporting on the Nevada trust ruling. Where a claim comes from an interested party telling its own story, the essay says so rather than quoting it as neutral fact.";
const thesis =
  "You cannot copyright the Word of God, but you can copyright the words it was just translated into — and the system that grew up around that single legal fact explains why a Murdoch family trust sits at the top of the bestselling book in human history, and why believers are now building open-licensed translations as the counter-movement.";
const datePublished = "2026-11-05";
const datePublishedLabel = "November 5, 2026";
const editorName = "Garo Vartabedian";

const AUTHOR_STATEMENT =
  "I write from explicit Christian commitment, and this essay touches that commitment directly: it is about the Bible. It is not apologetics. It does not argue that Scripture is true; it asks who holds the keys when Scripture is printed, quoted, sung, posted, and sold in modern English. I hold the book itself to be the Word of God, and that conviction is precisely why I care who collects rent on its translations. The piece is descriptive throughout — what the ownership record, the permissions pages, and the court filings actually show — and it names its leanings where the data leave off.";

const NOT_COVERED =
  "This essay treats one narrower question: who owns the modern English Bible's commercial pipelines, and under what rules. It does not treat the translation-philosophy wars (formal versus dynamic equivalence — word-for-word versus thought-for-thought rendering — plus KJV-Onlyism or the gender-language controversies in NIV revisions and the TNIV episode); the ESV and Crossway's alternative model, which deserves its own piece; the NRSV and the academic translations; Catholic editions and the Apocrypha; non-English licensing under the United Bible Societies or Wycliffe/SIL; textual criticism, which is a different essay entirely; HarperCollins Christian Publishing's internal finances, which are not public; or the private terms of the September 2025 Murdoch family settlement beyond the public record.";

const POSSIBLE_READINGS = [
  {
    label: "One",
    title: "Capture",
    body: "A secular media empire monetizing the sacred, full stop. The Nashville post-office box, the social-media limits applied to a whole platform rather than a post, the separate license gate for any AI feature, and the Crown's perpetual prerogative over the King James text in Britain all support this reading. The freest text on earth, fenced.",
  },
  {
    label: "Two",
    title: "Symbiosis",
    body: "The ministry-and-corporation structure is the only proven way a ten-million-dollar-class translation project survives at scale. Zondervan stepped in for the NIV in 1975, exactly when the nonprofit that had mortgaged its own building ran dry — and carried the translation to completion. The pipeline is capture and rescue in the same transaction, and the NIV exists because of it.",
  },
  {
    label: "Three",
    title: "The system working as designed",
    body: "Copyright did exactly what it was built to do — fund the creation of new expression — and the open-licensing counter-movement now underway is the same system being used in reverse: new expression again, this time deliberately placed outside the tollbooth. The law is neutral; the choices made under it are not.",
  },
];

type SourceKind =
  | "primary"
  | "publisher record"
  | "journalism"
  | "project";

const SOURCES: { href: string; kind: SourceKind; label: ReactNode }[] = [
  {
    href: "https://www.biblica.com/permissions/",
    kind: "primary",
    label: (
      <>
        <strong>Biblica.</strong> &ldquo;Permissions.&rdquo; The live
        rulebook quoted throughout this essay, re-read on the day of
        drafting: the free-quote allowance (no more than 500 verses, no
        complete book, less than 25 percent of the work, with copyright
        acknowledgment), the social-media limits applied to the platform
        as a whole, the lyrics and merchandise rules, full-text licenses
        reserved for registered legal entities, the express royalty-free
        channel for non-commercial apps through api.bible and YouVersion,
        and — under &ldquo;The Story of the NIV Bible&rdquo; — Biblica&rsquo;s
        own account of Howard Long, the mortgaged office building, the
        1975 funding collapse, and Zondervan&rsquo;s rescue. A
        self-interested narrator where it tells its own story, and the
        essay says so where it relies on that telling.
      </>
    ),
  },
  {
    href: "https://www.biblica.com/publisher-ai-policy/",
    kind: "primary",
    label: (
      <>
        <strong>Biblica.</strong> &ldquo;Publisher AI Policy.&rdquo; Any
        AI or machine-learning feature disqualifies an app from the
        express royalty-free license and requires separate written
        permission. The newest fence in the regime, and the one most
        readers have not heard of.
      </>
    ),
  },
  {
    href: "https://en.wikipedia.org/wiki/Zondervan",
    kind: "publisher record",
    label: (
      <>
        <strong>Zondervan (publisher record).</strong> Founded 1931 in
        Grand Rapids by the brothers Peter and Bernard Zondervan, nephews
        of William B. Eerdmans; the NIV New Testament co-published with
        the International Bible Society in 1973, the complete NIV in
        1978; sold to HarperCollins in 1988; the NIV text copyright held
        throughout by Biblica (&copy; 1973, 1978, 1984, 2011), not by any
        publisher.
      </>
    ),
  },
  {
    href: "https://en.wikipedia.org/wiki/Thomas_Nelson_(publisher)",
    kind: "publisher record",
    label: (
      <>
        <strong>Thomas Nelson (publisher record).</strong> Founded 1798
        in Edinburgh; held the American Standard Version copyright from
        1901 to 1928; published the Revised Standard Version under an
        NCC license (publisher histories date the loss of exclusivity to
        1962); acquired by Sam Moore&rsquo;s Royal Publishers in 1969,
        which commissioned the New King James Version (1979&ndash;1982),
        its copyright held by Nelson itself; InterMedia Partners 2006
        ($473 million), Kohlberg &amp; Co. majority stake 2010,
        HarperCollins July 2012.
      </>
    ),
  },
  {
    href: "https://en.wikipedia.org/wiki/News_Corp",
    kind: "publisher record",
    label: (
      <>
        <strong>News Corp (corporate record).</strong> The 2013 split
        that moved publishing — HarperCollins, and with it Zondervan and
        Thomas Nelson — into the new News Corp; FY2025 revenue of $8.45
        billion per its Form 10-K filed August 2025; roughly 22,300
        employees; holdings including Dow Jones and the Wall Street
        Journal, News UK, News Corp Australia, the New York Post, and
        realtor.com&rsquo;s parent REA Group; Lachlan Murdoch as chair
        with about a third of the voting power through the company&rsquo;s
        dual-class share structure. (The Wikipedia article currently
        carries a maintenance banner flagging over-reliance on affiliated
        sources; the load-bearing figures here are the 10-K&rsquo;s.)
      </>
    ),
  },
  {
    href: "https://www.nytimes.com/2024/12/09/business/media/rupert-lachlan-murdoch-family-trust.html",
    kind: "journalism",
    label: (
      <>
        <strong>Mahler, Jonathan, and Jim Rutenberg.</strong> The New
        York Times, December 9, 2024. The reporting on the Nevada probate
        commissioner&rsquo;s finding that Rupert and Lachlan Murdoch had
        acted in bad faith in the application to amend the family trust —
        a commissioner&rsquo;s ruling, subject to district-court review,
        and stated that way in the essay.
      </>
    ),
  },
  {
    href: "https://www.reuters.com/legal/rupert-murdoch-fails-bid-change-family-trust-new-york-times-reports-2024-12-09/",
    kind: "journalism",
    label: (
      <>
        <strong>Reuters (Chmielewski), December 9, 2024.</strong>{" "}
        Independent confirmation of the commissioners-court reporting and
        its limits.
      </>
    ),
  },
  {
    href: "https://en.wikipedia.org/wiki/Succession_of_Rupert_Murdoch",
    kind: "publisher record",
    label: (
      <>
        <strong>Succession of Rupert Murdoch (record).</strong> The
        September 8, 2025 settlement that ended the Nevada litigation:
        Prudence MacLeod, Elisabeth Murdoch, and James Murdoch exited the
        family trust at about $1.1 billion each, a new trust left Lachlan
        Murdoch in sole control of the News Corp and Fox voting shares
        until at least 2050, and all litigation was terminated. The
        commissioner&rsquo;s December 2024 ruling was unsealed on August
        21, 2026.
      </>
    ),
  },
  {
    href: "https://en.wikipedia.org/wiki/King_James_Version#Copyright_status",
    kind: "publisher record",
    label: (
      <>
        <strong>King James Version, &sect;Copyright status.</strong>{" "}
        Public domain in most of the world; in the United Kingdom the
        right to print it is a royal prerogative under letters patent,
        preserved in perpetuity by section 171(b) of the Copyright,
        Designs and Patents Act 1988; the King&rsquo;s Printer for England
        and Wales is Cambridge University Press, by way of Eyre &amp;
        Spottiswoode since 1990; Oxford and Cambridge hold independent
        royal charters; in Scotland the Authorized Version is published
        by Collins under licence from the Scottish Bible Board, which
        holds the Scottish letters patent.
      </>
    ),
  },
  {
    href: "https://www.open.bible/",
    kind: "project",
    label: (
      <>
        <strong>open.bible.</strong> Biblica&rsquo;s own open-licensing
        initiative, releasing some Scripture texts under Creative Commons
        BY-SA. The ministry&rsquo;s answer, from inside the regime, to
        the tension this essay is about.
      </>
    ),
  },
  {
    href: "https://worldenglishbible.org/",
    kind: "project",
    label: (
      <>
        <strong>The World English Bible.</strong> A modern English
        translation deliberately released without copyright, built on the
        public-domain American Standard Version of 1901.
      </>
    ),
  },
  {
    href: "https://www.unfoldingword.org/",
    kind: "project",
    label: (
      <>
        <strong>unfoldingWord.</strong> Open-licensed biblical content
        and translation tools built for church translators worldwide —
        the counter-movement&rsquo;s infrastructure layer.
      </>
    ),
  },
  {
    href: "https://berean.bible/",
    kind: "project",
    label: (
      <>
        <strong>The Berean Standard Bible.</strong> A newer open-licensed
        translation, named — pointedly — for the Bereans of Acts 17:11,
        who checked the message against the text themselves.
      </>
    ),
  },
  {
    href: "https://api.bible/",
    kind: "project",
    label: (
      <>
        <strong>api.bible (American Bible Society)</strong> and{" "}
        <strong>platform.youversion.com.</strong> The express,
        royalty-free licensing channels through which non-commercial apps
        may carry the NIV full text — with the AI carve-out noted above.
      </>
    ),
  },
];

const RELATED: { href: string; name: string; relation: string }[] = [
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
    href: "/word/cases",
    name: "The Cases",
    relation:
      "Translation licensing disputes and source records — the same regime this essay maps, case by case.",
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
      "Bible copyright, NIV licensing, NKJV, Zondervan, Thomas Nelson, HarperCollins, Biblica, News Corp, King James Version Crown copyright, open Bible translation",
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

export default function BibleNobodyOwnsEssayPage() {
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
          {" · No. 1 of an ongoing series"}
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
            src="/evidence/essays/bible-nobody-owns/hero.jpg"
            alt="An open antique Bible on a wooden table, a modern glass office tower behind it at dusk"
            width={1920}
            height={1280}
            priority
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </figure>

        <AuthorStatement />

        <div style={{ marginTop: "1rem" }}>
          <Paragraph>
            Picture a Sunday morning pew anywhere in the English-speaking
            world. The reading starts, and the words coming over the lectern
            are almost certainly the New International Version or the New
            King James. Feel free to follow along on your phone — the app is
            probably pulling from the same text. Quote it later on a
            poster, in a sermon manuscript, in a song, and you step inside
            a permissions regime with fixed numbers and a mailing address.
            The commercial pipeline for both of those translations runs
            through HarperCollins Christian Publishing in Nashville, and
            HarperCollins is a subsidiary of News Corp. The book that says
            &ldquo;freely ye have received, freely give&rdquo; (Matthew
            10:8, quoted here from the public-domain King James text, which
            turns out to matter) is, in the renderings most modern
            Christians actually read, a licensed revenue asset.
          </Paragraph>

          <Paragraph>
            None of this is new, which is part of the point. The 1611 King
            James Bible was born into a print monopoly — Robert Barker held
            the office of King&rsquo;s Printer and with it the exclusive
            patent to print the new translation, printed it so carelessly
            that one 1631 edition left the &ldquo;not&rdquo; out of the
            seventh commandment (the &ldquo;Wicked Bible,&rdquo; and the
            Crown fined the printers for it), and rival patent-holders
            spent decades suing each other over who was allowed to sell
            Scripture. Licensing wars over the Bible are four centuries
            old. What has changed is not whether someone holds the patent.
            What has changed is who holds it, how much they hold, and what
            kind of company is doing the holding.
          </Paragraph>

          <Paragraph>
            This essay is about that holding. It follows one question —
            who owns the modern English Bible&rsquo;s commercial pipelines,
            and under what rules — from a Seattle living room in 1955 to a
            Nashville post-office box to a Nevada probate courtroom in
            2024. It is not a conspiracy story. The people in it mostly did
            defensible things, some of them beautiful things. That is
            exactly why the ending is uncomfortable. (If you want the same
            method applied to belief rather than publishing, the local
            atlas — <AtlasLink href="/evidence/frameworks">The Afterlife
            Atlas</AtlasLink> — reads fifty-four traditions with the same
            source-first discipline this piece tries to apply to a
            licensing regime.)
          </Paragraph>

          <SectionHeading>The one law that decides everything</SectionHeading>

          <Paragraph>
            Start with the legal mechanism, because everything else hangs
            on it. Copyright protects new expression, not ancient content.
            The Hebrew and Greek source texts of Scripture are old beyond
            any term of protection — they are, in the legal phrase, in the
            public domain, meaning no one owns them and everyone may use
            them. But a fresh English rendering of those texts is new
            expression, and new expression can be owned. Nobody can
            copyright the Bible. Everybody who pays for a new translation
            of it owns something.
          </Paragraph>

          <Paragraph>
            Sit with the asymmetry for a moment, because it explains the
            next seventy years of publishing history. The freest text on
            earth — free as in ancient, free as in addressed to everyone,
            free as in no one can fence the original — generates, with
            every generation, a new ownable artifact. A publisher who
            bankrolls a translation owns the result. A publisher who owns
            the result controls who may print it, quote it at length, set
            it to music, put it on a mug, or ship it inside an app. The
            incentive structure this creates is not a bug in the system. It
            is the system, doing exactly what intellectual-property law is
            designed to do: pay for the production of new work by making
            the new work property.
          </Paragraph>

          <Paragraph>
            Which means the question is never <em>whether</em> the English
            Bible will have owners. It always will, as long as it keeps
            being translated. The question is who the owners are, what they
            charge at the gate, and what they do with the proceeds.
          </Paragraph>

          <SectionHeading>A Seattle engineer and a mortgaged building</SectionHeading>

          <Paragraph>
            The NIV — in Biblica&rsquo;s words, still the most-used Bible
            translation in American churches — begins
            with a layman failing to share his faith. Biblica, the ministry
            that now holds the translation&rsquo;s copyright, tells the
            story this way on its own permissions page, and the essay
            follows its telling, flagged as the interested account it is.
            Howard Long was an engineer in Seattle, and in 1955 he found
            that the King James Version he had grown up on was falling flat
            with the people he was trying to reach — the Elizabethan
            English was a wall, not a door. He spent ten years pressing
            first the Christian Reformed Church and then the National
            Association of Evangelicals to back a translation in the
            language people actually spoke.
          </Paragraph>

          <Paragraph>
            In 1965 the effort became the Committee on Bible Translation
            — a cross-denominational body of scholars, and this detail
            matters for later — constituted as independent and
            self-governing. Changes to the text require a 70 percent vote
            of the committee. No publisher, and not even Biblica itself,
            controls the words. The committee still meets annually. It is
            answering the revisions to this day.
          </Paragraph>

          <Paragraph>
            Then the money ran out, and the story turns. The New York Bible
            Society — the organization later renamed the International
            Bible Society and eventually Biblica — came aboard in 1968 as
            the project&rsquo;s financial backer, and it backed the
            translation the way ministries occasionally do when they
            believe in something: it mortgaged its own office building. By
            1975 the funds were gone anyway, the translation unfinished.
            Zondervan, a commercial publisher in Grand Rapids, stepped in
            and carried the project to completion — the New Testament had
            appeared in 1973, the full NIV in 1978, and Biblica relates
            that the first printing sold out before the run was even
            finished. Read the sentence the way it deserves to be read: a
            ministry traded the commercial pipeline to survive the
            translation. The whole tension of this essay lives in that
            trade, and it was made, once, with a mortgage and an empty
            account.
          </Paragraph>

          <SectionHeading>The consolidation chain</SectionHeading>

          <Paragraph>
            Zondervan was founded in 1931 by two brothers, Peter and
            Bernard Zondervan — nephews of the publisher William B.
            Eerdmans — and grew for five decades as a family firm in the
            Dutch Reformed publishing belt of western Michigan. The NIV
            made it enormous. In 1988, the family sold it outright to
            HarperCollins, the publishing arm of Rupert Murdoch&rsquo;s
            News Corporation. Straight out of family ownership, into the
            structure of a global media conglomerate, in one transaction.
          </Paragraph>

          <Paragraph>
            Thomas Nelson took the longer road to the same destination, and
            the road itself is instructive. Nelson was founded in Edinburgh
            in 1798 — it is older than the modern publishing industry. It
            held the copyright on the American Standard Version from 1901
            to 1928, then published the Revised Standard Version under
            license from the National Council of Churches. When the
            Council opened that license to other publishers — publisher
            histories date the loss of exclusivity to 1962 — the revenue
            advantage went with it. When Sam Moore&rsquo;s Royal
            Publishers bought Nelson in 1969, the new owners commissioned
            their own translation: the New King James Version, published
            1979 to 1982, its copyright held by Thomas Nelson itself. A
            publisher that rents a text and a publisher that owns one are
            in different businesses; Nelson ended up in the second.
          </Paragraph>

          <Paragraph>
            Then came the private-equity years: InterMedia Partners bought
            Nelson in 2006 for a reported $473 million; Kohlberg &amp; Co.
            took a majority stake in 2010; and in July 2012 HarperCollins —
            News Corp — closed its acquisition. By that summer, the
            NIV&rsquo;s and the NKJV&rsquo;s commercial pipelines answered
            to the same corporate roof. They had arrived by different routes —
            Zondervan sold straight out of the family, Nelson flipped
            through two rounds of equity — but the door was the same.
          </Paragraph>

          <Paragraph>
            Two nuances keep this honest, and both matter. First: the NIV
            text copyright — &copy; 1973, 1978, 1984, 2011 — sits with
            Biblica, a nonprofit ministry, not with News Corp. What the
            conglomerate owns is the commercial distribution and licensing
            channel: the truck, not the cargo. The NKJV is the opposite
            architecture — the cargo itself is publisher-owned. Two
            different structures of control, one corporate roof. Second:
            HarperCollins Christian Publishing also owns BibleGateway.com,
            the dominant free Bible-reading website. The same corporate
            family holds the NIV and NKJV commercial pipelines and the
            front door through which most of the world reads them for
            free. Whatever one makes of that, it is a fact about
            concentration that deserves to be stated plainly rather than
            discovered by accident.
          </Paragraph>

          <SectionHeading>The tollbooth, itemized</SectionHeading>

          <Paragraph>
            What does the licensing regime actually say? Biblica&rsquo;s
            permissions page — re-read the day this essay was drafted —
            lays it out with unusual clarity, and the essay quotes its
            terms rather than paraphrasing them loosely. You may quote the
            NIV without written permission provided the quotation runs to
            no more than 500 verses, does not amount to a complete book of
            the Bible, stays under 25 percent of the total work it appears
            in, and carries the copyright acknowledgment. Breach any one of
            those conditions and you are directed to a Permission Request
            Form. On social media the limits are counted against the
            platform as a whole, not per post — a detail worth pausing on,
            because it means a verse-cap on an entire social network&rsquo;s
            NIV usage, in principle, before anyone posts anything. Song
            lyrics always require permission, must reproduce the text
            verbatim, and may not paraphrase. A verse on merchandise
            generally needs permission too. Full-text licenses go only to
            registered legal entities — never to individuals.
          </Paragraph>

          <Paragraph>
            And where does the money line run? For commercial print
            licensing of the NIV in the United States and Canada,
            Biblica&rsquo;s own page routes the request to HarperCollins
            Christian Publishing, Permissions Department, P.O. Box 141000,
            Nashville, Tennessee 37214. A publishing industry that began
            with a mortgaged ministry building now terminates, for North
            American rights purposes, in a Nashville post-office box.
            Britain, Europe, and EFTA route to Hodder &amp; Stoughton, a
            Hachette imprint; the rest of the world routes to Biblica
            directly.
          </Paragraph>

          <Paragraph>
            There is a generous lane, and it deserves equal billing.
            Non-commercial apps can carry the full NIV under an express,
            royalty-free license through the American Bible Society&rsquo;s{" "}
            <ExternalLink href="https://api.bible/">api.bible</ExternalLink>{" "}
            or{" "}
            <ExternalLink href="https://platform.youversion.com/">
              YouVersion&rsquo;s platform
            </ExternalLink>
            . But — and this is the newest fence in the entire regime — any
            AI or machine-learning feature disqualifies an app from that
            express channel and requires a separate license under{" "}
            <ExternalLink href="https://www.biblica.com/publisher-ai-policy/">
              Biblica&rsquo;s Publisher AI Policy
            </ExternalLink>
            . In 2026, the terms under which a machine may read Scripture
            on your behalf are a licensing question. Whatever one&rsquo;s
            view of AI, the precedent is worth noticing before it is
            invisible.
          </Paragraph>

          <SectionHeading>Who sits at the top</SectionHeading>

          <Paragraph>
            HarperCollins&rsquo;s parent is News Corp — the company formed
            in June 2013 when the old News Corporation split in the
            aftermath of the phone-hacking scandal, sending entertainment
            to 21st Century Fox (most of it since sold to Disney in 2019)
            and publishing to the new News Corp. HarperCollins went with
            publishing. The Bibles went with HarperCollins. The modern News
            Corp reports FY2025 revenue of $8.45 billion in its Form 10-K,
            employs roughly 22,300 people, and holds Dow Jones and the Wall
            Street Journal, News UK (the Sun and the Times), News Corp
            Australia, the New York Post, realtor.com&rsquo;s parent REA
            Group — and, in a Nashville office park, the commercial
            pipelines of the NIV and the NKJV and BibleGateway.com.
          </Paragraph>

          <Paragraph>
            The company&rsquo;s chair is Lachlan Murdoch, who holds about a
            third of its voting power — roughly 33 percent — through a
            dual-class share structure, an arrangement in which some shares
            carry more votes than others so that founding families can
            keep control of companies whose stock is mostly owned by the
            public. Rupert Murdoch retired to chairman emeritus in November
            2023. And then the succession became a court case: in
            September 2024 Rupert applied to a Nevada probate court to
            amend the family trust — stripping voting rights from three of
            his children to lock control under Lachlan — and on December 9,
            2024,{" "}
            <ExternalLink href="https://www.nytimes.com/2024/12/09/business/media/rupert-lachlan-murdoch-family-trust.html">
              as the New York Times reported
            </ExternalLink>
            , the probate commissioner assigned to the case found that
            Rupert and Lachlan had acted in bad faith. Precision matters
            here: that was a commissioner&rsquo;s finding, a recommendation
            ruling subject to district-court review, not a final judgment.
            The litigation has since ended. On September 8, 2025, the
            family settled: Prudence MacLeod, Elisabeth Murdoch, and James
            Murdoch surrendered their trust interests at about $1.1
            billion each, all Nevada litigation was terminated, and a new
            trust left Lachlan in sole control of the voting shares until
            at least 2050; the commissioner&rsquo;s ruling itself was
            unsealed on August 21, 2026. So the sentence needs no
            exaggeration and no courtroom present tense: control of the
            bestselling English Bible&rsquo;s commercial pipeline sits,
            settled and uncontested, with Lachlan Murdoch&rsquo;s trust.
          </Paragraph>

          <Paragraph>
            One more turn of the screw, because it is too strange to leave
            out. The one Bible everyone calls free — the King James Version
            — is public domain nearly everywhere on earth except the
            country that made it. In the United Kingdom, the right to
            print the Authorized Version is a royal prerogative under
            letters patent — Crown-granted monopolies, older than copyright
            law itself — preserved in perpetuity by section 171(b) of the
            Copyright, Designs and Patents Act 1988: a copyright that never
            expires. The King&rsquo;s Printer for England and Wales is
            Cambridge University Press, an office it has held through Eyre
            &amp; Spottiswoode since 1990, and Oxford and Cambridge hold
            their own independent royal charters. And in Scotland, the
            Authorized Version is published by Collins under licence from
            the Scottish Bible Board — the board holds the Scottish letters
            patent, and Collins is its licensed printer. Collins is the
            same William Collins that merged into HarperCollins in 1989 and
            so now sits inside News Corp. Follow the sentence until it
            lands: in Scotland, the Crown&rsquo;s licensed printer of the
            supposedly copyright-free Bible is a News Corp subsidiary. The
            free Bible is free in America and owned by the King at home,
            and the King&rsquo;s Scottish printer works, corporately
            speaking, for the Murdochs.
          </Paragraph>

          <SectionHeading>The honest dispute</SectionHeading>

          <Paragraph>
            Before the thesis, the strongest version of the defense — and
            it is strong. First: translations cost real millions, and
            someone has to pay. A rigorous, committee-based rendering from
            the original languages, revised continuously for decades, is an
            enormous ongoing expense, and the NIV&rsquo;s own origin proves
            the model&rsquo;s necessity — Biblica mortgaged its office
            building and still ran dry in 1975; only Zondervan&rsquo;s
            commercial capital finished the project. Without a licensable
            asset, there is quite possibly no NIV at all. Second: copyright
            funds stewardship. A controlled text means funded scholar
            committees, no corrupted copies, and money for translation work
            in other languages — Biblica frames its licensing as faithfully
            stewarding the texts entrusted to it, and the same stewardship
            argument has been made for Oxford and Cambridge&rsquo;s care of
            the King James text for three centuries. It is a real service,
            not a racket.
          </Paragraph>

          <Paragraph>
            Third: the nonprofit-publisher split is genuine. The NIV text
            belongs to Biblica, a ministry; the Committee on Bible
            Translation is independent and self-governing; changes need a
            70 percent scholar vote; no publisher — not even Biblica —
            controls the words. What HarperCollins owns is the truck, not
            the cargo. Fourth: judged against ordinary trade publishing,
            the permissions regime is generous. Five hundred verses, no
            whole book, under a quarter of the work, no permission needed —
            that is far looser than any standard publisher&rsquo;s fair-use
            posture, and the express royalty-free channel puts the full
            text into free apps used worldwide. Most of what ordinary
            believers do with the NIV costs nothing and asks nothing of
            anyone. And fifth, the deepest point: every era of the English
            Bible has had an owner of the pipeline. The King&rsquo;s
            Printer in 1611. The Oxford and Cambridge charters. The
            Crown&rsquo;s perpetual prerogative. HarperCollins is the
            ordinary state of things, not a scandalous exception.
          </Paragraph>

          <Paragraph>
            All of that is true, and the essay grants it without
            reservation. But generosity within a licensed regime does not
            change what the regime is. A tollgate is a tollgate even when
            it is politely staffed, even when the toll funds something
            good, even when most travelers are waved through. The question
            the freest text on earth puts to its tollgate is not whether
            the toll is reasonable. It is whether the tollgate should be
            there at all — and who, at the end of the chain, the toll
            belongs to. Right now the answer to that second question is a
            family trust whose control was fought over in a Nevada probate
            court — and settled, in Lachlan Murdoch&rsquo;s favor, in
            September 2025.
          </Paragraph>

          <SectionHeading>The thesis</SectionHeading>

          <ThesisBlock />

          <SectionHeading>What the record leaves open</SectionHeading>

          <Paragraph>
            The sources assembled above settle the facts; they do not
            settle the reading. At least three honest interpretations
            remain on the table, and the essay refuses to collapse them
            prematurely.
          </Paragraph>

          <ReadingsFrame />

          <Paragraph>
            Reading one — capture. A secular media empire monetizing the
            sacred, full stop: the Nashville post-office box, the social
            limits counted against a whole platform, the AI gate, the Crown
            prerogative routed through licensed commercial presses. Reading
            two — symbiosis. The structure is the only proven way a
            ten-million-dollar translation survives at scale, and Zondervan
            rescued the NIV exactly when the nonprofit ran dry; the
            pipeline is capture and rescue in a single transaction. Reading
            three — the system working as designed. Copyright did what it
            was built to do — fund new expression — and the open-licensing
            counter-movement described below is the same system run in
            reverse.
          </Paragraph>

          <Paragraph>
            The data underdetermine motive, and good evidence work says so
            rather than pretending otherwise. What the record does settle
            is structure: where the rights sit, what the rules say, who
            signs the licenses, and where the money line runs.
          </Paragraph>

          <SectionHeading>Where this essay lands</SectionHeading>

          <Paragraph>
            The author&rsquo;s lean, stated as a lean: the tension Matthew
            10:8 creates is real, and it deserves to be sat with rather
            than resolved. The sharpest complaint is not commerce — people
            who translate, print, warehouse, and ship Bibles are doing real
            work and may honorably be paid for it. The sharpest complaint
            is concentration: that a single secular family trust, its
            control settled after a Nevada probate fight, is the capstone
            of the distribution of the bestselling sacred text in human
            history, and that the arrangement is so normal it took a
            permissions page and a probate filing to notice it.
          </Paragraph>

          <Paragraph>
            What the data do not settle is equally worth saying. Whether
            licensing revenue has net-funded more Scripture access than it
            has restricted — Biblica&rsquo;s ministry case is plausible, and
            it is unfalsifiable from public numbers. Whether an open
            translation can match NIV-level polish without a revenue engine
            behind it — the open question the counter-movement has to
            answer in the work, not in argument.
          </Paragraph>

          <Paragraph>
            Because there is a counter-movement, and it is the redemption
            arc of the piece. Biblica itself now releases some texts under
            a Creative Commons BY-SA license at{" "}
            <ExternalLink href="https://www.open.bible/">open.bible</ExternalLink>
            . The{" "}
            <ExternalLink href="https://worldenglishbible.org/">
              World English Bible
            </ExternalLink>{" "}
            is a modern rendering deliberately released without copyright;
            the American Standard Version of 1901 is public domain
            outright;{" "}
            <ExternalLink href="https://www.unfoldingword.org/">
              unfoldingWord
            </ExternalLink>{" "}
            builds open translation infrastructure for the world&rsquo;s
            church translators; the{" "}
            <ExternalLink href="https://berean.bible/">
              Berean Standard Bible
            </ExternalLink>{" "}
            ships open by design. Believers felt the same tension this
            essay has been describing — the sense that the freest text on
            earth should not terminate in a Nashville post-office box — and
            instead of writing manifestos about it, they built the exit.
          </Paragraph>

          <SectionHeading>A word in closing</SectionHeading>

          <Paragraph>
            The faith posture of this piece was disclosed at the top and
            has been kept descriptive through the body; it belongs, named,
            at the close. The author holds the Bible to be the Word of God.
            Nothing in this essay&rsquo;s argument depends on the reader
            sharing that conviction — the licensing record is the licensing
            record either way — but the conviction sharpens the ending.
            The church&rsquo;s instinct about Scripture has always been
            that it is not for sale: &ldquo;every one that thirsteth, come
            ye to the waters, and he that hath no money; come ye, buy, and
            eat&rdquo; (Isaiah 55:1), and Jesus&rsquo; own instruction to
            the disciples he sent out with the message, &ldquo;freely ye
            have received, freely give.&rdquo; The essay does not claim
            those verses settle publishing economics; they were not written
            as trade policy. It claims only that the alignment is real and
            that the tradition has noticed the tension before.
          </Paragraph>

          <Paragraph>
            The correct register, then, is not outrage. It is grief plus
            hope. Grief, because the freest text on earth arrives in the
            modern reader&rsquo;s hands through a tollbooth owned, at the
            top, by a family trust whose succession was just fought over in
            probate court — and because almost no one in the pews knows it.
            Hope, because the institutions inside the story mostly did real
            things well — a committee that guards the text against
            publishers, a ministry that mortgaged its building for the
            translation it believed in — and because the freest Bible on
            earth is being rebuilt in the open, deliberately, by people who
            love it. The Word was never the thing anyone owned. The words
            are being set free again, one open license at a time.
          </Paragraph>
        </div>

        <section
          aria-label="Continue exploring"
          style={{ margin: "4.5rem 0 0", borderTop: "1px solid var(--line)", paddingTop: "2.5rem" }}
        >
          <h2 className="hw-kicker" style={{ margin: 0 }}>
            Continue exploring
          </h2>
          <p
            style={{
              margin: "0.75rem 0 0",
              maxWidth: "44rem",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              color: "var(--muted)",
            }}
          >
            This essay sits inside the site&rsquo;s How We Know world. The
            nearest neighbors:
          </p>
          <ul
            style={{
              listStyle: "none",
              margin: "1.25rem 0 0",
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {RELATED.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  style={{
                    display: "block",
                    height: "100%",
                    border: "1px solid var(--line)",
                    borderRadius: "10px",
                    background: "var(--surface)",
                    padding: "1rem 1.1rem",
                    textDecoration: "none",
                    color: "var(--ink)",
                  }}
                >
                  <span
                    style={{ display: "block", fontSize: "1rem", fontWeight: 600 }}
                  >
                    {entry.name}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: "0.35rem",
                      fontSize: "0.84rem",
                      lineHeight: 1.55,
                      color: "var(--muted)",
                    }}
                  >
                    {entry.relation}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Method and disclosure"
          style={{
            margin: "3.5rem 0 0",
            maxWidth: "44rem",
            border: "1px solid var(--line)",
            borderRadius: "10px",
            background: "var(--surface)",
            padding: "1.25rem 1.5rem",
          }}
        >
          <h2 className="hw-kicker" style={{ margin: 0 }}>
            Method &amp; disclosure
          </h2>
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              color: "var(--ink)",
            }}
          >
            {disclosure}
          </p>
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "0.9rem",
              lineHeight: 1.7,
              color: "var(--muted)",
            }}
          >
            {NOT_COVERED}
          </p>
          <p
            style={{
              margin: "0.75rem 0 0",
              fontSize: "0.8rem",
              lineHeight: 1.6,
              color: "var(--muted)",
            }}
          >
            Underlined links leave this site for outside sources.
          </p>
        </section>

        <footer
          style={{ margin: "3rem 0 0", borderTop: "1px solid var(--line)", paddingTop: "2.5rem" }}
        >
          <h2 className="hw-kicker" style={{ margin: 0 }}>
            Sources
          </h2>
          <ul
            style={{
              listStyle: "none",
              margin: "1.25rem 0 0",
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
