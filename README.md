# Atlas de la diagramación editorial

Landing page interactiva y modelo de datos JSON para estudiar cómo se organizan las páginas de revistas y periódicos, y cómo esas reglas se aplican a la generación de anuncios.

Incluye un **lector de PDF** con dos diagnósticos (geométrico y de organización visual con OCR), un **visor por capas** de la página, una **biblioteca de estilos** y exportadores a **XML** e **IDML** para InDesign. La página **Reconstrucción en InDesign** explica cómo reconstruir un documento completo desde su JSON y su XML (Biblioteca PDF + porky) y cómo esa reconstrucción actualiza el Atlas.

Síntesis de investigación elaborada a partir de la biblioteca **Creatividad** del proyecto MPI-DUAE.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `index.html` | Landing completa y autónoma. Incluye el JSON incrustado. |
| `diagramacion.json` | Modelo de datos: teorías, principios, patrones, formatos, matriz, checklist, glosario, fuentes y configuración del lector PDF. |
| `actualizar.mjs` | Sincroniza el JSON externo con la copia incrustada en `index.html`. |
| `vendor/` | Dependencias locales del lector PDF y del generador IDML (ver más abajo). |
| `flujos/` | Diagramas de flujo de trabajo (HTML interactivo + especificación JSON de archify): diseño editorial y lector con doble diagnóstico. |
| `revistas/` | Interpretación JSON de las dos revistas usadas para calibrar el lector (Computer Arts, mayo 2018; GQ USA, abril 2018): perfil, evaluación y lectura página por página. |
| `reconstruccion-indesign.html` | Landing de la reconstrucción en InDesign: funcionamiento, guía de uso, instrumentos JSON y XML, código de adaptación porky, protocolos XML de InDesign y procedimiento para actualizar el Atlas. |
| `reconstrucciones/` | Perfiles medidos de los documentos reconstruidos en InDesign (uno por documento, con las medidas de cada página). |
| `assets/indesign/` | Figuras de la landing: el formulario IRS 1040EZ (dominio público) reconstruido y superpuesto al original. |
| `assets/cargar-pdf.js` | Botón «Cargar PDF» (portada del Atlas, bloque de reconstrucciones y landing): abre la Biblioteca PDF en `http://localhost:8780` y, si su servidor está apagado, explica cómo encenderlo. El punto del botón es verde si responde y rojo si no. |
| `README.md` | Este documento. |

### Dependencias locales (`vendor/`)

| Archivo | Uso | Origen / licencia |
| --- | --- | --- |
| `pdf.min.js` | Lectura de PDF (pdf.js 3.11.174). | Mozilla pdf.js · Apache-2.0. |
| `pdf.worker.min.js` | Worker de pdf.js, cargado en el hilo principal. | Mozilla pdf.js · Apache-2.0. |
| `fflate.min.js` | Lectura y escritura del ZIP del IDML. | fflate 0.8.2 · MIT. |
| `idml-base.js` | Plantilla IDML vacía codificada en base64. | Derivada de SimpleIDML (BSD-3-Clause); estructura de documento en blanco, sin contenido editorial. |

Los scripts de `vendor/` se cargan **solo cuando hacen falta** (al subir el primer PDF o al exportar IDML), no al abrir la página.

## Cómo abrirla

1. Haz doble clic en `index.html` (Chrome, Edge o Firefox actualizados).
2. No necesita servidor ni instalación. Las tipografías web tienen sustituto local si no hay red.
3. El botón «Datos JSON ↓» descarga `diagramacion.json`.
4. Para el lector PDF, mantén la carpeta `vendor/` junto al HTML.

## Qué contiene la página

