import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  DataFileError,
  readServerJson,
  readServerJsonObject,
} from "../src/lib/server-json";

const withTempRoot = async (run: (root: string) => Promise<void>) => {
  const root = mkdtempSync(path.join(tmpdir(), "garovartabedian-json-"));
  try {
    await run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

test("optional server JSON maps ENOENT alone to undefined", async () => {
  await withTempRoot(async (root) => {
    const result = await readServerJson(root, ["optional.json"], {
      required: false,
      label: "optional fixture",
    });
    assert.equal(result, undefined);
  });
});

test("parsed falsy JSON values remain distinct from a missing optional file", async () => {
  await withTempRoot(async (root) => {
    const fixtures = [
      ["null.json", "null", null],
      ["false.json", "false", false],
      ["zero.json", "0", 0],
      ["empty-string.json", '""', ""],
    ] as const;

    for (const [filename, raw, expected] of fixtures) {
      writeFileSync(path.join(root, filename), raw, "utf8");
      const result = await readServerJson(root, [filename], {
        required: false,
        label: filename,
      });
      assert.equal(result, expected);
    }
  });
});

test("optional object artifacts reject parsed falsy JSON as contract failures", async () => {
  await withTempRoot(async (root) => {
    for (const [filename, raw] of [
      ["null.json", "null"],
      ["false.json", "false"],
      ["zero.json", "0"],
      ["empty-string.json", '""'],
    ] as const) {
      writeFileSync(path.join(root, filename), raw, "utf8");
      await assert.rejects(
        readServerJsonObject(root, [filename], {
          required: false,
          label: filename,
        }),
        (error: unknown) => {
          assert.ok(error instanceof DataFileError);
          assert.equal(error.code, "DATA_FILE_CONTRACT");
          assert.match(error.message, /JSON root must be an object/);
          assert.match(error.message, new RegExp(filename.replace(".", "\\.")));
          return true;
        },
      );
    }
  });
});

test("required server JSON reports a declared file that is missing", async () => {
  await withTempRoot(async (root) => {
    await assert.rejects(
      readServerJson(root, ["required.json"], {
        required: true,
        label: "required fixture",
        repair: "npm run data:fixture",
      }),
      (error: unknown) => {
        assert.ok(error instanceof DataFileError);
        assert.equal(error.code, "DATA_FILE_MISSING");
        assert.match(error.message, /required\.json/);
        assert.match(error.message, /npm run data:fixture/);
        return true;
      },
    );
  });
});

test("malformed server JSON throws with its contextual path even when optional", async () => {
  await withTempRoot(async (root) => {
    writeFileSync(path.join(root, "broken.json"), '{"not":"closed"', "utf8");

    await assert.rejects(
      readServerJson(root, ["broken.json"], {
        required: false,
        label: "optional broken fixture",
      }),
      (error: unknown) => {
        assert.ok(error instanceof DataFileError);
        assert.equal(error.code, "DATA_FILE_INVALID_JSON");
        assert.match(error.message, /broken\.json/);
        assert.match(error.message, /malformed JSON/);
        return true;
      },
    );
  });
});

test("an unreadable JSON path is not treated as missing", async () => {
  await withTempRoot(async (root) => {
    mkdirSync(path.join(root, "directory.json"));

    await assert.rejects(
      readServerJson(root, ["directory.json"], {
        required: false,
        label: "unreadable fixture",
      }),
      (error: unknown) => {
        assert.ok(error instanceof DataFileError);
        assert.equal(error.code, "DATA_FILE_UNREADABLE");
        assert.match(error.message, /directory\.json/);
        return true;
      },
    );
  });
});

test("server JSON rejects paths outside the declared data root", async () => {
  await withTempRoot(async (root) => {
    await assert.rejects(
      readServerJson(root, ["..", "escape.json"], {
        required: false,
        label: "unsafe fixture",
      }),
      (error: unknown) => {
        assert.ok(error instanceof DataFileError);
        assert.equal(error.code, "DATA_FILE_PATH");
        return true;
      },
    );
  });
});
