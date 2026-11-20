import Experience from '@/ui/Experience';
import { ACCOUNT_PATH } from '@/paths';

export default function HermonPage() {
  return <>
    <noscript><p className="text-alternative">The flight uses JavaScript. <a href={ACCOUNT_PATH}>Follow the shepherds through the pass in text.</a></p></noscript>
    <Experience />
  </>;
}