1. **Portada** con un esquema de primera plana.
2. **Teorías** (11): Bauhaus, escuela suiza, Gestalt, semiótica, diseño editorial moderno, constructivismo, Ulm, legibilidad, ideación publicitaria, leyes compositivas y ruptura.
3. **Principios** (14): jerarquía, contraste, equilibrio, proximidad, alineación, repetición, retícula, modularidad, espacio en blanco, proporción, unidad y variedad, punto focal, legibilidad y transgresión.
4. **Patrones** (25): 6 de periódico, 11 de revista y 8 de anuncio, con esquema SVG, retícula, recorrido de lectura y ficha ampliada. Cinco están marcados «corpus»: se midieron en revistas reales (página de texto a columnas, apertura a sangre, sumario, galería modular y anuncio a sangre).
5. **Anatomía** de una primera plana con llamadas interactivas.
6. **Configurador**: soporte, patrón, columnas, medianil, margen, densidad y equilibrio; previsualización y JSON en vivo.
7. **Lector PDF**: carga un archivo, elige el diagnóstico geométrico o el de organización visual (OCR), revisa la página en el visor por capas, corrige el tipo si hace falta, aplica los parámetros al configurador, guarda el estilo y exporta XML/IDML.
8. **Matriz** de objetivo → patrón, **auditoría** de 12 criterios y **biblioteca de fuentes** (22 archivos).

## Lector de PDF

### Flujo

1. Pulsa **Seleccionar PDF** o arrastra un archivo sobre la zona de carga.
2. El análisis se ejecuta en la pestaña: no se sube nada a ningún servidor.
3. El resultado muestra:
   - clasificación estimada (**Anuncio / Revista / Periódico**) con porcentajes de afinidad;
   - formato, proporción, columnas, cuerpo, titular, cobertura de imagen, texto y márgenes;
   - patrón de diagramación más cercano y alternativas;
   - parámetros propuestos para el configurador.
4. Puedes **corregir el tipo** con los botones inferiores. La clasificación es orientativa.
5. **Aplicar al configurador** traslada soporte, patrón, columnas, medianil, margen, densidad y equilibrio.
6. **Guardar en biblioteca** conserva la miniatura, las métricas, el patrón y la configuración.
7. **Ver XML** abre el código de intercambio; **Descargar IDML** genera el paquete de InDesign.

### Cómo se calcula

- Se leen hasta **5 páginas** y un máximo de **60 MB**. En documentos de 9 páginas o más (una revista entera) se leen la portada y cuatro páginas repartidas, porque las primeras suelen ser anuncios.
- Las **páginas aplanadas** (una imagen de página completa bajo la capa de texto, habitual en revistas digitales) no cuentan esa imagen como foto.
- Un **folio** con número de página o fecha en el borde indica página editorial.
- **Texto**: posiciones, tamaños, líneas y columnas a partir de la capa de texto (pdf.js).
- **Columnas**: se detectan canaletas por baja cobertura de líneas en la proyección horizontal.
- **Imágenes**: se estima su área a partir de las transformaciones de los operadores de dibujo.
- **Densidad**: caracteres por área de página.
- **Márgenes**: caja de texto normalizada.
- **Clasificación**: puntuaciones ponderadas de imagen, texto, columnas, densidad, titulares y páginas; se normalizan a porcentajes.

Este primer diagnóstico no usa OCR ni color. Un PDF escaneado sin capa de texto se detecta y se avisa: en ese caso solo se mide la geometría; el segundo diagnóstico lee su texto con OCR.

### Diagnóstico 2 · Organización visual (OCR)

Se abre con la pestaña **Organización visual · OCR** del resultado. Trabaja página a página (las mismas cinco del análisis) y mezcla cuatro fuentes:

| Fuente | Qué aporta |
| --- | --- |
| Capa de texto (pdf.js) | Texto exacto, posición y cuerpo de cada línea. |
| OCR (Tesseract.js, español) | El texto que el PDF no trae: titulares en curvas, texto dentro de imágenes, páginas escaneadas. Cada palabra lleva su confianza. |
| Operadores de imagen | Cajas de las imágenes colocadas en el PDF. |
| Raster de la página | Color de fondo, paleta dominante, zonas gráficas sin texto y proporción de aire. |

Con esa mezcla se calcula:

