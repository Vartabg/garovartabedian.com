import fs from "node:fs";
import path from "node:path";
import { getFindStore } from "../../src/lib/find-server/store";
import { workOne } from "../../src/lib/find-server/worker";

async function main() {
  const command = process.argv[2];
  const store = getFindStore();
  try {
    if (command === "migrate") {
      await store.sql.unsafe(
        fs.readFileSync(path.resolve("src/lib/find-server/schema.sql"), "utf8"),
      );
      console.log(
        "Find schema ready. Assessments remain disabled until explicitly enabled.",
      );
    } else if (command === "enable" || command === "disable") {
      await store.sql`UPDATE find_control SET enabled=${command === "enable"} WHERE id=1`;
      console.log(`Find database dispatch ${command}d.`);
    } else if (command === "status") {
      console.log(
        JSON.stringify(
          {
            control: await store.sql`SELECT enabled FROM find_control`,
            jobs: await store.sql`SELECT state,count(*) FROM find_items GROUP BY state`,
            usage:
              await store.sql`SELECT bucket,jobs,nanos FROM find_usage WHERE bucket LIKE 'cost-%' OR bucket LIKE 'site:%' ORDER BY bucket`,
          },
          null,
          2,
        ),
      );
    } else if (
      command === "work" &&
      /^[a-f0-9-]{36}$/.test(process.argv[3] ?? "")
    ) {
      if (!process.env.TYPESAFE_API_KEY)
        throw new Error(
          "Configure the provider key before running a live worker.",
        );
      await workOne(store, process.argv[3], {
        key: process.env.TYPESAFE_API_KEY,
      });
      console.log("One worker attempt completed.");
    } else
      throw new Error(
        "Usage: research:find:server -- migrate|enable|disable|status|work <job-id>",
      );
  } finally {
    await store.sql.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
