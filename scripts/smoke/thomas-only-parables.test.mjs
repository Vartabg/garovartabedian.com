import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateThomasParables } from "../../src/lib/jesus/thomas-parables-data.mjs";

const data = JSON.parse(await readFile(new URL("../../public/jesus/thomas-parables.json", import.meta.url), "utf8"));

test("the Thomas-only list fails closed for missing, duplicate, or malformed stories", () => {
  assert.deepEqual(validateThomasParables(data), data);
  const [field, jar, assassin] = data;
  for (const bad of [null, {}, [field, assassin], [field, field, assassin],
    [field, { ...jar, saying: 98 }, assassin], [field, { ...jar, title: "" }, assassin],
    [{ ...field, note: "related sayings" }, jar, assassin]]) {
    assert.throws(() => validateThomasParables(bad), /Thomas/);
  }
});
