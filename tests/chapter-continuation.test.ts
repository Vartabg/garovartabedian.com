import assert from "node:assert/strict";
import test from "node:test";
import { chapterContinuation } from "../src/lib/scriptures/chapter-continuation";

test("a chapter continues into the one world that already takes it up", () => {
  assert.deepEqual(chapterContinuation("GEN", 6), {
    href: "/scriptures/stories/noah",
    label: "Noah",
    where: "A told story",
  });
  assert.equal(chapterContinuation("JHN", 21)?.href, "/apostles/stories/come-and-eat");
  assert.equal(chapterContinuation("LUK", 10)?.href, "/jesus/parables#parable-good-samaritan");
  assert.equal(chapterContinuation("MAT", 7)?.label, "The two builders");
  assert.equal(chapterContinuation("ISA", 53)?.href, "/scriptures/read/isaiah-53-clement-16");
  assert.equal(chapterContinuation("ISA", 1)?.where, "An early writing");
  assert.equal(chapterContinuation("LEV", 11)?.href, "/early/barnabas#s9");
  assert.equal(chapterContinuation("SNG", 1), null);
});
