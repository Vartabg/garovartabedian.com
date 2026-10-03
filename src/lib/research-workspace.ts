/** Browser contract only. Credentials and the local research engine stay in Node. */
export type WorkspaceSource =
  | { kind: "hosted"; selector: string }
  | { kind: "text"; text: string; name: string };
export type WorkspaceRequest = {
  mode: "compare" | "discover" | "check-claim";
  left: WorkspaceSource;
  right: WorkspaceSource;
  claim: string;
  wholeScripture: boolean;
};
export type WorkspaceTask = {
  id: string;
  runId: string;
  state: "preparing" | "evaluating" | "complete" | "failed";
  error?: string;
  progress?: { planned: number; completed: number; attempts: number };
};
export type WorkspaceSession = { token: string; keyAvailable: boolean; model: string };
export type WorkspaceRunSummary = { id: string; createdAt: string; status: string; planned: number; title: string };
