import { parseSvgString, revealSvg } from "../src/index.js";

const fileInput = document.querySelector("#svgFile");
const durationInput = document.querySelector("#duration");
const letterPercentInput = document.querySelector("#letterPercent");
const replayButton = document.querySelector("#replay");
const statusNode = document.querySelector("#status");
const stage = document.querySelector("#stage");

let lastSvgSource = "";

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  lastSvgSource = await file.text();
  loadAndRevealSvg(lastSvgSource);
});

replayButton.addEventListener("click", () => {
  if (lastSvgSource) {
    loadAndRevealSvg(lastSvgSource);
  }
});

durationInput.addEventListener("change", replayIfPossible);
letterPercentInput.addEventListener("change", replayIfPossible);

function replayIfPossible() {
  if (lastSvgSource) {
    loadAndRevealSvg(lastSvgSource);
  }
}

function loadAndRevealSvg(source) {
  try {
    const importedSvg = parseSvgString(source);

    stage.replaceChildren(importedSvg);
    replayButton.disabled = false;

    requestAnimationFrame(() => {
      const seconds = readPositiveNumber(durationInput, 4);
      const textRenderRatio = readPercentNumber(letterPercentInput, 20) / 100;
      const reveal = revealSvg(importedSvg, {
        duration: seconds * 1000,
        textRenderRatio
      });
      reveal.play();

      statusNode.textContent = [
        `${reveal.segmentCount} segmentos`,
        `${reveal.textCount} textos`,
        `Xt ${reveal.xt.toFixed(1)}`,
        `V ${reveal.velocity.toFixed(3)} u/ms`
      ].join(" - ");
    });
  } catch (error) {
    statusNode.textContent = error.message;
    replayButton.disabled = true;
  }
}

function readPositiveNumber(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readPercentNumber(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) ? clamp(value, 0, 100) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
