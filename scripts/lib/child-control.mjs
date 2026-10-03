/**
 * Child-process supervision primitives shared by the audit pool, the audit
 * command, the browser closer, and their tests.
 *
 * A released child's exit event is only delivered while something else keeps
 * the event loop alive: libuv processes SIGCHLD as a loop tick, so a drained
 * loop never observes the death of an unreferenced child. The pool releases
 * children at its force deadline so a SIGKILL-proof worker cannot trap the
 * supervisor; anything that must still observe such a child afterwards (a
 * test's own reap) re-adopts it first.
 */

/** True while the child has not yet reported any exit (normal or by signal). */
export function childAlive(child) {
  return child.exitCode === null && child.signalCode === null;
}

/**
 * Kill a live child; a dead child is a no-op so supervision ladders can call
 * freely. SIGTERM is a request, so it goes out once per child (Node flags
 * child.killed on the first send); SIGKILL always escalates.
 */
export function killChild(child, signal) {
  if (!childAlive(child)) return;
  if (signal !== "SIGKILL" && child.killed) return;
  child.kill(signal);
}

/** Stop a live child's handles from keeping the supervisor's event loop alive. */
export function releaseChild(child) {
  child.unref();
  child.channel?.unref?.();
}

/** Restore a released child's handles so its exit event is delivered again. */
export function adoptChild(child) {
  child.ref();
  child.channel?.ref?.();
}