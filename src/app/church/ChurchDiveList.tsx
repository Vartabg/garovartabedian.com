import type { ReactNode } from "react";
import DiveList from "../_components/DiveList";

export default function ChurchDiveList({
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
      classPrefix="ch"
      recordAttribute="data-church-dive"
    >
      {children}
    </DiveList>
  );
}
