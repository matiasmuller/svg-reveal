import { animateSvg, parseSvgString } from "../src/index.js";

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
  loadAndAnimateSvg(lastSvgSource);
});

replayButton.addEventListener("click", () => {
  if (lastSvgSource) {
    loadAndAnimateSvg(lastSvgSource);
  }
});

durationInput.addEventListener("change", replayIfPossible);
letterPercentInput.addEventListener("change", replayIfPossible);

function replayIfPossible() {
  if (lastSvgSource) {
    loadAndAnimateSvg(lastSvgSource);
  }
}

function loadAndAnimateSvg(source) {
  try {
    const importedSvg = parseSvgString(source, { document });

    stage.replaceChildren(importedSvg);
    replayButton.disabled = false;

    requestAnimationFrame(() => {
      const seconds = readPositiveNumber(durationInput, 4);
      const textRenderRatio = readPercentNumber(letterPercentInput, 20) / 100;
      const result = animateSvg(importedSvg, {
        duration: seconds * 1000,
        textRenderRatio
      });

      statusNode.textContent = [
        `${result.segmentCount} segmentos`,
        `${result.textCount} textos`,
        `Xt ${result.xt.toFixed(1)}`,
        `V ${result.velocity.toFixed(3)} u/ms`
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
