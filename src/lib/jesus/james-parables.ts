import data from "../../../public/jesus/james-parables.json";

/** Coptic page-and-line locators identify passages; paragraph anchors follow the hosted translation. */
export type JamesParable = { id: string; title: string; kind?: string; locator: string; section: string; paragraph: number; endParagraph?: number; sha256: string; related?: string; note?: string };
export const JAMES_PARABLES: JamesParable[] = data;
export const jamesHref = (story: JamesParable) => `/early/library/secret-book-james/${story.section}#p${story.paragraph}`;