- **Bloques por rol**: cabecera, titular, subtítulo, cuerpo, cita, dato, CTA, pie o crédito, folio, imagen y marca.
- **Jerarquía tipográfica**: niveles de cuerpo (N1, N2…) y contraste titular/cuerpo.
- **Orden de lectura** por cortes XY, **recorrido** (columnas, Z, F, focal, vertical), **punto de entrada** y **peso visual** (equilibrio).
- **Mezcla de esquemas**: la página se compara zona por zona con los 25 patrones del atlas (similitud por clase con coeficiente de Dice). Cada bloque se atribuye al patrón que mejor lo explica, con preferencia por el esquema global dominante; el resultado es un reparto en porcentajes («Portada de revista 64 % + Infografía 19 % + …»). Los bloques que ningún patrón explica se marcan como **ruptura**.
- **Lectura completa**: todos los bloques en orden de lectura con rol, cuerpo, fuente y confianza. Se puede copiar o descargar como JSON (incluye las palabras del OCR).

El OCR se ejecuta al abrir la pestaña. La primera vez descarga el motor y el modelo de español (unos 4 MB) desde jsDelivr; requiere conexión. El PDF no se sube: el reconocimiento ocurre en el navegador. Si el OCR no puede cargarse, la lectura sigue con la capa de texto, las imágenes y el raster.

### Visor por capas

Debajo del resultado aparece la página ampliada con capas activables:

| Capa | Muestra |
| --- | --- |
| Página PDF | El raster de la página, con opacidad regulable. |
| Retícula detectada | Márgenes y columnas medidos. |
| Capa de texto | Las líneas que trae el PDF. |
| Palabras OCR | Cada palabra coloreada por confianza (verde alta, ámbar media, rojo baja). |
| Bloques por rol | Bloques coloreados por rol, con etiqueta. Al hacer clic se ve su lectura. |
| Orden de lectura y peso | Recorrido numerado y centro de peso visual. |
| Esquema asociado | El patrón elegido, superpuesto a escala. |
| Mezcla de esquemas | Bloques coloreados por el patrón que los explica y el contorno de cada patrón de la mezcla. |

Las vistas rápidas **Lectura**, **Esquema**, **Mezcla** y **OCR** combinan capas. Hay encuadre a ancho o a página, zoom y pantalla completa.

## Calibración con revistas reales

Los parámetros del lector se ajustaron con dos revistas de la carpeta Revistas, elegidas porque representan las dos vías de lectura:

| Revista | Páginas | Vía | Muestra |
| --- | --- | --- | --- |
| Computer Arts · mayo 2018 (UK) | 100 | capa de texto sobre páginas aplanadas | 30 de ajuste + 10 de control |
| GQ USA · abril 2018 | 148 | raster: muchas páginas sin capa de texto (anuncios, moda) | 25 de ajuste + 10 de control |

**Método.** Cada página de la muestra se interpretó a mano: tipo (portada, editorial, anuncio) y qué patrones del atlas describen su forma. Un patrón es aceptable si su disposición de bloques coincide con la estructura principal de la página, sea cual sea su categoría. Después se leyó con el propio Atlas y se compararon ambos. Las páginas de *control* se etiquetaron antes de ver la lectura y no se usaron para ajustar.

**Resultado (esquema dominante correcto).**

| | Antes | Ajuste | Control |
| --- | --- | --- | --- |
| Computer Arts | 7 % (2/30) | 67 % (20/30) | 50 % (5/10) |
| GQ USA | 4 % (1/25) | 64 % (16/25) | 40 % (4/10) |

Tipo de pieza correcto: Computer Arts 57 % → 80 % (control 70 %); GQ 48 % → 60 % (control 70 %). En roles, sobre las páginas de ajuste de Computer Arts: capitulares 0/4 → 4/4, pies de página 0/23 → 23/23, cintillos de sección 4/23 → 23/23.

**Qué se ajustó** (valores en `diagramacion.json → pdf.calibracion`, que el lector lee al arrancar):

