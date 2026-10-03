import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "find-postgres-test-"));
  const bindir =
    process.env.PG_BINDIR ||
    spawnSync("pg_config", ["--bindir"], { encoding: "utf8" }).stdout?.trim();
  if (!bindir)
    throw new Error(
      "Postgres test runtime missing. Set PG_BINDIR to its bin directory.",
    );
  const run = (name: string, args: string[]) => {
    const result = spawnSync(path.join(bindir, name), args, {
      encoding: "utf8",
    });
    if (result.status !== 0)
      throw new Error(`${name} failed: ${result.stderr}`);
  };
  const socket = net.createServer();
  await new Promise<void>((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = (socket.address() as net.AddressInfo).port;
  await new Promise<void>((resolve) => socket.close(() => resolve()));
  let started = false;
  try {
    run("initdb", [
      "-D",
      path.join(root, "data"),
      "--auth-local=trust",
      "--auth-host=trust",
      "--no-locale",
      "-E",
      "UTF8",
    ]);
    run("pg_ctl", [
      "-D",
      path.join(root, "data"),
      "-l",
      path.join(root, "postgres.log"),
      "-o",
      `-h 127.0.0.1 -p ${port} -k ${root} -F`,
      "-w",
      "start",
    ]);
    started = true;
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "--test", "tests/find-server.integration.ts"],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          FIND_TEST_DATABASE_URL: `postgresql://${os.userInfo().username}@127.0.0.1:${port}/postgres`,
        },
      },
    );
    process.exitCode = result.status ?? 1;
  } finally {
    if (started)
      run("pg_ctl", [
        "-D",
        path.join(root, "data"),
        "-m",
        "immediate",
        "-w",
        "stop",
      ]);
    fs.rmSync(root, { recursive: true, force: true });
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
