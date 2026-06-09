const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export const DEFAULT_ANIMATION_OPTIONS = {
  duration: 4000,
  textRenderRatio: 0.2,
  minSegmentLength: 0.5,
  minSegmentDuration: 80,
  fillFadeDuration: 180,
  random: Math.random
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

  const parser = new DOMParser();
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

export function animateSvg(svg, options = {}) {
  const config = normalizeOptions(options);
  const segments = collectDrawableSegments(svg, config);
  const textData = prepareSvgTexts(svg);
  const orderedSegments = [...segments].sort((a, b) => b.length - a.length);
  const longest = orderedSegments[0];
  const secondLongest = orderedSegments[1];
  const xt = longest ? longest.length * 1.05 : 1;
  const velocity = xt / config.duration;
  const animations = [];

  scheduleLineDrawing(orderedSegments, secondLongest, config, velocity, animations);
  scheduleTextDrawing(textData, config, animations);

  return {
    segmentCount: segments.length,
    textCount: textData.length,
    xt,
    velocity,
    animations
  };
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
    textRenderRatio,
    minSegmentLength: readPositiveNumber(
      options.minSegmentLength,
      DEFAULT_ANIMATION_OPTIONS.minSegmentLength
    ),
    minSegmentDuration: readPositiveNumber(
      options.minSegmentDuration,
      DEFAULT_ANIMATION_OPTIONS.minSegmentDuration
    ),
    fillFadeDuration: readPositiveNumber(
      options.fillFadeDuration,
      DEFAULT_ANIMATION_OPTIONS.fillFadeDuration
    ),
    random: typeof options.random === "function"
      ? options.random
      : DEFAULT_ANIMATION_OPTIONS.random
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
      fillOpacity: setupStrokeDrawing(segment.element, segment.length)
    }));
}

function setupStrokeDrawing(element, length) {
  element.style.strokeDasharray = String(length);
  element.style.strokeDashoffset = String(length);

  if (!element.style.strokeLinecap) {
    element.style.strokeLinecap = "round";
  }

  if (!element.style.strokeLinejoin) {
    element.style.strokeLinejoin = "round";
  }

  const computed = getComputedStyle(element);
  const hasVisibleStroke = computed.stroke && computed.stroke !== "none";

  if (!hasVisibleStroke) {
    element.style.stroke = computed.fill && computed.fill !== "none"
      ? computed.fill
      : "currentColor";
  }

  const fillOpacity = Number.parseFloat(computed.fillOpacity || "1");
  const hasVisibleFill = computed.fill && computed.fill !== "none" && fillOpacity > 0;

  if (hasVisibleFill) {
    element.style.fillOpacity = "0";
    return fillOpacity;
  }

  return null;
}

function scheduleLineDrawing(segments, secondLongest, config, velocity, animations) {
  if (!segments.length) {
    return;
  }

  const longest = segments[0];
  const rest = segments.slice(1);
  const drawLongestFirst = !secondLongest || config.random() < 0.5;
  const durationFor = (segment) => Math.max(config.minSegmentDuration, segment.length / velocity);

  if (drawLongestFirst) {
    animateSegment(longest, 0, durationFor(longest), config, animations);

    if (secondLongest) {
      const duration = durationFor(secondLongest);
      animateSegment(secondLongest, Math.max(0, config.duration - duration), duration, config, animations);
    }
  } else {
    const duration = durationFor(longest);
    animateSegment(rest[0], 0, durationFor(rest[0]), config, animations);
    animateSegment(longest, Math.max(0, config.duration - duration), duration, config, animations);
  }

  const alreadyScheduled = new Set([
    longest?.element,
    secondLongest?.element
  ]);

  const distributed = shuffle(
    segments.filter((segment) => !alreadyScheduled.has(segment.element)),
    config.random
  );
  const count = distributed.length;

  distributed.forEach((segment, index) => {
    const duration = durationFor(segment);
    const maxStart = Math.max(0, config.duration - duration);
    const slotWidth = maxStart / Math.max(1, count);
    const slotCenter = slotWidth * (index + 0.5);
    const jitter = (config.random() - 0.5) * slotWidth * 0.75;
    const delay = clamp(slotCenter + jitter, 0, maxStart);

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

  return { text, characters };
}

function scheduleTextDrawing(textData, config, animations) {
  const maxCharacters = Math.max(0, ...textData.map((data) => data.characters.length));

  if (!maxCharacters) {
    return;
  }

  const letterStep = Math.max(20, (config.duration * config.textRenderRatio) / maxCharacters);
  const fadeDuration = Math.min(450, Math.max(80, letterStep * 0.8));

  textData.forEach((data) => {
    const jitter = (config.random() - 0.5) * letterStep;
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
          delay: start + (index * letterStep),
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

function shuffle(items, random) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function readPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
