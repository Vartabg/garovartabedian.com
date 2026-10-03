import type { ReactNode } from "react";
import DiveList from "../_components/DiveList";

export default function ApostlesDiveList({
  id,
  label,
  countLabel,
  description,
  children,
}: {
  id: string;
  label: string;
  countLabel: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <DiveList
      id={id}
      label={label}
      countLabel={countLabel}
      description={description}
      classPrefix="ap"
      recordAttribute="data-apostles-dive"
    >
      {children}
    </DiveList>
  );
}
