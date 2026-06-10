const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export const DEFAULT_ANIMATION_OPTIONS = {
  duration: 4000,
  delay: 0,
  textRenderRatio: 0.2,
  minSegmentLength: 0,
  minSegmentDuration: 0,
  fillFadeDuration: 180,
  autoPlay: false,
  preserveExistingStyles: true,
  respectReducedMotion: true,
  randomFunction: Math.random
};

export function parseSvgString(source, options = {}) {
  const {
    document: targetDocument = globalThis.document,
    removeDimensions = true,
    ariaLabel = "SVG animado"
  } = options;

  if (!targetDocument) {
    throw new Error("parseSvgString necesita un document destino.");
  }

  const Parser = targetDocument.defaultView?.DOMParser ?? globalThis.DOMParser;

  if (!Parser) {
    throw new Error("parseSvgString necesita DOMParser disponible.");
  }

  const parser = new Parser();
  const parsedDocument = parser.parseFromString(source, "image/svg+xml");
  const parserError = parsedDocument.querySelector("parsererror");
  const svg = parsedDocument.documentElement;

  if (parserError || svg?.tagName?.toLowerCase() !== "svg") {
    throw new Error("No pude leer ese contenido como SVG valido.");
  }

  const importedSvg = targetDocument.importNode(svg, true);

  if (removeDimensions) {
    importedSvg.removeAttribute("width");
    importedSvg.removeAttribute("height");
  }

  if (ariaLabel) {
    importedSvg.setAttribute("aria-label", ariaLabel);
  }

  return importedSvg;
}

export function revealSvg(svg, options = {}) {
  const config = normalizeOptions(options);
  const segments = collectDrawableSegments(svg, config);
  const textData = prepareSvgTexts(svg);
  const orderedSegments = [...segments].sort((a, b) => b.length - a.length);
  const longest = orderedSegments[0];
  const secondLongest = orderedSegments[1];
  const xt = longest ? longest.length * 1.05 : 1;
  const velocity = xt / config.duration;
  const animations = [];
  const reveal = {
    segmentCount: segments.length,
    textCount: textData.length,
    xt,
    velocity,
    animations,
    play,
    reset,
    finish,
    destroy
  };

  reset();

  if (config.autoPlay) {
    play();
  }

  return reveal;

  function play() {
    cancelAnimations(animations);
    reset();

    if (shouldReduceMotion(config)) {
      finish();
      return reveal;
    }

    scheduleLineDrawing(orderedSegments, secondLongest, config, velocity, animations);
    scheduleTextDrawing(textData, config, animations);
    return reveal;
  }

  function reset() {
    cancelAnimations(animations);
    segments.forEach(applyInitialSegmentState);
    textData.forEach(resetTextState);
    return reveal;
  }

  function finish() {
    cancelAnimations(animations);
    segments.forEach(applyFinalSegmentState);
    textData.forEach(finishTextState);
    return reveal;
  }

  function destroy() {
    cancelAnimations(animations);
    segments.forEach((segment) => restoreSegmentState(segment, config));
    textData.forEach(restoreTextState);
    return reveal;
  }
}

function normalizeOptions(options) {
  const duration = readPositiveNumber(options.duration, DEFAULT_ANIMATION_OPTIONS.duration);
  const textRenderRatio = clamp(
    readPositiveNumber(options.textRenderRatio, DEFAULT_ANIMATION_OPTIONS.textRenderRatio),
    0,
    1
  );

  return {
    ...DEFAULT_ANIMATION_OPTIONS,
    ...options,
    duration,
    delay: readNonNegativeNumber(options.delay, DEFAULT_ANIMATION_OPTIONS.delay),
    textRenderRatio,
    minSegmentLength: readNonNegativeNumber(
      options.minSegmentLength,
      DEFAULT_ANIMATION_OPTIONS.minSegmentLength
    ),
    minSegmentDuration: readNonNegativeNumber(
      options.minSegmentDuration,
      DEFAULT_ANIMATION_OPTIONS.minSegmentDuration
    ),
    fillFadeDuration: readPositiveNumber(
      options.fillFadeDuration,
      DEFAULT_ANIMATION_OPTIONS.fillFadeDuration
    ),
    autoPlay: Boolean(options.autoPlay ?? DEFAULT_ANIMATION_OPTIONS.autoPlay),
    preserveExistingStyles: Boolean(
      options.preserveExistingStyles ?? DEFAULT_ANIMATION_OPTIONS.preserveExistingStyles
    ),
    respectReducedMotion: Boolean(
      options.respectReducedMotion ?? DEFAULT_ANIMATION_OPTIONS.respectReducedMotion
    ),
    randomFunction: typeof options.randomFunction === "function"
      ? options.randomFunction
      : DEFAULT_ANIMATION_OPTIONS.randomFunction
  };
}