- *Páginas aplanadas*: la imagen de página completa solo cuenta como foto a sangre si el fondo es oscuro o de color impreso, o si llena la página y toca los cuatro bordes. El papel se estima en el borde de la página y se rellena antes la franja negra de sangrado que dejan algunas revistas digitales.
- *Roles*: capitular (letra sola muy grande), cita destacada (texto mayor que el cuerpo, entre columnas), folio y cintillo en la banda del borde antes que subtítulo, texto sobreimpreso leído una sola vez.
- *Imágenes*: rejilla raster de 100 columnas para separar las fotos de una galería; el texto sobre una foto no la parte en dos.
- *Mezcla de esquemas*: similitud por clase (Dice) para que un patrón «todo imagen» no explique cualquier página con fotos; señales de página: folio con número o fecha (editorial), foto a sangre sin folio y casi sin texto (anuncio), portada solo en la página 1, sumario solo con números de página.
- *Patrones nuevos*: las cinco formas del corpus que el atlas no tenía.

**Límites.** La precisión en páginas nuevas (40–50 %) es menor que en las de ajuste: hay sobreajuste y las dos revistas no representan todos los estilos. Las fotos de moda a sangre sin texto no se distinguen de un anuncio. Los anuncios con producto sobre fondo blanco tienden a leerse como «Antes y después». Para más precisión, conviene ampliar el corpus con más revistas y repetir el ajuste.

## Reconstrucciones en InDesign

La Biblioteca PDF (`C:\Users\Mario\pdf-biblioteca`) extrae el JSON de un PDF con pdf2json, lee con OCR las páginas que son imagen y genera un paquete para reconstruir el documento en InDesign con la librería porky. El detalle está en `reconstruccion-indesign.html`; en resumen:

1. `npm run cli -- indesign <id> --paginas 1-8 --salida <carpeta>` genera el paquete: `datos/plan.json` (geometría y formato en puntos), `datos/documento.xml` (contenido con `aid:pstyle`), `datos/atlas-indesign.dtd`, el PDF original y los scripts.
2. En InDesign, `reconstruir.jsx` crea el documento con seis capas, importa y valida el XML y guarda en `salida/` el `.indd`, el `.idml`, el XML exportado, vistas JPG e `informe.json`.
3. `npm run cli -- atlas <id> --atlas "<esta carpeta>" --informe "<paquete>/salida/informe.json"` incorpora el resultado al Atlas:
   - escribe `reconstrucciones/<id>.json` con el perfil medido y las medidas de cada página;
   - añade o sustituye la entrada en `diagramacion.json → pdf.reconstrucciones` (guarda antes `diagramacion.json.bak`);
   - ejecuta `node actualizar.mjs`.

El lector PDF muestra esas entradas en el bloque **Reconstrucciones en InDesign**, debajo de la calibración. Van en una lista aparte de `pdf.corpus` porque son mediciones automáticas (formato, cuerpo base, escala tipográfica, columnas y márgenes estimados) y no tienen la interpretación ni la evaluación manual de las revistas de calibración.

```json
"reconstrucciones": [
  {
    "id": "american-frontiersman-winter-2020-usa-02ffa774",
    "titulo": "American Frontiersman - Winter 2020 USA",
    "archivo_json": "reconstrucciones/american-frontiersman-winter-2020-usa-02ffa774.json",
    "fecha": "2026-10-24",
    "perfil": { "formato_mm": "277 × 364", "cuerpo_base_pt": 12, "columnas_texto": 3, "escala_pt": { "titular": 30, "cuerpo": 12 } },
    "indesign": { "version": "21.1.0.56", "paginas": [1, 2, 3, 10], "validacion_dtd": "0 errores" }
  }
]
```

## Biblioteca de estilos

- Se guarda en `localStorage` con la clave `atlas-pdf-library-v2`.
- Máximo 16 estilos; cada uno conserva miniatura JPEG, métricas, patrón, configuración y fecha.
- **Exportar JSON** descarga la biblioteca sin miniaturas.
- **Vaciar** borra la biblioteca de este navegador.
- Si el almacenamiento local se llena, la aplicación conserva la sesión y elimina las miniaturas.

