# Control de calidad — VOX Speak Stage 0

**Alcance:** copia local sin despliegue; no se ha modificado GitHub Pages.

| Categoría | Estado | Evidencia |
| --- | --- | --- |
| Análisis de sintaxis JS | PASS | `node --check` sobre módulos originales y nuevos |
| 8 unit tests Node | PASS | `docs/unit-test-results.txt` |
| Preservación de bytes v2 | PASS (fixture) | `tests/core.test.js` y `tests/browser_check.py` |
| Entrenador clásico e isla personalizada | PASS (fixture) | Chromium DOM smoke test |
| Inicio / pausa / reanudación | PASS (fixture) | Chromium DOM smoke test |
| Recorrido completo de 22 tareas | PASS (saltos simulados) | Chromium DOM smoke test |
| Resumen y evitar falso MCER | PASS | Unit + browser smoke test |
| Archivar línea base anterior al repetir | PASS | Chromium DOM smoke test |
| Visualización móvil 393 × 852 | PASS (render) | `docs/stage0-android-*.png` |
| Micrófono real Android / permisos | **PENDIENTE** | Requiere autorización de preview HTTPS y dispositivo real |
| ES modules servidos por HTTP | **PENDIENTE** | Chromium del entorno bloquea navegación HTTP; pruebas DOM usan empaquetado temporal en memoria |
| Audio TTS en Android | **PENDIENTE** | Dispositivo real / voz instalada |
| Integración Azure / Cloudflare | NO INCLUIDO | Etapas futuras |

**Interpretación:** los resultados positivos de fixtures comprueban el comportamiento del código bajo escenarios simulados. No prueban directamente la conservación de datos reales de un navegador Android del usuario; deberá verificarse en despliegue aprobado antes de cerrar etapa 0.

## Corrección específica de voz Android — staging

- `tests/voice_browser_check.py`: 8 verificaciones con reconocimiento y grabador simulados, sin micrófono real.
- Manual STOP: se comprueba `recognition.stop()` y que llega texto final + reproductor local.
- Fallo de red en STT: conserva el audio, evita guardar un puntaje engañoso y muestra el error.
- Entrenador clásico, entrevista, Islas, reproducción independiente y diagnóstico usan la nueva captura compartida.
- Micrófono real Android, permisos y compatibilidad de captura simultánea: **pendiente de reconfirmación del usuario**, no se da por aprobado desde Chromium simulado.
- Cambio realizado únicamente en repositorio de staging; **producción 2.1 no cambia**.

## 2026-10-20 · Android speech diagnostic patch

* Added a separate Web Speech recognition-only diagnostic which does not start MediaRecorder concurrently and reports exact Web Speech `error` codes with non-transcription troubleshooting. The report excludes voice recordings/transcripts and is only copied by user action.
* Added opt-in compatibility mode on staging: voice recognition without simultaneous local recording. The dedicated Record My Voice action remains unchanged. The switch is persisted under `vox_stage0_preview__recognition_only_mode`, not v2 keys.
* Changed no-result output so recognition errors have bracketed codes and no fictitious pronunciation score.
* Bumped service-worker cache to refresh HTML and scripts.
* Test locally using: `npm test`, `python tests/voice_browser_check.py`, `python tests/speech_diagnostics_browser_check.py`, `python tests/browser_check.py`, `python tests/live_staging_smoke.py`.
* **Pending on real Android:** ask the user to run standalone recognition diagnostic and provide the code. If Chrome returns `network` or `service-not-allowed` in standalone recognition mode, there is no guaranteed local JavaScript workaround. A real alternate speech-recognition provider must be considered separately under the $0 constraint.
