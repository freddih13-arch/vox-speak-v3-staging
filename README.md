# Entorno de pruebas Android (staging)

**Este repositorio no es la web de producción.** La URL de pruebas es pública, sin login; no escribas información sensible.

**Protección del progreso:** GitHub Pages de proyectos del mismo usuario comparten origen de navegador (`https://freddih13-arch.github.io`), por lo cual comparten localStorage aunque las rutas sean diferentes. Para evitar interferencias, esta copia utiliza exclusivamente claves `vox_stage0_preview__...` para las tres clases de progreso, en vez de las claves usadas por VOX 2.1. **No lee, cambia ni elimina los datos de producción.** Por esa razón, el progreso de producción no aparece automáticamente en staging.

Para probar la migración de datos reales se necesitará un protocolo de respaldo/restauración autorizado posteriormente. No se requiere para comprobar flujo inicial de diagnóstico, micrófono y persistencia aislada.

# VOX Speak 3.0 — Etapa 0 (candidato, NO publicado)

Proyecto personal de aprendizaje de inglés para Android, aún **en revisión**. Esta copia parte de los archivos reales de VOX Speak 2.1, reorganizados en JS modular sin frameworks ni servicios de pago. **No habilita Azure, Cloudflare Worker, SRS nuevo ni plan adaptativo todavía**; están reservados para etapas siguientes y requieren aprobación.

## Entregado

- Mantenimiento funcional del entrenador clásico y diez islas existentes con frases personalizadas.
- Extracción de CSS y datos de la página HTML.
- Lógica clásica organizada en `src/legacy/` y catálogo en `src/data/`.
- Nueva arquitectura ES modules: `src/core/{storage,migration,app}.js` y `src/diagnostic/{questions,engine,ui}.js`.
- Diagnóstico persistente de 22 actividades: 8 listening, 6 recuperación activa escrita, 4 inteligibilidad aproximada por Web Speech, 4 respuestas orales grabadas y autoevaluadas. Reparto: 13 profesionales y 9 cotidianas (59 % / 41 %).
- Continuación tras pausa, reporte sin nivel MCER inferido, archivo de intentos previos cuando el usuario repite el diagnóstico.
- Copia exportable con los valores **exactos** de las tres claves de VOX (`vox_speak_free_v1`, `vox-islands-v2`, `vox_speak_v3_stage0`).

## Garantía de conservación (Etapa 0)

**No se borran ni transforman los datos originales.** El motor anterior sigue leyendo y guardando `vox_speak_free_v1` y `vox-islands-v2`. El motor de etapa 0 únicamente crea `vox_speak_v3_stage0`. Esta es una **migración no destructiva con compatibilidad de lectura**, no una migración completa a un esquema único. La consolidación en almacenamiento canónico requerirá una etapa posterior aprobada.

Si una clave original está dañada, sus bytes no se reescriben. Si la clave nueva está corrupta/incompatible, la app bloquea cualquier sobrescritura y ofrece respaldo de emergencia.

El progreso permanece en **ese navegador y ese origen web**. No hay sincronización de dispositivos. El usuario debe exportar los datos antes de borrar caché, cambiar de navegador, resetear Android, etc. La previsualización local usa un origen diferente al GitHub Pages público: por diseño no muestra los datos guardados en la URL pública salvo que se restauren manualmente en una etapa futura.

## Ejecución local

Para que los módulos ES funcionen (no abrir `file://`):

```bash
cd vox-speak-v3-stage0
python3 -m http.server 8765
# Visitar http://localhost:8765 desde el mismo PC.
```

En Android real se necesitará **HTTPS** para permisos de micrófono, una vez que autorices publicar una rama de pruebas o una nueva versión. En esta etapa no se ha desplegado ni modificado ningún repositorio remoto.

## Pruebas reproducibles

```bash
npm test                    # 8 pruebas unitarias Node (no descarga dependencias)
python tests/browser_check.py  # verificación DOM móvil simulada en Chromium + Playwright
```

La prueba de navegador usa HTML en memoria y un empaquetado temporal de módulos porque este entorno bloquea la navegación HTTP del Chromium automatizado; **no representa una prueba de la app servida por HTTP**, ni sustituye la prueba del micrófono real. No se necesita convertir el código de producción ni usar bundler.

## Checklist manual de aceptación — cuando autorices preview HTTPS