## Exportación XML

El XML es un formato de intercambio documentado, no un formato nativo de InDesign:

```xml
<AtlasLayout version="1.0" ...>
  <Document ... widthPt="595" heightPt="842" soporte="revista" patron="portada-revista">
    <Classification anuncio="0" revista="100" periodico="0" result="revista" />
    <Grid columns="2" gutter="10" marginTop="32" ... />
    <Metrics ratio="0.71" columns="2" bodySize="9" ... />
    <Styles>...</Styles>
    <Frames>
      <Frame id="F1" type="imagen" x="0" y="0" width="595" height="842" text="IMAGEN" />
      ...
    </Frames>
  </Document>
</AtlasLayout>
```

Sirve para reconstruir la maqueta por script, como documentación o como entrada para un conversor propio.

Si la página tiene lectura visual, el XML añade un bloque `<VisualReading>` con la mezcla de esquemas, la paleta y cada bloque leído (rol, caja en puntos, cuerpo, fuente, confianza OCR, esquema atribuido y texto).

## Exportación IDML

El IDML se genera a partir de una plantilla de documento en blanco y contiene:

- tamaño de página del PDF analizado;
- márgenes, número de columnas y canaletas;
- un marco de texto por bloque del patrón, con su contenido de ejemplo y estilo directo;
- una historia por marco;
- clases de párrafo básicas y referencias a las fuentes Minion Pro.

Es una **maqueta de referencia**: al abrirla en InDesign revisa fuentes instaladas, estilos, desbordes y tamaños. Los bloques de imagen se representan como marcos de texto con la etiqueta `IMAGEN` para que puedas sustituirlos por marcos gráficos.

## Estructura del JSON

```json
{
  "meta": { "titulo": "...", "version": "1.1.0", "fecha": "...", "resumen": "..." },
  "teorias": [ { "id": "bauhaus", "nombre": "...", "sintesis": "...", "editorial": [], "publicidad": [], "principios": [], "fuentes": [] } ],
  "principios": [ { "id": "jerarquia", "nombre": "...", "definicion": "...", "en_pagina": "...", "en_anuncio": "...", "error": "..." } ],
  "patrones": [ { "id": "primera-plana", "categoria": "periodico", "ratio": 0.70, "columnas": 6, "lectura": "...", "bloques": [], "specs": {}, "principios": [], "teorias": [], "fuentes": [] } ],
  "formatos": [ { "id": "f01", "soporte": "periodico", "medidas": "289 × 380 mm", "patrones": [] } ],
  "matriz": [ { "objetivo": "...", "soporte": "...", "patrones": [], "criterio": "..." } ],
  "checklist": [ { "criterio": "...", "nivel": "imprescindible", "como": "..." } ],
  "glosario": [ { "termino": "mancha", "definicion": "..." } ],
  "fuentes": [ { "id": "s01", "archivo": "...", "titulo": "...", "autor": "...", "aporte": "...", "uso": "directo" } ],
  "config": { "presets": [], "opciones": {} },
  "pdf": { "max_paginas": 5, "clasificacion": [], "biblioteca": {}, "exportacion": {} }
}
```

### Cómo se dibuja un patrón

Cada patrón guarda una lista de `bloques` que la página convierte en SVG:

```json
{ "t": "titular", "x": 4, "y": 20, "w": 64, "h": 15, "n": 3, "rot": 0 }
```

- El ancho de página siempre es `100`; la altura es `100 / ratio`.
- `x`, `y`, `w`, `h` están en esas unidades relativas.
- Tipos disponibles: `masthead`, `titular`, `texto`, `imagen`, `publicidad`, `cita`, `filete`, `lineav`, `cta`, `logo`, `dato`, `grafico`, `marco`, `folio`, `vgrid`.
- `n` indica el número de líneas de un bloque de texto; `rot` permite rotar imágenes en grados.

