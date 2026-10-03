import assert from "node:assert/strict";
import test from "node:test";
import { adoptChild, childAlive, killChild, releaseChild } from "../scripts/lib/child-control.mjs";

type FakeChild = {
  calls: string[];
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
  killed: boolean;
  channel: { unref?: () => void; ref?: () => void } | null;
  unref: () => void;
  ref: () => void;
  kill: (signal: NodeJS.Signals) => boolean;
};

function fakeChild({ killed = false }: { killed?: boolean } = {}): FakeChild {
  const calls: string[] = [];
  return {
    calls,
    exitCode: null,
    signalCode: null,
    killed,
    unref: () => calls.push("unref"),
    ref: () => calls.push("ref"),
    channel: {
      unref: () => calls.push("channel-unref"),
      ref: () => calls.push("channel-ref"),
    },
    kill: (signal) => {
      calls.push(`kill:${signal}`);
      return true;
    },
  };
}

test("killChild sends SIGTERM once per child and always escalates to SIGKILL", () => {
  const child = fakeChild();
  killChild(child, "SIGTERM");
  assert.deepEqual(child.calls, ["kill:SIGTERM"]);
  child.killed = true; // Node flags a child as killed on the first signal, before it exits.
  killChild(child, "SIGTERM");
  assert.deepEqual(child.calls, ["kill:SIGTERM"], "a repeat SIGTERM request is a no-op");
  killChild(child, "SIGKILL");
  assert.deepEqual(child.calls, ["kill:SIGTERM", "kill:SIGKILL"], "SIGKILL escalates even after a sent SIGTERM");
});

test("killChild is a no-op once any exit is reported", () => {
  const exited = fakeChild();
  exited.exitCode = 0;
  killChild(exited, "SIGKILL");
  const signalled = fakeChild();
  signalled.signalCode = "SIGKILL";
  killChild(signalled, "SIGTERM");
  assert.deepEqual(exited.calls, []);
  assert.deepEqual(signalled.calls, []);
});

test("childAlive is true only before any exit is reported", () => {
  const child = fakeChild();
  assert.equal(childAlive(child), true);
  child.exitCode = 0;
  assert.equal(childAlive(child), false);
  const signalled = fakeChild();
  signalled.signalCode = "SIGTERM";
  assert.equal(childAlive(signalled), false);
});

test("releaseChild then adoptChild releases and restores the child handle and its IPC channel", () => {
  const child = fakeChild();
  releaseChild(child);
  assert.deepEqual(child.calls, ["unref", "channel-unref"]);
  adoptChild(child);
  assert.deepEqual(child.calls, ["unref", "channel-unref", "ref", "channel-ref"]);
});

test("releaseChild and adoptChild tolerate a child without an IPC channel", () => {
  const child = fakeChild();
  child.channel = null;
  releaseChild(child);
  adoptChild(child);
  assert.deepEqual(child.calls, ["unref", "ref"]);
});