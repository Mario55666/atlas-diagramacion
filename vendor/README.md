# Dependencias locales

Estos archivos permiten que el lector de PDF y la exportación IDML funcionen sin conexión y sin subir documentos a ningún servidor.

| Archivo | Versión | Licencia | Origen |
| --- | --- | --- | --- |
| `pdf.min.js` | pdf.js 3.11.174 | Apache-2.0 | https://github.com/mozilla/pdf.js |
| `pdf.worker.min.js` | pdf.js 3.11.174 | Apache-2.0 | https://github.com/mozilla/pdf.js |
| `fflate.min.js` | fflate 0.8.2 | MIT | https://github.com/101arrowz/fflate |
| `idml-base.js` | plantilla propia | BSD-3-Clause (base) | Derivada de la estructura de SimpleIDML, de Stanislas Guerra: https://github.com/Starou/SimpleIDML |

## Notas

- `pdf.worker.min.js` se carga en el hilo principal para que pdf.js funcione desde `file://` sin un worker externo.
- `idml-base.js` contiene una plantilla IDML vacía en base64. No incluye contenido editorial ni recursos de las obras citadas.
- Los textos completos de las licencias están en los repositorios de origen. Si redistribuyes esta carpeta, conserva esta nota de atribución.
