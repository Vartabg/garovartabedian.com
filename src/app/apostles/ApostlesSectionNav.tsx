import SectionProgressNav, {
  type SectionProgressNavItem,
} from "../_components/SectionProgressNav";

export type ApostlesSectionNavItem = SectionProgressNavItem;

export default function ApostlesSectionNav({
  items,
  label,
}: {
  items: ApostlesSectionNavItem[];
  label: string;
}) {
  return <SectionProgressNav items={items} label={label} classPrefix="ap" />;
}
