import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import {
  Button,
  ButtonAnchor,
  ButtonLink,
  IconButton,
  buttonClassName,
} from "../src/app/_components/Button";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

function render(element: React.ReactNode) {
  const dom = new JSDOM(`<!doctype html><body>${renderToStaticMarkup(element)}</body>`);
  return { dom, element: dom.window.document.body.firstElementChild as HTMLElement };
}

describe("Button", () => {
  it("builds deterministic default and modifier classes", () => {
    assert.equal(
      buttonClassName(),
      "ui-button ui-button--secondary ui-button--md",
    );
    assert.equal(
      buttonClassName({
        variant: "destructive",
        size: "lg",
        fullWidth: true,
        className: "extra",
      }),
      "ui-button ui-button--destructive ui-button--lg ui-button--full extra",
    );
  });

  it("renders a native non-submit button by default", () => {
    const { dom, element } = render(<Button>Continue</Button>);

    assert.equal(element.tagName, "BUTTON");
    assert.equal(element.getAttribute("type"), "button");
    assert.equal(element.getAttribute("data-ui"), "button");
    assert.equal(element.getAttribute("data-variant"), "secondary");
    assert.equal(element.getAttribute("data-size"), "md");
    assert.equal(element.querySelector(".ui-button__label")?.textContent, "Continue");

    dom.window.close();
  });

  it("preserves explicit native button behavior and custom classes", () => {
    const { dom, element } = render(
      <Button type="submit" variant="primary" size="lg" className="checkout">
        Send
      </Button>,
    );

    assert.equal(element.getAttribute("type"), "submit");
    assert.equal(element.getAttribute("data-variant"), "primary");
    assert.equal(element.getAttribute("data-size"), "lg");
    assert.ok(element.classList.contains("checkout"));

    dom.window.close();
  });

  it("keeps its label stable while exposing disabled and live loading state", () => {
    const { dom, element } = render(
      <Button loading loadingLabel="Searching the record">
        Find passages
      </Button>,
    );

    assert.ok((element as HTMLButtonElement).disabled);
    assert.equal(element.getAttribute("aria-busy"), "true");
    assert.equal(element.getAttribute("data-loading"), "true");
    assert.equal(
      element.querySelector(".ui-button__label")?.textContent,
      "Find passages",
    );
    assert.ok(element.querySelector(".ui-button__spinner"));
    const status = dom.window.document.querySelector('[role="status"]');
    assert.equal(status?.getAttribute("aria-live"), "polite");
    assert.equal(status?.getAttribute("aria-atomic"), "true");
    assert.equal(status?.textContent, "Searching the record");

    dom.window.close();
  });

  it("renders internal navigation as a link, not a button role", () => {
    const { dom, element } = render(
      <ButtonLink href="/scriptures" variant="primary">
        Open Scripture
      </ButtonLink>,
    );

    assert.equal(element.tagName, "A");
    assert.equal(element.getAttribute("href"), "/scriptures");
    assert.equal(element.getAttribute("role"), null);
    assert.equal(element.getAttribute("data-variant"), "primary");

    dom.window.close();
  });

  it("adds safe rel values to native anchors that open a new tab", () => {
    const { dom, element } = render(
      <ButtonAnchor
        href="https://example.com"
        target="_blank"
        rel="external noopener"
      >
        External source
      </ButtonAnchor>,
    );

    assert.equal(element.tagName, "A");
    assert.equal(element.getAttribute("target"), "_blank");
    assert.deepEqual(
      new Set(element.getAttribute("rel")?.split(/\s+/)),
      new Set(["external", "noopener", "noreferrer"]),
    );

    dom.window.close();
  });

  it("requires an accessible label for icon-only buttons", () => {
    const { dom, element } = render(
      <IconButton label="Close settings" icon={<span aria-hidden="true">×</span>} />,
    );

    assert.equal(element.tagName, "BUTTON");
    assert.equal(element.getAttribute("aria-label"), "Close settings");
    assert.equal(element.getAttribute("data-size"), "icon");
    assert.ok(element.querySelector(".ui-button__icon--only"));
    dom.window.close();

    assert.throws(
      () =>
        renderToStaticMarkup(
          <IconButton label="   " icon={<span aria-hidden="true">×</span>} />,
        ),
      /non-empty label/,
    );
  });

  it("retains an icon button's name while exposing its loading indicator", () => {
    const { dom, element } = render(
      <IconButton
        label="Regenerate answer"
        icon={<span aria-hidden="true">↻</span>}
        loading
        loadingLabel="Regenerating answer"
      />,
    );

    assert.equal(element.getAttribute("aria-label"), "Regenerate answer");
    assert.equal(element.getAttribute("aria-busy"), "true");
    assert.ok((element as HTMLButtonElement).disabled);
    assert.ok(element.querySelector(".ui-button__icon--only"));
    assert.ok(element.querySelector(".ui-button__spinner"));
    assert.equal(
      dom.window.document.querySelector('[role="status"]')?.textContent,
      "Regenerating answer",
    );

    dom.window.close();
  });
});
