/*
    Botón «Cargar PDF» · abre la Biblioteca PDF (pdf2json → JSON → XML) en una pestaña nueva.

    Uso: cualquier enlace con el atributo data-cargar-pdf.
        <a href="http://localhost:8780/" data-cargar-pdf>Cargar PDF</a>
    Atributos opcionales: data-biblioteca (dirección del servidor) y data-carpeta (carpeta del
    proyecto, para el aviso).

    Antes de abrir comprueba que el servidor responde pidiendo su icono como imagen: así funciona
    también con la página abierta como archivo (file://), donde fetch no puede leer otro origen.
    Si no responde, muestra cómo encenderlo. Los botones llevan data-estado
    ("comprobando", "encendida" o "apagada") para mostrar un punto de color.
*/
(function () {
    var URL_POR_DEFECTO = "http://localhost:8780/";
    var CARPETA_POR_DEFECTO = "C:\\Users\\Mario\\pdf-biblioteca";
    var ESPERA_MS = 2500;

    var estilos = document.createElement("style");
    estilos.textContent = [
        "[data-cargar-pdf]::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:8px;vertical-align:1px;background:#b9ae9b;flex:0 0 auto}",
        "[data-cargar-pdf][data-estado='encendida']::before{background:#2f8f5b}",
        "[data-cargar-pdf][data-estado='apagada']::before{background:#c23b2b}",
        ".cp-aviso{position:fixed;z-index:300;right:clamp(12px,3vw,32px);bottom:clamp(12px,3vw,32px);width:min(440px,calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;background:var(--paper,#f4efe4);color:var(--ink,#15120e);border:1px solid var(--ink,#15120e);box-shadow:0 24px 48px -24px rgba(21,18,14,.55);padding:20px 22px 18px;font:14px/1.55 var(--sans,system-ui,sans-serif)}",
        ".cp-aviso[hidden]{display:none}",
        ".cp-aviso h2{font-family:var(--serif,Georgia,serif);font-weight:500;font-size:22px;line-height:1.15;letter-spacing:-.02em;margin:0 0 8px}",
        ".cp-aviso p{margin:0 0 10px;color:var(--ink-2,#302a22)}",
        ".cp-aviso ol{margin:0 0 12px;padding-left:20px;list-style:decimal;display:grid;gap:6px}",
        ".cp-aviso code{font-family:var(--mono,Consolas,monospace);font-size:12px;background:var(--paper-2,#ece4d3);border:1px solid var(--line-soft,#ddd2bf);padding:1px 5px;overflow-wrap:anywhere}",
        ".cp-comando{display:flex;align-items:center;gap:8px;background:#1b1813;color:#efe7d6;font:12.5px/1.4 var(--mono,Consolas,monospace);padding:8px 8px 8px 12px;margin-top:4px}",
        ".cp-comando span{flex:1}",
        ".cp-aviso button{font:inherit;cursor:pointer}",
        ".cp-copiar{border:1px solid #4a4236;background:#2a251e;color:#efe7d6;font-family:var(--mono,Consolas,monospace)!important;font-size:9px!important;letter-spacing:.1em;text-transform:uppercase;padding:5px 8px}",
        ".cp-nota{font-size:12px!important;color:var(--muted,#6f6558)!important}",
        ".cp-acciones{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}",
        ".cp-acciones button{border:1px solid var(--ink,#15120e);border-radius:999px;padding:9px 16px;font-size:13px;background:transparent;color:var(--ink,#15120e)}",
        ".cp-acciones .cp-reintentar{background:var(--ink,#15120e);color:var(--paper,#f4efe4)}",
        ".cp-acciones .cp-reintentar:hover{background:var(--accent,#c23b2b);border-color:var(--accent,#c23b2b)}",
        ".cp-acciones button:disabled{opacity:.6;cursor:progress}",
        ".cp-cerrar{position:absolute;top:8px;right:10px;border:0;background:transparent;font-size:20px;line-height:1;color:var(--muted,#6f6558);padding:4px}"
    ].join("\n");
    document.head.appendChild(estilos);

    function direccion(boton) {
        var url = boton.getAttribute("data-biblioteca") || boton.getAttribute("href") || URL_POR_DEFECTO;
        return url.charAt(url.length - 1) === "/" ? url : url + "/";
    }

    // El servidor de la Biblioteca PDF sirve public/icono.svg; si la imagen carga, está encendido.
    function comprobar(url, alTerminar) {
        var imagen = new Image();
        var terminado = false;
        var temporizador = setTimeout(function () { fin(false); }, ESPERA_MS);
        function fin(encendida) {
            if (terminado) return;
            terminado = true;
            clearTimeout(temporizador);
            imagen.onload = imagen.onerror = null;
            alTerminar(encendida);
        }
        imagen.onload = function () { fin(true); };
        imagen.onerror = function () { fin(false); };
        imagen.src = url + "icono.svg?comprobar=" + Date.now();
    }

    function marcar(url, estado) {
        var botones = document.querySelectorAll("[data-cargar-pdf]");
        for (var i = 0; i < botones.length; i++) {
            if (direccion(botones[i]) !== url) continue;
            botones[i].setAttribute("data-estado", estado);
            botones[i].title = estado === "encendida"
                ? "La Biblioteca PDF está encendida: se abre en una pestaña nueva"
                : estado === "apagada"
                    ? "La Biblioteca PDF no responde: al pulsar verás cómo encenderla"
                    : "Comprobando la Biblioteca PDF…";
        }
    }

    function abrir(url) {
        // Se llama poco después del clic (dentro de la activación del usuario), así que el navegador
        // no la bloquea. Si aun así la bloquea, se abre en esta misma pestaña.
        var ventana = window.open(url, "_blank");
        if (ventana) {
            ventana.opener = null;
        } else {
            location.href = url;
        }
    }

    var aviso = null;
    function mostrarAviso(boton, url) {
        var carpeta = boton.getAttribute("data-carpeta") || CARPETA_POR_DEFECTO;
        if (!aviso) {
            aviso = document.createElement("div");
            aviso.className = "cp-aviso";
            aviso.setAttribute("role", "alertdialog");
            aviso.setAttribute("aria-labelledby", "cp-titulo");
            aviso.setAttribute("tabindex", "-1");
            document.body.appendChild(aviso);
            aviso.addEventListener("keydown", function (e) {
                if (e.key === "Escape") cerrarAviso();
            });
        }
        aviso.innerHTML =
            '<button type="button" class="cp-cerrar" aria-label="Cerrar">×</button>' +
            '<h2 id="cp-titulo">La Biblioteca PDF no está encendida</h2>' +
            '<p>Es la herramienta que convierte el PDF en JSON y XML. No respondió en <code></code>; enciende su servidor:</p>' +
            '<ol>' +
            '<li>En la carpeta <code></code>, haz doble clic en <b>iniciar-biblioteca.cmd</b> y deja abierta su ventana.</li>' +
            '<li>O abre una terminal en esa carpeta y ejecuta:<div class="cp-comando"><span>npm start</span><button type="button" class="cp-copiar">Copiar</button></div></li>' +
            '<li>Pulsa «Reintentar»: la biblioteca se abrirá en una pestaña nueva.</li>' +
            '</ol>' +
            '<p class="cp-nota">Ya está instalada en este equipo: solo hay que encenderla cada vez. En otro equipo, <b>iniciar-biblioteca.cmd</b> la instala la primera vez (<code>npm install</code> y <code>npm run preparar</code>).</p>' +
            '<div class="cp-acciones"><button type="button" class="cp-reintentar">Reintentar</button><button type="button" class="cp-no">Cerrar</button></div>';
        var codigos = aviso.querySelectorAll("p code, ol code");
        codigos[0].textContent = url;
        codigos[1].textContent = carpeta;
        aviso.querySelector(".cp-cerrar").onclick = cerrarAviso;
        aviso.querySelector(".cp-no").onclick = cerrarAviso;
        aviso.querySelector(".cp-copiar").onclick = function () {
            var boton = this;
            var listo = function () { boton.textContent = "Copiado"; };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText("npm start").then(listo, function () { boton.textContent = "Selecciona y copia"; });
            }
        };
        var reintentar = aviso.querySelector(".cp-reintentar");
        reintentar.onclick = function () {
            reintentar.disabled = true;
            reintentar.textContent = "Comprobando…";
            comprobar(url, function (encendida) {
                marcar(url, encendida ? "encendida" : "apagada");
                if (encendida) {
                    cerrarAviso();
                    abrir(url);
                } else {
                    reintentar.disabled = false;
                    reintentar.textContent = "Reintentar";
                    aviso.querySelector("h2").textContent = "Sigue sin responder";
                }
            });
        };
        aviso.hidden = false;
        aviso.focus();
    }

    function cerrarAviso() {
        if (aviso) aviso.hidden = true;
    }

    // Delegación: también sirve para botones que la página dibuja después (como en el Atlas).
    document.addEventListener("click", function (e) {
        var boton = e.target.closest ? e.target.closest("[data-cargar-pdf]") : null;
        if (!boton) return;
        e.preventDefault();
        var url = direccion(boton);
        if (boton.getAttribute("aria-busy") === "true") return;
        boton.setAttribute("aria-busy", "true");
        boton.setAttribute("data-estado", "comprobando");
        comprobar(url, function (encendida) {
            boton.removeAttribute("aria-busy");
            marcar(url, encendida ? "encendida" : "apagada");
            if (encendida) {
                cerrarAviso();
                abrir(url);
            } else {
                mostrarAviso(boton, url);
            }
        });
    });

    // Estado inicial: un punto verde o rojo en cada botón.
    var vistos = {};
    var botones = document.querySelectorAll("[data-cargar-pdf]");
    for (var i = 0; i < botones.length; i++) {
        var url = direccion(botones[i]);
        if (vistos[url]) continue;
        vistos[url] = true;
        marcar(url, "comprobando");
        (function (u) {
            comprobar(u, function (encendida) { marcar(u, encendida ? "encendida" : "apagada"); });
        })(url);
    }

    // Lo comparte el bloque de carga de abajo.
    window.BibliotecaPDF = { comprobar: comprobar, mostrarAviso: mostrarAviso, marcar: marcar, abrir: abrir };
})();

