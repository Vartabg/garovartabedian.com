# Bounded local audit shutdown

The September 7 local release completed its accessibility route matrix but
waited indefinitely for browser shutdown. Chrome had exited while inherited
stdio pipes remained open. Node distinguishes a child process's `exit` event
from `close`, which also waits for its stdio streams. Playwright's shutdown
promise was waiting for the latter. See the [Node child-process documentation](https://nodejs.org/api/child_process.html#event-close).

`scripts/browser/close-server.mjs` closes the owned browser's pipes after its
process exits. It never closes a live browser's pipes or searches for arbitrary
Chrome processes. This repairs the observed shutdown failure.

The audit supervisor supplies a separate backstop. Each worker has a
15-minute total deadline. An explicit cleanup message starts a 15-second
shutdown deadline; repeated messages cannot extend it. A report without a
worker exit is also limited to 15 seconds. A timeout requests SIGTERM, escalates
to SIGKILL after two seconds, and fails after another two seconds even if the
child cannot be reaped. The failure includes the worker and its PID.

Timeouts never count as passed checks. Success still requires exactly one
valid report covering every assigned route once, no reported violations, and
a successful worker exit. A crashed or timed-out worker causes the parent to
shut down its peers. The parent's final shutdown also has a 15-second deadline,
and the success message is printed only after shutdown finishes. If the OS
refuses to terminate an owned process, the command reports failure and its PID;
it does not claim that the process was removed.

Regression tests use real subprocesses to exercise hung cleanup, ignored
SIGTERM, repeated cleanup messages, a successful-looking report followed by a
hang, no report, and an exit-zero response after a timeout. Injected signal
failure verifies that the supervisor still returns a failure. The failure
modes run under tight deadlines so a hung worker is killed fast. The
well-behaved worker runs under deadlines it must never reach: its test proves
the protocol, not latency, and a loaded machine can take several hundred
milliseconds to fork a child, exchange two messages and reap it. Separate tests
cover open inherited browser pipes and the parent's missing shutdown events.
