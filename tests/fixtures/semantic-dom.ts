// Install the DOM before React DOM is imported so native input events work.
import { JSDOM } from "jsdom";
import React from "react";
export const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost/",
});
for (const [key, value] of Object.entries({React, self:dom.window, window:dom.window,
  document:dom.window.document, navigator:dom.window.navigator, HTMLElement:dom.window.HTMLElement,
  HTMLInputElement:dom.window.HTMLInputElement, SVGElement:dom.window.SVGElement,
  Event:dom.window.Event, MouseEvent:dom.window.MouseEvent, IS_REACT_ACT_ENVIRONMENT:true})) {
  Object.defineProperty(globalThis, key, {configurable:true, value});
}