Para añadir un patrón: copia un objeto de `patrones`, cambia `id`, `nombre`, `categoria`, `ratio` y `bloques`, y ejecuta `node actualizar.mjs`.

## Configurador

El panel emite un objeto reutilizable:

```json
{
  "version": "1.0",
  "soporte": "periodico",
  "patron": "primera-plana",
  "reticula": { "columnas": 6, "medianil": 3, "margen": 4, "lineas_de_flujo": 8 },
  "composicion": { "densidad": "media", "equilibrio": "asimetrico", "lectura": "descendente en F" },
  "tipografia": { "familias": 2, "escala": 1.333 },
  "teoria": "editorial-moderno",
  "principios": ["jerarquia", "punto-focal", "reticula", "proximidad"]
}
```

No son medidas de imprenta: son proporciones relativas a la caja de página, pensadas como punto de partida.

## Método y límites

- Las fichas **sintetizan** las fuentes; no son citas literales. Los esquemas son reconstrucciones analíticas y no reproducen páginas de las obras.
- La columna `uso` de las fuentes distingue **directo** (aportó conceptos), **contextual** (marco o término) y **no aplicado** (fuera del alcance).
- El archivo `Making Comics` está truncado y se usa solo como referencia de ritmo y secuencia.
- Hay un archivo duplicado del diccionario; se conserva para que el inventario coincida con la carpeta original.
- La clasificación del PDF es **heurística**: depende de la capa de texto y de la geometría, no comprende el contenido editorial.
- Los roles, la jerarquía, el recorrido y la mezcla de esquemas también son **estimaciones**: se basan en tamaños, posiciones y la comparación con los 25 patrones, no en el sentido del texto.
- El OCR necesita conexión la primera vez (motor y modelo desde jsDelivr). Sin conexión, el segundo diagnóstico funciona con la capa de texto, las imágenes y el raster.
- El IDML es una **plantilla de referencia**; no garantiza una apertura sin ajustes en todas las versiones de InDesign.
- Las dependencias de `vendor/` son locales para que el lector funcione sin conexión.

## Mantenimiento

Después de editar `diagramacion.json`:

```bash
node actualizar.mjs
```

Esto vuelve a incrustar el JSON en `index.html`. La página no usa `fetch` para los datos: sigue funcionando abierta como archivo local.

## Repositorio y GitHub Pages

Esta carpeta es un repositorio git propio (rama `main`), pensado para publicarse en GitHub como `atlas-diagramacion` y verse en línea con GitHub Pages (Settings › Pages › Deploy from a branch › `main` / `/ (root)`). Como el Atlas es estático, en Pages funcionan todas sus secciones, incluido el lector PDF.

`.gitignore` deja fuera el material de trabajo que no se publica: `Archivos/`, `_idmlref/`, `_pdftest/`, las capturas de las pruebas del lector (`pdf-*.png`, `lib-final.png`, `xml-final.png`), archivos sueltos de otros experimentos que el Atlas no usa y las copias `*.bak`. Siguen en tu equipo; solo no se suben.

El botón «Cargar PDF» abre la Biblioteca PDF en `http://localhost:8780`: desde GitHub Pages solo funciona para quien la tenga encendida en su propio equipo (repositorio: <https://github.com/Mario55666/pdf-biblioteca>); los demás ven el aviso de cómo encenderla.

Para publicar cambios: `git add -A`, `git commit -m "…"` y `git push`, o «Push origin» en GitHub Desktop.

## Créditos

- pdf.js: Mozilla, Apache-2.0.
- Tesseract.js 5.1.1 y modelo de español (`@tesseract.js-data/spa`): Apache-2.0; se cargan desde jsDelivr solo al usar el OCR.
- Diagramas de `flujos/`: generados con archify.
- fflate: Arjun Barrett, MIT.
- Plantilla IDML base: estructura derivada de SimpleIDML (Stanislas Guerra), BSD-3-Clause; se distribuye únicamente como documento en blanco.
- Tipografías web: Fraunces, Inter y JetBrains Mono vía Google Fonts, con sustituto local.
