import type { Metadata } from "next";
import { ButtonAnchor } from "@/app/_components/Button";
import CleanChrome from "../../_components/CleanChrome";
import { CONTACT_METHOD_BY_ID } from "@/lib/portfolio-content";

const mailtoHref = `${CONTACT_METHOD_BY_ID.email.href}?subject=${encodeURIComponent(
  "Project inquiry after seeing EYE",
)}`;

export const metadata: Metadata = {
  title: "EYE — Visual Code Execution",
  description:
    "I taught myself to code the non-traditional way, and walls of text fought me the whole way. EYE draws code execution as a graph you can watch — built for me first, and for the next person learning the way I do.",
};

const STACK = [
  {
    name: "Rendering",
    note: "Pixi.js v8 on WebGL — nodes, edges, and trace activity drawn on canvas, with a Canvas 2D fallback.",
  },
  {
    name: "Layout",
    note: "ELK.js layered layout: functions become containers, statements become child nodes, ports keep edges readable.",
  },
  {
    name: "Frontend",
    note: "React 19 + TypeScript + Vite. Monaco editor up top, the execution graph below it.",
  },
  {
    name: "Tracing",
    note: "A Python tracer behind FastAPI streams call, line, branch, and return events over WebSocket — this part runs locally.",
  },
  {
    name: "Transport",
    note: "MessagePack on the trace path, so event streams stay compact.",
  },
  {
    name: "Shipping",
    note: "The public demo builds to static assets — no Python in the cloud. Demo mode is a build flag, not a fork.",
  },
];

export default function WorkEye() {
  return (
    <CleanChrome activeHref="/work">
      <p className="kicker">Work / Case study</p>
      <h1>EYE — Visual Code Execution</h1>
      <p className="lede">
        I taught myself to code the non-traditional way, and reading walls of
        text was the hardest part. EYE is the help I needed: it draws code
        execution as a graph you can watch — calls, branches, what ran when.
      </p>

      <p>
        <ButtonAnchor
          variant="primary"
          href="https://eye-code-visualizer.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open the live demo
        </ButtonAnchor>
      </p>

      <h2>Why I built it</h2>
      <p>
        I didn&rsquo;t come to software through a CS degree. I&rsquo;m a
        self-taught, non-traditional learner, and when I was learning to
        program, the standard way in — docs, logs, stack traces, walls of text —
        fought me the whole way. I could read a function ten times and still
        not see what it actually did when it ran. What finally helped was
        making the invisible visible: watching the code instead of just reading
        it.
      </p>
      <p>
        So EYE started as the tool I needed for myself. It&rsquo;s public
        because of who it&rsquo;s really for — the next person learning the way
        I do, stuck where I was stuck, wondering if they&rsquo;re cut out for
        this. You might just need to see it.
      </p>
      <p>
        And to be plain about the why underneath: I&rsquo;m trying to love God
        with all I&rsquo;ve got and love my neighbor as myself. Building the
        help I needed and handing it to the next person is one small way to do
        that.
      </p>

      <h2>What it does</h2>
      <p>
        EYE maps source code into a graph — functions as containers, statements
        as nodes, control flow as edges — and lays it out automatically. In the
        full local build, a Python tracer streams execution events to the
        browser over WebSocket, and the graph animates as the code runs: active
        nodes light up, edges pulse on calls and returns, and a replay timeline
        lets you step back through what happened.
      </p>
      <p>
        The public demo is the smaller, honest version: a static Fibonacci map
        that loads with no backend, so anyone can open it on a phone. Live
        tracing stays local until the backend is hosted — the demo says so on
        screen rather than pretending otherwise.
      </p>

      <h2>How it&rsquo;s built</h2>
      <p>
        Every layer of this stack is something I had to teach myself first.
      </p>
      <ul className="contact-list">
        {STACK.map((s) => (
          <li key={s.name}>
            <span className="label">{s.name}</span>
            <span className="value">{s.note}</span>
          </li>
        ))}
      </ul>

      <h2>What the demo does today</h2>
      <p>
        The static graph and source load from the CDN with no backend, render
        on desktop and a 390px phone, survive navigating away and back, and
        ship with a clean browser console. Pan, zoom, double-click-to-fit, and
        click-to-isolate a node&rsquo;s neighborhood all work on the live page
        — try them.
      </p>

      <h2>Who it&rsquo;s for</h2>
      <p>
        If you&rsquo;re learning to code and the text walls aren&rsquo;t
        working for you, this is for you — no signup, no catch. If you&rsquo;re
        responsible for a technical product or difficult interface, this page
        also shows how I work: build the real thing, make the system visible,
        and say plainly what works and what does not.
      </p>
      <p>
        <ButtonAnchor variant="primary" href={mailtoHref}>
          Discuss a related project
        </ButtonAnchor>
      </p>
    </CleanChrome>
  );
}
