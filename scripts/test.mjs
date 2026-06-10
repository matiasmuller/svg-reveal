import assert from "node:assert/strict";
import { revealSvg } from "../src/index.js";

const originalGetComputedStyle = globalThis.getComputedStyle;
const originalMatchMedia = globalThis.matchMedia;

function runTests() {
  try {
    globalThis.getComputedStyle = (element) => element.computedStyle ?? {};
    globalThis.matchMedia = () => ({ matches: false });

    testRevealLifecycle();
    testAutoPlay();
    testDefaultMinimums();
    testTextStateCanBeRestored();
    testReducedMotionFinishesImmediately();

    console.log("All tests passed.");
  } finally {
    globalThis.getComputedStyle = originalGetComputedStyle;
    globalThis.matchMedia = originalMatchMedia;
  }
}

function testRevealLifecycle() {
  const line = new FakeElement({
    length: 100,
    computedStyle: {
      stroke: "none",
      fill: "red",
      fillOpacity: "0.75"
    }
  });
  line.style.strokeLinecap = "square";

  const svg = new FakeSvg({ segments: [line] });
  const reveal = revealSvg(svg, {
    duration: 1000,
    randomFunction: () => 0,
    respectReducedMotion: false
  });

  assert.equal(reveal.segmentCount, 1);
  assert.equal(reveal.textCount, 0);
  assert.equal(line.style.strokeDasharray, "100");
  assert.equal(line.style.strokeDashoffset, "100");
  assert.equal(line.style.stroke, "red");
  assert.equal(line.style.fillOpacity, "0");
  assert.equal(line.animations.length, 0);

  reveal.play();

  assert.equal(line.animations.length, 2);
  assert.equal(reveal.animations.length, 2);
  assert.equal(line.animations[0].options.delay, 0);

  reveal.reset();

  assert.equal(reveal.animations.length, 0);
  assert.equal(line.animations[0].cancelled, true);
  assert.equal(line.style.strokeDashoffset, "100");
  assert.equal(line.style.fillOpacity, "0");

  reveal.finish();

  assert.equal(line.style.strokeDashoffset, "0");
  assert.equal(line.style.fillOpacity, "0.75");

  reveal.destroy();

  assert.equal(line.style.strokeDasharray, "");
  assert.equal(line.style.strokeDashoffset, "");
  assert.equal(line.style.strokeLinecap, "square");
  assert.equal(line.style.stroke, "");
  assert.equal(line.style.fillOpacity, "");
}

function testAutoPlay() {
  const path = new FakeElement({
    length: 50,
    computedStyle: {
      stroke: "black",
      fill: "none",
      fillOpacity: "1"
    }
  });
  const svg = new FakeSvg({ segments: [path] });
  const reveal = revealSvg(svg, {
    autoPlay: true,
    duration: 500,
    randomFunction: () => 0,
    respectReducedMotion: false
  });

  assert.equal(reveal.segmentCount, 1);
  assert.equal(reveal.textCount, 0);
  assert.equal(reveal.animations.length, 1);
}

function testDefaultMinimums() {
  const tinyPath = new FakeElement({
    length: 0.1,
    computedStyle: {
      stroke: "black",
      fill: "none",
      fillOpacity: "1"
    }
  });
  const zeroLengthPath = new FakeElement({
    length: 0,
    computedStyle: {
      stroke: "black",
      fill: "none",
      fillOpacity: "1"
    }
  });
  const svg = new FakeSvg({ segments: [tinyPath, zeroLengthPath] });
  const reveal = revealSvg(svg, {
    duration: 500,
    randomFunction: () => 0,
    respectReducedMotion: false
  });

  assert.equal(reveal.segmentCount, 1);
}

function testTextStateCanBeRestored() {
  const text = new FakeElement({
    textContent: "SVG",
    attributes: {
      x: "10",
      y: "20"
    }
  });
  const svg = new FakeSvg({ texts: [text] });
  const reveal = revealSvg(svg, {
    duration: 1000,
    randomFunction: () => 0,
    respectReducedMotion: false
  });

  assert.equal(reveal.segmentCount, 0);
  assert.equal(reveal.textCount, 1);
  assert.equal(text.textContent, "");
  assert.equal(text.children.length, 3);
  assert.equal(text.children[0].textContent, "S");
  assert.equal(text.children[0].getAttribute("x"), "10");
  assert.equal(text.children[0].style.opacity, "0");

  reveal.finish();

  assert.equal(text.children[2].style.opacity, "1");

  reveal.destroy();

  assert.equal(text.textContent, "SVG");
  assert.equal(text.children.length, 0);
  assert.equal(text.getAttribute("xml:space"), null);
}

function testReducedMotionFinishesImmediately() {
  globalThis.matchMedia = () => ({ matches: true });

  const rect = new FakeElement({
    length: 25,
    computedStyle: {
      stroke: "black",
      fill: "none",
      fillOpacity: "1"
    }
  });
  const svg = new FakeSvg({ segments: [rect] });
  const reveal = revealSvg(svg, {
    autoPlay: true,
    duration: 1000,
    randomFunction: () => 0
  });

  assert.equal(reveal.animations.length, 0);
  assert.equal(rect.style.strokeDashoffset, "0");

  globalThis.matchMedia = () => ({ matches: false });
}

class FakeSvg {
  constructor({ segments = [], texts = [] } = {}) {
    this.segments = segments;
    this.texts = texts;
  }

  querySelectorAll(selector) {
    if (selector === "text") {
      return this.texts;
    }

    return this.segments;
  }
}

class FakeElement {
  constructor({
    length = 0,
    computedStyle = {},
    textContent = "",
    attributes = {}
  } = {}) {
    this.length = length;
    this.computedStyle = computedStyle;
    this.attributes = new Map(Object.entries(attributes));
    this.style = {};
    this.children = [];
    this._textContent = "";
    this.textContent = textContent;
    this.animations = [];
    this.ownerDocument = {
      createElementNS: () => new FakeElement()
    };
  }

  getTotalLength() {
    return this.length;
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  animate(keyframes, options) {
    const animation = {
      keyframes,
      options,
      cancelled: false,
      cancel() {
        this.cancelled = true;
      }
    };

    this.animations.push(animation);
    return animation;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }
}

runTests();
