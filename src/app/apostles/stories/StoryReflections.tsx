'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './reflections.css';

export default function StoryReflections({ kind }: { kind: 'peter' | 'thomas' | 'pentecost' }) {
  if (kind === 'peter') return <Peter />;
  if (kind === 'thomas') return <Thomas />;
  return <Pentecost />;
}

function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

const PETER_DATA = [
  {
    n: 1,
    heading: 'Question one',
    ref: 'John 21:15',
    href: '/scriptures/protestant/JHN/21#v15',
    jesus: 'Simon, son of Jonah, do you love me more than these?',
    peter: 'Yes, Lord; you know that I have affection for you.',
    commission: 'Feed my lambs.',
  },
  {
    n: 2,
    heading: 'Question two',
    ref: 'John 21:16',
    href: '/scriptures/protestant/JHN/21#v16',
    jesus: 'Simon, son of Jonah, do you love me?',
    peter: 'Yes, Lord; you know that I have affection for you.',
    commission: 'Tend my sheep.',
  },
  {
    n: 3,
    heading: 'Question three',
    ref: 'John 21:17',
    href: '/scriptures/protestant/JHN/21#v17',
    jesus: 'Simon, son of Jonah, do you have affection for me?',
    peter: 'Lord, you know everything. You know that I have affection for you.',
    commission: 'Feed my sheep.',
  },
];
const ORDINAL = ['First question', 'Second question', 'Third question'];

function Peter() {
  const ready = useReady();
  const [selected, setSelected] = useState(0);
  return (
    <div className="as-reflect as-reflect-peter">
      <h2>Three questions. A calling renewed.</h2>
      <p>Read each question in turn. Each exchange is shown in full below.</p>
      <div className="as-reflect-controls" role="group" aria-label="Choose an exchange">
        {ORDINAL.map((label, i) => (
          <button key={label} type="button" disabled={!ready} aria-pressed={selected === i} data-selected={selected === i} onClick={() => setSelected(i)}>
            {label}
          </button>
        ))}
      </div>
      <p role="status" className="as-reflect-status">Selected: {PETER_DATA[selected].heading} — Jesus says, “{PETER_DATA[selected].commission}”</p>
      <div className="as-reflect-stack">
        {PETER_DATA.map((ex, i) => (
          <section key={ex.n} aria-label={ex.heading} data-selected={selected === i} className="as-reflect-card">
            <h3>{ex.heading}</h3>
            <p><Link href={ex.href}>{ex.ref}</Link></p>
            <p>Jesus: “{ex.jesus}”</p>
            <p>Peter: “{ex.peter}”</p>
            <p>Commission: “{ex.commission}”</p>
          </section>
        ))}
      </div>
      <p className="as-reflect-note">Peter was grieved at the third question.</p>
    </div>
  );
}

function Thomas() {
  const ready = useReady();
  const [value, setValue] = useState(0);
  const atStart = value === 0;
  const atEnd = value === 100;
  const valueText = atStart ? 'Thomas’s demand' : atEnd ? 'Thomas’s confession' : 'Between demand and confession';
  return (
    <div className="as-reflect as-reflect-thomas">
      <h2>Between these words.</h2>
      <div className="as-reflect-controls" role="group" aria-label="Move between demand and confession">
        <button type="button" disabled={!ready} aria-pressed={atStart} data-selected={atStart} onClick={() => setValue(0)}>The demand</button>
        <button type="button" disabled={!ready} aria-pressed={atEnd} data-selected={atEnd} onClick={() => setValue(100)}>The confession</button>
      </div>
      <label htmlFor="as-reflect-range">Move from demand to confession</label>
      <input id="as-reflect-range" type="range" min={0} max={100} step={1} value={value} disabled={!ready} aria-valuetext={valueText} onChange={(e) => setValue(Number(e.target.value))} />
      <div className="as-reflect-pair" style={{ ['--as-t' as string]: String(value / 100) }}>
        <blockquote data-side="demand" data-active={atStart} className="as-reflect-saying">
          <p>“I will not believe.”</p>
          <cite><Link href="/scriptures/protestant/JHN/20#v25">John 20:25</Link></cite>
        </blockquote>
        <p className="as-reflect-middle">Jesus’s invitation stands between these words. The passage records Thomas’s confession, without saying whether he touched Jesus. <Link href="/scriptures/protestant/JHN/20#v27">John 20:27</Link></p>
        <blockquote data-side="confession" data-active={atEnd} className="as-reflect-saying">
          <p>“My Lord and my God!”</p>
          <cite><Link href="/scriptures/protestant/JHN/20#v28">John 20:28</Link></cite>
        </blockquote>
      </div>
      <p role="status" className="as-reflect-status">{atStart ? 'Thomas’s demand.' : atEnd ? 'Thomas’s confession.' : 'Between demand and confession.'}</p>
    </div>
  );
}

const GROUPS = [
  { id: 'east', button: 'East', title: 'East', peoples: 'Parthians, Medes, Elamites, and residents of Mesopotamia.' },
  { id: 'asia', button: 'Asia Minor', title: 'Asia Minor', peoples: 'Cappadocia, Pontus, Asia, Phrygia, and Pamphylia.' },
  { id: 'south', button: 'Egypt and Libya', title: 'Egypt and Libya', peoples: 'Egypt and Libya near Cyrene.' },
  { id: 'gathering', button: 'Rome, Crete, Arabia', title: 'Across the gathering', peoples: 'Rome, Crete, and Arabia.' },
] as const;

function Pentecost() {
  const ready = useReady();
  const [focus, setFocus] = useState<string>('all');
  const active = GROUPS.find((g) => g.id === focus);
  return (
    <div className="as-reflect as-reflect-pentecost">
      <h2>Heard in their own languages.</h2>
      <p>These groupings are our geographic reading aid, not routes or dates.</p>
      <p className="as-reflect-note">Judea is listed among the hearers and stands apart from the grouped regions.</p>
      <blockquote className="as-reflect-verse">“How do we hear, everyone in our own native language?” <cite><Link href="/scriptures/protestant/ACT/2#v5">Acts 2:5–13</Link></cite></blockquote>
      <div className="as-reflect-controls" role="group" aria-label="Highlight a group of hearers">
        <button type="button" disabled={!ready} aria-pressed={focus === 'all'} data-selected={focus === 'all'} onClick={() => setFocus('all')}>All the hearers</button>
        {GROUPS.map((g) => (
          <button key={g.id} type="button" disabled={!ready} aria-pressed={focus === g.id} data-selected={focus === g.id} onClick={() => setFocus(g.id)}>{g.button}</button>
        ))}
      </div>
      <p role="status" className="as-reflect-status">{active ? `Highlighted: ${active.title} — ${active.peoples}` : 'All the hearers shown together.'}</p>
      <div className="as-reflect-grid">
        {GROUPS.map((g) => (
          <article key={g.id} aria-label={g.title} data-selected={focus === 'all' || focus === g.id} className="as-reflect-card">
            <h3>{g.title}</h3>
            <p>{g.peoples}</p>
          </article>
        ))}
      </div>
      <p className="as-reflect-note">Jewish hearers and proselytes are included among those present.</p>
    </div>
  );
}
