<a id="english"></a>

# SVG Reveal

[Español](#espanol)

Small JavaScript utility for progressively revealing SVG drawings made of lines and strokes.

The package is intentionally focused: it is meant for line-based SVG illustrations, diagrams, icons, and technical drawings. It is not trying to replace general animation libraries.

> Project status: early prototype. The current API is usable, but still evolving before a stable release.

## Installation

```bash
npm install svg-reveal
```

## Usage

```js
import { parseSvgString, revealSvg } from "svg-reveal";

const svg = parseSvgString(svgSource);
document.querySelector("#stage").replaceChildren(svg);

const reveal = revealSvg(svg, {
  duration: 4000,
  textRenderRatio: 0.2
});

reveal.play();

console.log(reveal.segmentCount, reveal.textCount);
```

You can also animate any existing `SVGSVGElement` in the DOM:

```js
import { revealSvg } from "svg-reveal";

const reveal = revealSvg(document.querySelector("svg"), {
  duration: 2500
});

reveal.play();
```

## API

### `revealSvg(svg, options)`

Prepares `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect`, and `text` nodes for progressive reveal.

Main options:

- `duration`: total duration in milliseconds. Defaults to `4000`.
- `delay`: delay before the reveal starts, in milliseconds. Defaults to `0`.
- `textRenderRatio`: proportion of the time dedicated to letter reveal. Defaults to `0.2`.
- `minSegmentLength`: ignores segments shorter than this length. Defaults to `0`.
- `minSegmentDuration`: minimum duration for a segment. Defaults to `0`.
- `fillFadeDuration`: fill fade duration. Defaults to `180`.
- `autoPlay`: starts immediately after setup. Defaults to `false`.
- `preserveExistingStyles`: restores original inline styles on `destroy()`. Defaults to `true`.
- `respectReducedMotion`: finishes immediately when the user prefers reduced motion. Defaults to `true`.
- `randomFunction`: `Math.random`-compatible function, useful for deterministic tests.

Returns a controller with:

- `play()`: starts or restarts the reveal.
- `reset()`: returns the SVG to the prepared hidden state.
- `finish()`: shows the final revealed state.
- `destroy()`: cancels animations and restores original inline styles and text content.
- `segmentCount`, `textCount`, `xt`, `velocity`, and `animations`.

### `parseSvgString(source, options)`

Parses SVG text and returns an `SVGSVGElement` imported into the target `document`.

Options:

- `document`: target document. Defaults to `globalThis.document`.
- `removeDimensions`: removes `width` and `height` for responsive layouts. Defaults to `true`.
- `ariaLabel`: accessible label applied to the SVG. Defaults to `"SVG animado"`.

In browsers, `parseSvgString(svgSource)` is usually enough. Pass `document` only when parsing into a specific document, such as an iframe or a test DOM.

## Development

```bash
npm run check
npm run playground
```

`npm run check` runs the dependency-free tests and rebuilds the distributable files.

## Limitations

- Dashed strokes can conflict with the stroke reveal technique because both use `stroke-dasharray`.
- Complex SVGs exported from design tools may need cleanup before they animate well.
- The package mutates inline SVG styles while active. Call `destroy()` to restore original inline styles and text content.
- Text nodes are split into `tspan` characters while active; `destroy()` restores the original text content.
- The core package direction is SVG stroke reveal. Text animation remains secondary.
- The package does not aim to replace other general animation libraries.

<a id="espanol"></a>

# SVG Reveal en español

[English](#english)

Pequeña utilidad JavaScript para revelar progresivamente dibujos SVG hechos con líneas y trazos.

El paquete mantiene un foco intencional: está pensado para ilustraciones SVG basadas en líneas, diagramas, iconos y dibujos técnicos. No intenta reemplazar librerías generales de animación.

> Estado del proyecto: prototipo temprano. La API actual es usable, pero todavia puede evolucionar antes de una version estable.

## Instalacion

```bash
npm install svg-reveal
```

## Uso

```js
import { parseSvgString, revealSvg } from "svg-reveal";

const svg = parseSvgString(svgSource);
document.querySelector("#stage").replaceChildren(svg);

const reveal = revealSvg(svg, {
  duration: 4000,
  textRenderRatio: 0.2
});

reveal.play();

console.log(reveal.segmentCount, reveal.textCount);
```

También puedes animar cualquier `SVGSVGElement` existente en el DOM:

```js
import { revealSvg } from "svg-reveal";

const reveal = revealSvg(document.querySelector("svg"), {
  duration: 2500
});

reveal.play();
```

## API

### `revealSvg(svg, options)`

Prepara nodos `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect` y `text` para revelarlos progresivamente.

Opciones principales:

- `duration`: duracion total en milisegundos. Por defecto es `4000`.
- `delay`: demora antes de que empiece el revelado, en milisegundos. Por defecto es `0`.
- `textRenderRatio`: proporcion del tiempo dedicada a revelar letras. Por defecto es `0.2`.
- `minSegmentLength`: ignora segmentos mas cortos que esta longitud. Por defecto es `0`.
- `minSegmentDuration`: duracion minima para un segmento. Por defecto es `0`.
- `fillFadeDuration`: duracion del fundido del relleno. Por defecto es `180`.
- `autoPlay`: empieza inmediatamente despues de preparar el SVG. Por defecto es `false`.
- `preserveExistingStyles`: restaura los estilos inline originales al llamar `destroy()`. Por defecto es `true`.
- `respectReducedMotion`: termina inmediatamente cuando el usuario prefiere movimiento reducido. Por defecto es `true`.
- `randomFunction`: funcion compatible con `Math.random`, util para tests deterministas.

Devuelve un controlador con:

- `play()`: inicia o reinicia el revelado.
- `reset()`: devuelve el SVG al estado oculto preparado.
- `finish()`: muestra el estado final revelado.
- `destroy()`: cancela animaciones y restaura los estilos inline y el contenido de texto originales.
- `segmentCount`, `textCount`, `xt`, `velocity` y `animations`.

### `parseSvgString(source, options)`

Parsea texto SVG y devuelve un `SVGSVGElement` importado en el `document` destino.

Opciones:

- `document`: documento destino. Por defecto es `globalThis.document`.
- `removeDimensions`: elimina `width` y `height` para layouts responsivos. Por defecto es `true`.
- `ariaLabel`: etiqueta accesible aplicada al SVG. Por defecto es `"SVG animado"`.

En navegadores, `parseSvgString(svgSource)` suele ser suficiente. Pasa `document` solo cuando necesites parsear en un documento especifico, como un iframe o un DOM de tests.

## Desarrollo

```bash
npm run check
npm run playground
```

`npm run check` ejecuta los tests sin dependencias y reconstruye los archivos distribuibles.

## Limitaciones

- Los trazos discontinuos pueden entrar en conflicto con la tecnica de revelado porque ambos usan `stroke-dasharray`.
- Los SVG complejos exportados desde herramientas de diseno pueden necesitar limpieza antes de animarse bien.
- El paquete muta estilos inline del SVG mientras esta activo. Llama `destroy()` para restaurar los estilos inline y el contenido de texto originales.
- Los nodos de texto se dividen en caracteres `tspan` mientras estan activos; `destroy()` restaura el contenido de texto original.
- La direccion principal del paquete es revelar trazos SVG. La animacion de texto sigue siendo secundaria.
- El paquete no intenta reemplazar otras librerias generales de animacion.
