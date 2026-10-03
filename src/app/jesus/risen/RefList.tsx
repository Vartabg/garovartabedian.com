import Link from "next/link";
import { refLink } from "./refs";

/** Every claim in this room carries its passages, linked into the reader. */
export default function RefList({
  refs,
  label,
}: {
  refs: { ref: string }[];
  label: string;
}) {
  const links = refs.map((entry) => ({ raw: entry.ref, link: refLink(entry.ref) }));

  return (
    <ul className="jsu-risen-refs" aria-label={label}>
      {links.map(({ raw, link }) => (
        <li key={raw}>
          {link ? (
            <Link href={link.href} className="textlink">
              {link.label}
            </Link>
          ) : (
            <span>{raw}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
