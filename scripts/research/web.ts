import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ROOT } from "./storage";
import { createResearchServer } from "./web-server";

export async function startWorkspace(args = process.argv.slice(2)) {
  if (Number(process.versions.node.split(".")[0]) !== 24) throw new Error("Activate Node 24 for the research website.");
  let port = 3340, bridgePort = 3341;
  for (let i = 0; i < args.length; i += 2) {
    const value = Number(args[i + 1]);
    if (!["--port", "--bridge-port"].includes(args[i]) || !Number.isInteger(value) || value < 1024 || value > 65535) throw new Error("Use --port NUMBER and --bridge-port NUMBER (1024–65535).");
    if (args[i] === "--port") port = value; else bridgePort = value;
  }
  if (port === bridgePort) throw new Error("Website and local research bridge need different ports.");
  const bridge = createResearchServer({ sitePort: port, bridgePort });
  await new Promise<void>((resolve, reject) => { bridge.once("error", reject); bridge.listen(bridgePort, "127.0.0.1", resolve); });
  const childEnv: NodeJS.ProcessEnv = { ...process.env, JEV_RESEARCH_BRIDGE_PORT: String(bridgePort), JEV_RESEARCH_SITE_PORT: String(port) };
  delete childEnv.TYPESAFE_API_KEY;
  const child = spawn(process.execPath, [path.join(ROOT, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: ROOT, env: childEnv, stdio: "inherit" });
  console.log(`Private research workspace: http://127.0.0.1:${port}/scriptures/research`);
  let stopping = false;
  const stop = () => { if (stopping) return; stopping = true; child.kill("SIGTERM"); bridge.close(); bridge.closeAllConnections(); };
  process.once("SIGINT", stop); process.once("SIGTERM", stop);
  child.once("error", error => { console.error(error.message); stop(); process.exitCode = 1; });
  child.once("exit", code => { stop(); process.exitCode = code ?? 0; });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) startWorkspace().catch(error => { console.error((error as Error).message); process.exitCode = 1; });
