# SVG Reveal

Libreria JavaScript para revelar SVGs con trazado progresivo de lineas y textos letra por letra.

## Uso

```js
import { animateSvg, parseSvgString } from "svg-reveal";

const svg = parseSvgString(svgSource, { document });
document.querySelector("#stage").replaceChildren(svg);

const result = animateSvg(svg, {
  duration: 4000,
  textRenderRatio: 0.2
});

console.log(result.segmentCount, result.textCount);
```

Tambien se puede animar cualquier `SVGSVGElement` que ya exista en el DOM:

```js
import { animateSvg } from "svg-reveal";

animateSvg(document.querySelector("svg"), {
  duration: 2500
});
```

## API

### `animateSvg(svg, options)`

Anima `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect` y nodos `text`.

Opciones principales:

- `duration`: duracion total en milisegundos. Por defecto `4000`.
- `textRenderRatio`: proporcion del tiempo dedicada al revelado de letras. Por defecto `0.2`.
- `minSegmentLength`: ignora segmentos menores a este largo. Por defecto `0.5`.
- `minSegmentDuration`: duracion minima de un segmento. Por defecto `80`.
- `fillFadeDuration`: duracion del fade del relleno. Por defecto `180`.
- `random`: funcion compatible con `Math.random`, util para pruebas deterministas.

Devuelve un resumen con `segmentCount`, `textCount`, `xt`, `velocity` y `animations`.

### `parseSvgString(source, options)`

Parsea texto SVG y devuelve un `SVGSVGElement` importado en el `document` destino.

Opciones:

- `document`: documento destino. Por defecto usa `globalThis.document`.
- `removeDimensions`: elimina `width` y `height` para facilitar layouts responsivos. Por defecto `true`.
- `ariaLabel`: etiqueta accesible aplicada al SVG. Por defecto `"SVG animado"`.

## Playground

El prototipo quedo como playground de desarrollo en `playground/index.html`. No se incluye en el paquete publicado porque `package.json` limita los archivos con `files`.

## Desarrollo

```bash
npm run build
```