/*
    Bloque de carga · <div data-carga-biblioteca></div>

    Permite soltar un PDF en la propia página: lo envía a la Biblioteca PDF de este equipo, muestra
    cada etapa de la conversión (subida, JSON con pdf2json, XML con XmlToJson, páginas y OCR), y al
    terminar enseña el resultado con sus descargas y una vista previa del JSON y del XML.
    La Biblioteca PDF acepta estas peticiones solo desde páginas locales (file:// o localhost).
*/
(function () {
    var bloques = document.querySelectorAll("[data-carga-biblioteca]");
    if (!bloques.length || !window.BibliotecaPDF) return;
    var B = window.BibliotecaPDF;
    var VISTA_BYTES = 9000;

    var estilos = document.createElement("style");
    estilos.textContent = [
        ".bp{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:18px;align-items:stretch}",
        "@media(max-width:880px){.bp{grid-template-columns:1fr}}",
        ".bp-zona{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:280px;padding:28px 22px;border:1.5px dashed var(--line,#cfc2ab);background:#faf5ea;text-align:center;cursor:pointer;transition:border-color .2s,background .2s}",
        ".bp-zona:hover,.bp-zona.bp-encima{border-color:var(--accent,#c23b2b);background:#fbf1e6}",
        ".bp-zona:focus-within{outline:2px solid var(--accent,#c23b2b);outline-offset:3px}",
        ".bp-zona svg{width:46px;height:46px;color:var(--accent,#c23b2b);margin-bottom:6px}",
        ".bp-zona strong{font-family:var(--serif,Georgia,serif);font-weight:500;font-size:clamp(22px,2.6vw,28px);letter-spacing:-.02em;line-height:1.1}",
        ".bp-zona span{font-size:13.5px;color:var(--muted,#6f6558)}",
        ".bp-zona input{position:absolute;width:1px;height:1px;opacity:0}",
        ".bp-estado{margin-top:14px;display:inline-flex;align-items:center;gap:8px;font-family:var(--mono,Consolas,monospace);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#6f6558)}",
        ".bp-estado::before{content:'';width:8px;height:8px;border-radius:50%;background:#b9ae9b}",
        ".bp-estado[data-estado='encendida']::before{background:#2f8f5b}",
        ".bp-estado[data-estado='apagada']::before{background:#c23b2b}",
        ".bp-pasos{display:grid;gap:1px;background:var(--line,#cfc2ab);border:1px solid var(--line,#cfc2ab);margin:0;padding:0;list-style:none}",
        ".bp-paso{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:12px;align-items:start;background:var(--paper,#f4efe4);padding:13px 16px;transition:background .3s}",
        ".bp-paso .bp-n{font-family:var(--serif,Georgia,serif);font-size:22px;line-height:1;color:var(--muted,#6f6558)}",
        ".bp-paso b{display:block;font-family:var(--serif,Georgia,serif);font-weight:500;font-size:16.5px;line-height:1.2}",
        ".bp-paso small{display:block;font-size:12.5px;line-height:1.45;color:var(--muted,#6f6558);margin-top:2px}",
        ".bp-paso code{font-family:var(--mono,Consolas,monospace);font-size:11px;background:var(--paper-2,#ece4d3);border:1px solid var(--line-soft,#ddd2bf);padding:0 4px}",
        ".bp-paso .bp-marca{font-family:var(--mono,Consolas,monospace);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted,#6f6558);white-space:nowrap;padding-top:3px}",
        ".bp-paso[data-estado='curso']{background:#fbf1e6}",
        ".bp-paso[data-estado='curso'] .bp-n{color:var(--accent,#c23b2b)}",
        ".bp-paso[data-estado='curso'] .bp-marca{color:var(--accent,#c23b2b)}",
        ".bp-paso[data-estado='curso'] .bp-marca::before{content:'';display:inline-block;width:9px;height:9px;margin-right:6px;vertical-align:-1px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:bp-giro .8s linear infinite}",
        ".bp-paso[data-estado='listo'] .bp-n{color:#2f8f5b}",
        ".bp-paso[data-estado='listo'] .bp-marca{color:#2f8f5b}",
        ".bp-paso[data-estado='error'] .bp-marca{color:var(--accent,#c23b2b)}",
        "@keyframes bp-giro{to{transform:rotate(360deg)}}",
        "@media(prefers-reduced-motion:reduce){.bp-paso[data-estado='curso'] .bp-marca::before{animation:none}}",
        ".bp-mensaje{grid-column:1/-1;margin:0;font-size:13.5px;color:var(--ink-2,#302a22)}",
        ".bp-mensaje:empty{display:none}",
        ".bp-mensaje.bp-error{color:var(--accent,#c23b2b)}",
        ".bp-resultado{grid-column:1/-1;border:1px solid var(--ink,#15120e);background:var(--paper,#f4efe4);padding:clamp(16px,2.4vw,24px);display:grid;gap:14px;min-width:0}",
        ".bp-resultado[hidden]{display:none}",
        ".bp-resultado h4{margin:0;font-family:var(--serif,Georgia,serif);font-weight:500;font-size:clamp(22px,2.4vw,28px);letter-spacing:-.02em;line-height:1.1}",
        ".bp-datos{display:flex;flex-wrap:wrap;gap:6px 18px;font-family:var(--mono,Consolas,monospace);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#6f6558)}",
        ".bp-datos b{color:var(--ink,#15120e);font-weight:500}",
        ".bp-acciones{display:flex;flex-wrap:wrap;gap:8px}",
        ".bp-acciones a{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line,#cfc2ab);border-radius:999px;padding:8px 14px;font-size:12.5px;text-decoration:none;color:var(--ink,#15120e);background:transparent}",
        ".bp-acciones a:hover{border-color:var(--ink,#15120e)}",
        ".bp-acciones a.bp-principal{background:var(--ink,#15120e);color:var(--paper,#f4efe4);border-color:var(--ink,#15120e)}",
        ".bp-pestanas{display:flex;gap:4px;border-bottom:1px solid var(--line,#cfc2ab)}",
        ".bp-pestanas button{border:0;background:transparent;padding:7px 14px;font-family:var(--mono,Consolas,monospace);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#6f6558);cursor:pointer}",
        ".bp-pestanas button[aria-selected='true']{color:var(--ink,#15120e);box-shadow:inset 0 -2px 0 var(--accent,#c23b2b)}",
        ".bp-vista{margin:0;max-height:340px;overflow:auto;background:#1b1813;color:#efe7d6;font:12px/1.55 var(--mono,Consolas,monospace);padding:14px 16px;white-space:pre}",
        ".bp-nota{margin:0;font-size:12px;color:var(--muted,#6f6558)}"
    ].join("\n");
    document.head.appendChild(estilos);

    var PASOS = [
        ["subida", "Subir el PDF", "Viaja a la Biblioteca PDF de este equipo (<code>localhost:8780</code>). No sale a internet."],
        ["json", "JSON con pdf2json", "Lee cada página: posición de textos, líneas, rellenos y campos de formulario."],
        ["xml", "XML con XmlToJson", "Convierte ese JSON a XML, con la misma estructura."],
        ["paginas", "Separar por páginas", "Un JSON y un XML por página, en <code>paginas/</code>."],
        ["ocr", "OCR de las páginas imagen", "Tesseract lee el texto de las páginas que son solo imagen (portadas, anuncios)."],
        ["guardado", "Guardado en la biblioteca", "Todo queda en <code>biblioteca/&lt;id&gt;/</code>, listo para descargar o pasar a InDesign."]
    ];

    function esc(texto) {
        return String(texto).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
    }

    function tamano(bytes) {
        if (!bytes && bytes !== 0) return "";
        return bytes < 1048576 ? (bytes / 1024).toFixed(1) + " KB" : (bytes / 1048576).toFixed(1) + " MB";
    }

    Array.prototype.forEach.call(bloques, function (bloque) {
        var url = bloque.getAttribute("data-biblioteca") || "http://localhost:8780/";
        if (url.charAt(url.length - 1) !== "/") url += "/";
        var api = url + "api/documentos";

        bloque.classList.add("bp");
        bloque.innerHTML =
            '<label class="bp-zona">' +
            '<input type="file" accept="application/pdf,.pdf">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '<strong>Arrastra aquí tu PDF</strong>' +
            '<span>o haz clic para elegirlo · se convierte a JSON y XML</span>' +
            '<span class="bp-estado" data-estado="comprobando">Comprobando la Biblioteca PDF…</span>' +
            '</label>' +
            '<ol class="bp-pasos" aria-label="Cómo se convierte el PDF">' +
            PASOS.map(function (p, i) {
                return '<li class="bp-paso" data-paso="' + p[0] + '" data-estado="espera"><span class="bp-n">' + (i + 1) + '</span><div><b>' + p[1] + '</b><small>' + p[2] + '</small></div><span class="bp-marca">En espera</span></li>';
            }).join("") +
            '</ol>' +
            '<p class="bp-mensaje" role="status" aria-live="polite"></p>' +
            '<div class="bp-resultado" hidden></div>';

        var zona = bloque.querySelector(".bp-zona");
        var entrada = zona.querySelector("input");
        var estado = zona.querySelector(".bp-estado");
        var mensaje = bloque.querySelector(".bp-mensaje");
        var resultado = bloque.querySelector(".bp-resultado");
        var ocupado = false;

        function marcarPaso(paso, situacion, texto) {
            var fila = bloque.querySelector('[data-paso="' + paso + '"]');
            fila.setAttribute("data-estado", situacion);
            fila.querySelector(".bp-marca").textContent = texto || { espera: "En espera", curso: "En curso", listo: "Listo", error: "Error", omitido: "No hace falta" }[situacion];
        }

        function reiniciarPasos() {
            PASOS.forEach(function (p) { marcarPaso(p[0], "espera"); });
        }

        function decir(texto, esError) {
            mensaje.textContent = texto;
            mensaje.classList.toggle("bp-error", !!esError);
        }

        function comprobarServidor(alTerminar) {
            estado.setAttribute("data-estado", "comprobando");
            estado.textContent = "Comprobando la Biblioteca PDF…";
            B.comprobar(url, function (encendida) {
                estado.setAttribute("data-estado", encendida ? "encendida" : "apagada");
                estado.textContent = encendida ? "Biblioteca PDF encendida" : "Biblioteca PDF apagada";
                B.marcar(url, encendida ? "encendida" : "apagada");
                if (alTerminar) alTerminar(encendida);
            });
        }

        function subir(archivo) {
            if (ocupado) return;
            if (!archivo || !/\.pdf$/i.test(archivo.name) && archivo.type !== "application/pdf") {
                decir("Elige un archivo PDF.", true);
                return;
            }
            ocupado = true;
            resultado.hidden = true;
            reiniciarPasos();
            decir("");
            comprobarServidor(function (encendida) {
                if (!encendida) {
                    ocupado = false;
                    marcarPaso("subida", "error", "Sin conexión");
                    decir("La Biblioteca PDF no está encendida. Enciéndela y vuelve a soltar el archivo.", true);
                    B.mostrarAviso(bloque, url);
                    return;
                }
                marcarPaso("subida", "curso", "Subiendo " + tamano(archivo.size));
                // La conversión a JSON, XML y páginas ocurre en el servidor durante esta misma petición.
                var avance = setTimeout(function () {
                    marcarPaso("subida", "listo");
                    marcarPaso("json", "curso");
                }, 600);
                fetch(api, {
                    method: "POST",
                    headers: { "Content-Type": "application/pdf", "X-Nombre-Archivo": encodeURIComponent(archivo.name) },
                    body: archivo
                }).then(function (respuesta) {
                    return respuesta.json().then(function (datos) {
                        if (!respuesta.ok) throw new Error(datos.error || "Error " + respuesta.status);
                        return datos;
                    });
                }).then(function (ficha) {
                    clearTimeout(avance);
                    ["subida", "json", "xml", "paginas"].forEach(function (p) { marcarPaso(p, "listo"); });
                    marcarPaso("json", "listo", tamano(ficha.bytes.json));
                    marcarPaso("xml", "listo", tamano(ficha.bytes.xml));
                    marcarPaso("paginas", "listo", ficha.paginas + (ficha.paginas === 1 ? " página" : " páginas"));
                    decir(ficha.duplicado ? "Este PDF ya estaba en la biblioteca: se muestra lo que ya tenía guardado." : "Convertido. Abajo tienes el resultado.");
                    mostrarResultado(ficha);
                    seguirOcr(ficha);
                }).catch(function (error) {
                    clearTimeout(avance);
                    ocupado = false;
                    var paso = bloque.querySelector('[data-paso="json"]').getAttribute("data-estado") === "curso" ? "json" : "subida";
                    marcarPaso(paso, "error");
                    // Un TypeError de fetch es que el navegador no pudo conectar (o bloqueó la conexión).
                    decir(error instanceof TypeError
                        ? "El navegador no pudo conectar con la Biblioteca PDF desde esta página. Pulsa «Cargar PDF» para abrirla y suelta ahí el archivo."
                        : "No se pudo convertir: " + error.message, true);
                });
            });
        }

        // El OCR sigue en segundo plano: se consulta la ficha hasta que termina.
        function seguirOcr(ficha) {
            var ocr = ficha.ocr;
            if (!ocr || ocr.estado === "no-necesario" || !(ficha.paginasSinTexto || []).length) {
                marcarPaso("ocr", "omitido");
                terminar(ficha);
                return;
            }
            if (ocr.estado === "listo") {
                marcarPaso("ocr", "listo", (ocr.conTexto || []).length + " de " + ocr.paginas.length + " págs.");
                terminar(ficha);
                return;
            }
            if (ocr.estado === "error") {
                marcarPaso("ocr", "error");
                terminar(ficha);
                return;
            }
            marcarPaso("ocr", "curso", ocr.estado === "procesando" ? "Página " + (ocr.hechas + 1) + " de " + ocr.paginas.length : "En cola");
            setTimeout(function () {
                fetch(api + "/" + encodeURIComponent(ficha.id)).then(function (r) { return r.json(); }).then(function (nueva) {
                    mostrarResultado(nueva);
                    seguirOcr(nueva);
                }).catch(function () {
                    marcarPaso("ocr", "error", "Sin respuesta");
                    terminar(ficha);
                });
            }, 2000);
        }

        function terminar(ficha) {
            marcarPaso("guardado", "listo", "biblioteca/" + ficha.id.slice(0, 18) + "…");
            ocupado = false;
        }

        function enlace(ruta, texto, clase) {
            return '<a' + (clase ? ' class="' + clase + '"' : "") + ' href="' + esc(url + ruta) + '" target="_blank" rel="noopener">' + texto + '</a>';
        }

        function mostrarResultado(ficha) {
            var base = "api/documentos/" + encodeURIComponent(ficha.id);
            var ocr = ficha.ocr || {};
            var textoOcr = !ficha.paginasSinTexto || !ficha.paginasSinTexto.length ? "no hace falta"
                : ocr.estado === "listo" ? (ocr.conTexto || []).length + " de " + ocr.paginas.length + " páginas leídas"
                    : ocr.estado === "error" ? "falló" : "en curso";
            var yaPintado = resultado.getAttribute("data-id") === ficha.id;
            resultado.setAttribute("data-id", ficha.id);
            var datos = '<div class="bp-datos">' +
                '<span><b>' + ficha.paginas + '</b> ' + (ficha.paginas === 1 ? "página" : "páginas") + '</span>' +
                '<span>JSON <b>' + tamano(ficha.bytes.json) + '</b></span>' +
                '<span>XML <b>' + tamano(ficha.bytes.xml) + '</b></span>' +
                '<span>OCR <b>' + esc(textoOcr) + '</b></span>' +
                '</div>';
            if (yaPintado) {
                resultado.querySelector(".bp-datos").outerHTML = datos;
                return;
            }
            resultado.innerHTML =
                '<h4>' + esc(ficha.titulo || ficha.nombre) + '</h4>' + datos +
                '<div class="bp-acciones">' +
                enlace("#doc=" + encodeURIComponent(ficha.id), "Abrir en la Biblioteca PDF", "bp-principal") +
                enlace(base + "/json?descargar=1", "JSON ↓") +
                enlace(base + "/xml?descargar=1", "XML ↓") +
                enlace(base + "/paginas/zip?tipo=todo", "Páginas (.zip) ↓") +
                enlace(base + "/indesign", "InDesign (.zip) ↓") +
                '</div>' +
                '<div class="bp-pestanas" role="tablist"><button type="button" role="tab" data-tipo="json" aria-selected="true">JSON</button><button type="button" role="tab" data-tipo="xml" aria-selected="false">XML</button></div>' +
                '<pre class="bp-vista" tabindex="0">Cargando…</pre>' +
                '<p class="bp-nota"></p>';
            resultado.hidden = false;
            var pestanas = resultado.querySelectorAll(".bp-pestanas button");
            Array.prototype.forEach.call(pestanas, function (boton) {
                boton.addEventListener("click", function () {
                    Array.prototype.forEach.call(pestanas, function (b) { b.setAttribute("aria-selected", b === boton ? "true" : "false"); });
                    vistaPrevia(ficha, boton.getAttribute("data-tipo"));
                });
            });
            vistaPrevia(ficha, "json");
        }

        function vistaPrevia(ficha, tipo) {
            var vista = resultado.querySelector(".bp-vista");
            var nota = resultado.querySelector(".bp-nota");
            vista.textContent = "Cargando…";
            fetch(api + "/" + encodeURIComponent(ficha.id) + "/" + tipo + "?limite=" + VISTA_BYTES).then(function (r) {
                var total = Number(r.headers.get("X-Tamano-Total")) || 0;
                return r.text().then(function (texto) { return { texto: texto, total: total }; });
            }).then(function (datos) {
                vista.textContent = datos.texto;
                vista.scrollTop = 0;
                nota.textContent = datos.total > VISTA_BYTES
                    ? "Vista previa: los primeros " + tamano(VISTA_BYTES) + " de " + tamano(datos.total) + ". Descarga el archivo o ábrelo en la Biblioteca PDF para verlo completo."
                    : tipo.toUpperCase() + " completo · " + tamano(datos.total);
            }).catch(function () {
                vista.textContent = "No se pudo cargar la vista previa.";
            });
        }

        entrada.addEventListener("change", function () {
            subir(entrada.files[0]);
            entrada.value = "";
        });
        zona.addEventListener("dragover", function (e) {
            e.preventDefault();
            zona.classList.add("bp-encima");
        });
        zona.addEventListener("dragleave", function () {
            zona.classList.remove("bp-encima");
        });
        zona.addEventListener("drop", function (e) {
            e.preventDefault();
            zona.classList.remove("bp-encima");
            if (e.dataTransfer.files.length > 1) decir("Se convierte un PDF cada vez: tomo el primero.");
            subir(e.dataTransfer.files[0]);
        });

        comprobarServidor();
        // Si la biblioteca se enciende después de abrir la página, el estado se pone al día al volver a la pestaña.
        document.addEventListener("visibilitychange", function () {
            if (!document.hidden && !ocupado) comprobarServidor();
        });
    });
})();