function collectDrawableSegments(svg, config) {
  const selector = "path,line,polyline,polygon,circle,ellipse,rect";

  return [...svg.querySelectorAll(selector)]
    .map((element) => {
      const length = typeof element.getTotalLength === "function"
        ? element.getTotalLength()
        : 0;

      return { element, length };
    })
    .filter((segment) => Number.isFinite(segment.length) && segment.length > config.minSegmentLength)
    .map((segment) => ({
      ...segment,
      ...setupStrokeDrawing(segment.element, segment.length)
    }));
}

function setupStrokeDrawing(element, length) {
  const computed = getElementComputedStyle(element);
  const hasVisibleStroke = computed.stroke && computed.stroke !== "none";
  const originalStyles = snapshotStyles(element, [
    "strokeDasharray",
    "strokeDashoffset",
    "strokeLinecap",
    "strokeLinejoin",
    "stroke",
    "fillOpacity"
  ]);
  const stroke = hasVisibleStroke
    ? null
    : computed.fill && computed.fill !== "none"
      ? computed.fill
      : "currentColor";

  const fillOpacity = Number.parseFloat(computed.fillOpacity || "1");
  const hasVisibleFill = computed.fill && computed.fill !== "none" && fillOpacity > 0;

  return {
    originalStyles,
    stroke,
    fillOpacity: hasVisibleFill ? fillOpacity : null
  };
}

function applyInitialSegmentState(segment) {
  segment.element.style.strokeDasharray = String(segment.length);
  segment.element.style.strokeDashoffset = String(segment.length);

  if (!segment.element.style.strokeLinecap) {
    segment.element.style.strokeLinecap = "round";
  }

  if (!segment.element.style.strokeLinejoin) {
    segment.element.style.strokeLinejoin = "round";
  }

  if (segment.stroke) {
    segment.element.style.stroke = segment.stroke;
  }

  if (segment.fillOpacity !== null) {
    segment.element.style.fillOpacity = "0";
  }
}

function applyFinalSegmentState(segment) {
  segment.element.style.strokeDasharray = String(segment.length);
  segment.element.style.strokeDashoffset = "0";

  if (segment.fillOpacity !== null) {
    segment.element.style.fillOpacity = String(segment.fillOpacity);
  }
}

function restoreSegmentState(segment, config) {
  if (config.preserveExistingStyles) {
    restoreStyles(segment.element, segment.originalStyles);
  }
}

function scheduleLineDrawing(segments, secondLongest, config, velocity, animations) {
  if (!segments.length) {
    return;
  }

  const longest = segments[0];
  const rest = segments.slice(1);
  const drawLongestFirst = !secondLongest || config.randomFunction() < 0.5;
  const durationFor = (segment) => Math.max(config.minSegmentDuration, segment.length / velocity);

  if (drawLongestFirst) {
    animateSegment(longest, config.delay, durationFor(longest), config, animations);

    if (secondLongest) {
      const duration = durationFor(secondLongest);
      animateSegment(
        secondLongest,
        config.delay + Math.max(0, config.duration - duration),
        duration,
        config,
        animations
      );
    }
  } else {
    const duration = durationFor(longest);
    animateSegment(rest[0], config.delay, durationFor(rest[0]), config, animations);
    animateSegment(
      longest,
      config.delay + Math.max(0, config.duration - duration),
      duration,
      config,
      animations
    );
  }

  const alreadyScheduled = new Set([
    longest?.element,
    secondLongest?.element
  ]);

  const distributed = shuffle(
    segments.filter((segment) => !alreadyScheduled.has(segment.element)),
    config.randomFunction
  );
  const count = distributed.length;

  distributed.forEach((segment, index) => {
    const duration = durationFor(segment);
    const maxStart = Math.max(0, config.duration - duration);
    const slotWidth = maxStart / Math.max(1, count);
    const slotCenter = slotWidth * (index + 0.5);
    const jitter = (config.randomFunction() - 0.5) * slotWidth * 0.75;
    const delay = config.delay + clamp(slotCenter + jitter, 0, maxStart);

    animateSegment(segment, delay, duration, config, animations);
  });
}

