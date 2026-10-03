import { childAlive } from "../lib/child-control.mjs";

/** Close only an owned browser, including pipes inherited by exited Chrome helpers. */
export async function closeBrowserServer(server) {
  if (!server) return;
  const child = server.process();
  const closeExitedPipes = () => {
    // Node's exit event confirms the process is gone; close also waits for
    // every stdio pipe. Chrome helpers can keep those pipes open on macOS,
    // preventing Playwright's kill() from reaching its normal cleanup.
    for (const pipe of child.stdio) pipe?.destroy?.();
  };
  child.once("exit", closeExitedPipes);
  if (!childAlive(child)) closeExitedPipes();
  try {
    await server.kill();
  } finally {
    child.removeListener("exit", closeExitedPipes);
  }
}
