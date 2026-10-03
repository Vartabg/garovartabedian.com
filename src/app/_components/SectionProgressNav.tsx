"use client";

import { useEffect, useRef, useState } from "react";

export type SectionProgressNavItem = {
  id: string;
  label: string;
};

export default function SectionProgressNav({
  items,
  label,
  classPrefix,
}: {
  items: SectionProgressNavItem[];
  label: string;
  classPrefix: string;
}) {
  const linksRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;

    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);

    let frame: number | undefined;
    const updateFromPosition = () => {
      const focusLine = Math.max(96, window.innerHeight * 0.22);
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= focusLine) current = section;
        else break;
      }
      if (current?.id) setActiveId(current.id);
    };
    const schedulePositionUpdate = () => {
      if (frame !== undefined) return;
      const update = () => {
        frame = undefined;
        updateFromPosition();
      };
      if (typeof requestAnimationFrame === "function") frame = requestAnimationFrame(update);
      else update();
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
              if (visible[0]?.target.id) setActiveId(visible[0].target.id);
            },
            { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.2, 0.8] },
          );

    sections.forEach((section) => observer?.observe(section));
    window.addEventListener("scroll", schedulePositionUpdate, { passive: true });
    window.addEventListener("resize", schedulePositionUpdate);
    updateFromPosition();

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", schedulePositionUpdate);
      window.removeEventListener("resize", schedulePositionUpdate);
      if (frame !== undefined && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frame);
      }
    };
  }, [items]);

  useEffect(() => {
    const links = linksRef.current;
    const activeLink = Array.from(
      links?.querySelectorAll<HTMLAnchorElement>("a[data-section-id]") ?? [],
    ).find((link) => link.dataset.sectionId === activeId);
    if (!links || !activeLink || links.scrollWidth <= links.clientWidth) return;

    const left =
      activeLink.offsetLeft - (links.clientWidth - activeLink.offsetWidth) / 2;
    links.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [activeId]);

  const activeLabel = items.find((item) => item.id === activeId)?.label ?? items[0]?.label;

  return (
    <nav className={`${classPrefix}-section-nav`} aria-label={label}>
      <span className={`${classPrefix}-section-current`}>
        <span>Now</span>
        <strong>{activeLabel}</strong>
      </span>
      <div className={`${classPrefix}-section-links`} ref={linksRef}>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            data-section-id={item.id}
            aria-current={activeId === item.id ? "location" : undefined}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
