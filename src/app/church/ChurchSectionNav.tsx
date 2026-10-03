import SectionProgressNav, {
  type SectionProgressNavItem,
} from "../_components/SectionProgressNav";

export type ChurchSectionNavItem = SectionProgressNavItem;

export default function ChurchSectionNav({
  items,
  label,
}: {
  items: ChurchSectionNavItem[];
  label: string;
}) {
  return <SectionProgressNav items={items} label={label} classPrefix="ch" />;
}
