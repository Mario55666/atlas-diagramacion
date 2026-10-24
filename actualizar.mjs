import { readFileSync, writeFileSync } from "node:fs";

const jsonPath = new URL("./diagramacion.json", import.meta.url);
const htmlPath = new URL("./index.html", import.meta.url);

const data = JSON.parse(readFileSync(jsonPath, "utf8"));
let html = readFileSync(htmlPath, "utf8");

const marker = '<script type="application/json" id="atlas-data">';
const start = html.indexOf(marker);
const end = html.indexOf("</script>", start + marker.length);

if (start < 0 || end < 0) {
  console.error("No se encontró el bloque de datos en index.html.");
  process.exit(1);
}

const minified = JSON.stringify(data);
html = html.slice(0, start + marker.length) + minified + html.slice(end);
writeFileSync(htmlPath, html, "utf8");

console.log("JSON actualizado: " + minified.length + " caracteres incrustados.");
console.log("Patrones: " + data.patrones.length + " · Teorías: " + data.teorias.length + " · Fuentes: " + data.fuentes.length);
