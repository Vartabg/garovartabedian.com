import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LensRoom from "../src/app/jesus/lens/LensRoom";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

test("world perspectives lead the traditions room while art stays optional", () => {
  const markup = renderToStaticMarkup(
    <LensRoom
      perspectives={[
        {
          id: "test-perspective",
          group: "Faiths and communities",
          name: "A test community",
          answer: "A distinct answer",
          summary: "A sourced explanation of this community's view.",
          boundary: "This view is not historical evidence by itself.",
          sources: [{ label: "Primary source", url: "https://example.com/source" }],
        },
      ]}
      entries={[]}
      art={[
        {
          id: "test-art",
          title: "Test work",
          culture: "Test culture",
          date: "1900",
          medium: "Paint",
          artist: "Unknown",
          museum: "Test museum",
          objectUrl: "https://example.com/object",
          imageUrl: "/art/test-art.jpg",
          sourceImageUrl: "https://example.com/object/image.jpg",
          license: "Public domain",
        },
      ]}
    />,
  );

  assert.match(markup, /Who is Jesus to the world\?/);
  assert.match(markup, /Faiths and communities/);
  assert.match(markup, /A distinct answer/);
  assert.match(markup, /What this can—and cannot—tell us/);
  assert.match(markup, /href="https:\/\/example\.com\/source"/);

  const perspectiveIndex = markup.indexOf("A distinct answer");
  const textShelfIndex = markup.indexOf(">Texts and traditions</h2>");
  const artIndex = markup.indexOf("<strong>World art archive</strong>");
  assert.ok(perspectiveIndex >= 0 && perspectiveIndex < textShelfIndex);
  assert.ok(textShelfIndex >= 0 && textShelfIndex < artIndex);
  assert.match(markup, /<details[^>]*class="jsu-art-archive"/);
  assert.doesNotMatch(markup, /<details[^>]*class="jsu-art-archive"[^>]*open/);
});
