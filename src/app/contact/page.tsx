import type { Metadata } from "next";
import Link from "next/link";
import { ButtonAnchor, ButtonLink } from "@/app/_components/Button";
import CleanChrome from "../_components/CleanChrome";
import {
  ACTION_LABELS,
  CONTACT_METHOD_BY_ID,
  CONTACT_METHODS,
  PROFILE,
} from "@/lib/portfolio-content";

const inquiryHref = `${CONTACT_METHOD_BY_ID.email.href}?subject=${encodeURIComponent(
  "Project inquiry",
)}`;

const description =
  "Tell Garo Vartabedian about a workflow, integration, or technical project that needs a practical path forward.";

export const metadata: Metadata = {
  title: "Discuss a project",
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Discuss a project — Garo Vartabedian",
    description,
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discuss a project — Garo Vartabedian",
    description,
  },
};

export default function Contact() {
  return (
    <CleanChrome activeHref="/contact">
      <p className="kicker">Contact</p>
      <h1>Tell me what is slowing the team down.</h1>
      <p className="lede">
        Best fit: a recurring customer or operations workflow spread across too
        many tools, manual handoffs, or copy-and-paste steps. Send me the
        current process, who touches it, and where it gets stuck.
      </p>
      <p className="cta-row">
        <ButtonAnchor variant="primary" href={inquiryHref}>
          {ACTION_LABELS.discussProject}
        </ButtonAnchor>
        <ButtonLink variant="ghost" href="/services">
          View services
        </ButtonLink>
        <ButtonLink variant="ghost" href="/work">
          Inspect the work
        </ButtonLink>
      </p>

      <h2>Other ways to reach me</h2>
      <ul className="contact-list">
        {CONTACT_METHODS.map((method) => (
          <li key={method.id}>
            <span className="label">{method.label}</span>
            <a
              className="value textlink"
              href={method.href}
              target={method.external ? "_blank" : undefined}
              rel={method.external ? "noopener noreferrer" : undefined}
            >
              {method.display}
            </a>
          </li>
        ))}
      </ul>

      <p className="note">
        Considering me for a full-time role?{" "}
        <Link href={PROFILE.links.hire}>{ACTION_LABELS.employmentProfile}</Link>.
      </p>
    </CleanChrome>
  );
}
