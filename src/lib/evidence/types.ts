export type EvidenceLayerId = "observed" | "inferred" | "interpreted";

export type EvidenceRoomId =
  | "source"
  | "text"
  | "stone"
  | "witness"
  | "experiment"
  | "argument"
  | "tradition"
  | "limit";

export type EvidenceSourceKind =
  | "consensus report"
  | "research agency"
  | "philosophy reference"
  | "ecumenical creed"
  | "confessional source";

export type EvidenceSource = {
  id: string;
  label: string;
  organization: string;
  href: string;
  kind: EvidenceSourceKind;
  note: string;
};

export type EvidenceData = {
  schemaVersion: number;
  title: string;
  subtitle: string;
  charter: {
    title: string;
    text: string;
  }[];
  layers: {
    id: EvidenceLayerId;
    label: string;
    question: string;
    text: string;
  }[];
  rooms: {
    id: EvidenceRoomId;
    label: string;
    question: string;
    text: string;
    example: string;
    href: string;
    action: string;
  }[];
  claimLab: {
    id: string;
    world: string;
    mode: string;
    title: string;
    question: string;
    record: string;
    inference: string;
    limit: string;
    href: string;
    action: string;
  }[];
  sourceLanes: {
    label: string;
    note: string;
    href: string;
  }[];
  faithScience: {
    title: string;
    lede: string;
    principle: string;
    docket: {
      id: string;
      status: "next" | "queued" | "later";
      title: string;
      question: string;
      boundary: string;
    }[];
  };
  sources: EvidenceSource[];
};