function animateSegment(segment, delay, duration, config, animations) {
  runAnimation(
    segment.element,
    [
      { strokeDashoffset: segment.length },
      { strokeDashoffset: 0 }
    ],
    {
      delay,
      duration,
      easing: "linear",
      fill: "forwards"
    },
    animations
  );

  if (segment.fillOpacity !== null) {
    runAnimation(
      segment.element,
      [
        { fillOpacity: 0 },
        { fillOpacity: segment.fillOpacity }
      ],
      {
        delay: delay + duration,
        duration: config.fillFadeDuration,
        easing: "ease-out",
        fill: "forwards"
      },
      animations
    );
  }
}

function prepareSvgTexts(svg) {
  return [...svg.querySelectorAll("text")]
    .map((text) => splitTextIntoCharacters(text))
    .filter((data) => data.characters.length);
}

function splitTextIntoCharacters(text) {
  const value = text.textContent ?? "";
  const chars = [...value];
  const x = text.getAttribute("x");
  const y = text.getAttribute("y");
  const xmlSpace = text.getAttribute("xml:space");
  const document = text.ownerDocument;

  text.textContent = "";
  text.setAttribute("xml:space", "preserve");

  const characters = chars.map((char, index) => {
    const tspan = document.createElementNS(SVG_NAMESPACE, "tspan");
    tspan.textContent = char;
    tspan.style.opacity = "0";

    if (index === 0) {
      if (x !== null) {
        tspan.setAttribute("x", x);
      }

      if (y !== null) {
        tspan.setAttribute("y", y);
      }
    }

    text.appendChild(tspan);
    return tspan;
  });

  return {
    text,
    characters,
    originalText: value,
    originalXmlSpace: xmlSpace
  };
}

function resetTextState(data) {
  data.characters.forEach((character) => {
    character.style.opacity = "0";
  });
}

function finishTextState(data) {
  data.characters.forEach((character) => {
    character.style.opacity = "1";
  });
}

function restoreTextState(data) {
  data.text.textContent = data.originalText;

  if (data.originalXmlSpace === null) {
    data.text.removeAttribute("xml:space");
  } else {
    data.text.setAttribute("xml:space", data.originalXmlSpace);
  }
}

function scheduleTextDrawing(textData, config, animations) {
  const maxCharacters = Math.max(0, ...textData.map((data) => data.characters.length));

  if (!maxCharacters) {
    return;
  }

  const letterStep = Math.max(20, (config.duration * config.textRenderRatio) / maxCharacters);
  const fadeDuration = Math.min(450, Math.max(80, letterStep * 0.8));

  textData.forEach((data) => {
    const jitter = (config.randomFunction() - 0.5) * letterStep;
    const lastCharacterEnd = config.duration - letterStep + jitter;
    const start = Math.max(
      0,
      lastCharacterEnd - fadeDuration - ((data.characters.length - 1) * letterStep)
    );

    data.characters.forEach((character, index) => {
      runAnimation(
        character,
        [
          { opacity: 0 },
          { opacity: 1 }
        ],
        {
          delay: config.delay + start + (index * letterStep),
          duration: fadeDuration,
          easing: "ease-out",
          fill: "forwards"
        },
        animations
      );
    });
  });
}

function runAnimation(element, keyframes, options, animations) {
  if (typeof element.animate === "function") {
    const animation = element.animate(keyframes, options);
    animations.push(animation);
    return animation;
  }

  const finalFrame = keyframes[keyframes.length - 1];

  Object.entries(finalFrame).forEach(([property, value]) => {
    element.style[property] = String(value);
  });

  return null;
}

function cancelAnimations(animations) {
  animations.forEach((animation) => {
    if (typeof animation?.cancel === "function") {
      animation.cancel();
    }
  });

  animations.length = 0;
}

function snapshotStyles(element, properties) {
  return properties.reduce((snapshot, property) => {
    snapshot[property] = element.style[property] || "";
    return snapshot;
  }, {});
}

function restoreStyles(element, snapshot) {
  Object.entries(snapshot).forEach(([property, value]) => {
    element.style[property] = value;
  });
}

function getElementComputedStyle(element) {
  if (typeof globalThis.getComputedStyle === "function") {
    return globalThis.getComputedStyle(element);
  }

  return element.style ?? {};
}

function shouldReduceMotion(config) {
  return (
    config.respectReducedMotion &&
    typeof globalThis.matchMedia === "function" &&
    globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function shuffle(items, randomFunction) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(randomFunction() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function readPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readNonNegativeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