- [ ] Abre la app en Chrome para Android y verifica que Inicio, Listening, Hablar, Entrevista, Islas y Progreso funcionan.
- [ ] Antes de cambiar desde la versión anterior, exporta la copia de Islas y de las estadísticas de VOX 2.1.
- [ ] Confirma que tus islas personalizadas, historial y bitácora anteriores siguen visibles.
- [ ] En Inicio, pulsa **Iniciar diagnóstico**: deben aparecer 22 actividades sin revelar las frases de listening.
- [ ] Escucha la primera pregunta y responde. Comprueba que se revela solo **después** de contestar.
- [ ] Cierra la app, vuelve a abrir y comprueba que reanuda en la tarea siguiente.
- [ ] Realiza una recuperación activa escrita y verifica las referencias alternativas.
- [ ] Prueba una frase de pronunciación con micrófono. Confirma que muestra solo coincidencia de palabras, nunca fonemas ni puntuación de acento inventados.
- [ ] En speaking, graba 30–60 segundos; escúchate y elige una autoevaluación; verifica que el audio se elimina al abandonar el ejercicio.
- [ ] Omite algunas tareas y comprueba que no cuentan como errores medidos.
- [ ] Finaliza las 22 tareas; el reporte no debe asignar un nivel B2 ni CEFR ficticio.
- [ ] Exporta el respaldo y verifica que contiene las tres claves exactas.
- [ ] Repite diagnóstico después de confirmar; el diagnóstico completado debe guardarse en historial.
- [ ] Recarga sin conexión: recursos en caché donde esté disponible; **Web Speech y TTS pueden fallar sin conexión**.

## Privacidad y precisión

- No hay backend, Azure ni peticiones de API propias en etapa 0.
- `SpeechRecognition` de Chrome puede procesar audio en servidores externos del navegador. **No es una alternativa offline garantizada.**
- Las grabaciones de MediaRecorder son temporales en memoria: no se escriben en IndexedDB ni se envían por esta app.
- Los errores que señala Web Speech son **coincidencia de texto**, no análisis de fonemas.
- Speaking usa una escala subjetiva de 0 a 3 y no una evaluación automatizada de gramática o fluidez.
- Los elementos del diagnóstico NO son un instrumento estandarizado; no producen una evaluación certificada de nivel MCER.

## Siguiente decisión

Revisar la UI, pruebas y esquema de datos. **No mezclar en `main` hasta aprobación explícita del usuario.** Después de aprobar etapa 0 se podrá crear una rama de prueba con HTTPS, validar micrófono Android y diseñar el módulo de pronunciación real (etapa 1), manteniendo costo obligatorio de 0 COP.

## Staging Android: corrección de micrófono (20-10-2026)

Esta carpeta corresponde al proyecto **de pruebas HTTPS**, independiente de la web VOX Speak 2.1. Después del primer ensayo en Android se identificó que el botón "Detener" llamaba a `SpeechRecognition.abort()` y descartaba posibles transcripciones. También separaba el reconocimiento y la grabación reproducible.

La corrección añade `src/core/voice-capture.js`, que administra dos procesos distintos: `MediaRecorder` para reproducción local y `SpeechRecognition` para una transcripción aproximada cuando el navegador la permite. **Detener y evaluar** llama a `stop()`; si falla el reconocimiento, conserva el audio (cuando MediaRecorder funciona), muestra el motivo y no crea puntuaciones falsas. El audio no se sube por el código de VOX; el servicio del navegador podría recibirlo para reconocer palabras. La grabación es temporal y se elimina al cambiar de actividad o grabar de nuevo.

### Probar en Android

1. En Chrome abre `https://freddih13-arch.github.io/vox-speak-v3-staging/` y actualiza la página si hay una copia antigua.
2. En **Hablar**, pulsa **Repetir**, di una frase y pulsa **Detener y evaluar** (no cierres la pestaña antes de terminar).
3. Comprueba que aparece un reproductor de audio. Si Chrome logró transcribir, también muestra las palabras reconocidas y la comparación con el modelo.
4. Si no transcribe, usa el reproductor para confirmar que sí se grabó tu voz; el mensaje mostrará el error del motor de reconocimiento.
5. En **Islas**, el botón **Hablar** también captura audio, y **Grabar mi voz** funciona aun sin transcripción.
6. En **Diagnóstico** puedes escuchar tu grabación de pronunciación *antes* de guardar la transcripción; en Speaking puedes escucharla antes de autoevaluarte.

Pruebas: `node --test tests/core.test.js`, `python tests/browser_check.py` y `python tests/voice_browser_check.py`. Las pruebas de voz usan dispositivos falsos inyectados en Chromium; sigue siendo indispensable la prueba de micro y red real en Android.
