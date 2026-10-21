# VOX Speak 3.0 — Auditoría de producto y plan de recuperación
Fecha: 2026-10-21 · Base auditada: `main@7af9f8ae639383cdf7e8b70f55ea36c40b11eafe`
Estado: **Auditoría técnica estática terminada; regresión real Android pendiente. No aprobado para despliegue.**

## Objetivo innegociable

Convertir los módulos existentes en **un entrenador útil, confiable, premium, orientado a inglés funcional B1→B2 para entrevistas AE/BDM, pagos, fintech y conversación cotidiana**, sin reescribir desde cero, sin tocar `vox-speak-free` y con costo recurrente de API 0 COP. Diseño centrado en el usuario: 60 % profesional / 40 % cotidiano, móvil Android. El éxito es aprendizaje demostrable, no minutos atrapado en pantalla ni métricas infladas.

### Diagnóstico principal

La aplicación ofrece seis pestañas y siete pantallas (`home`, `listen`, `pronounce`, `interview`, `islands`, `diagnostic`, `progress`), más dos motores orales parcialmente paralelos y un diagnóstico técnico prominente en Inicio. Carece de una sola progresión diaria y una acción obvia que continuar. Las métricas de las áreas se guardan en claves distintas. Se añadió funcionalidad antes de consolidar navegación, repetición, estados y feedback.

**Evidencia confirmada por inspección del código** (no supone reproducción de cada síntoma en dispositivo):
| ID | Prioridad | Ubicación y hallazgo | Consecuencia | Comprobación necesaria |
|---|---|---|---|---|
| F-01 | P0 | `src/listening/listening-lab.js`: `showResult()` deja habilitado `el.play`, pero `replay()` hace `if (!current || answered || revealed) return` | Botón «escuchar» visible tras responder, sin efecto | Contestar y pulsar reproducir 3 veces |
| F-02 | P0 | `src/core/voice-capture.js`: `recognition.onend` llama a `s.stop()` si el usuario no detuvo manualmente | Cuando el reconocedor termina o falla temprano, puede terminar la grabación local prematuramente | Simular `network/no-speech/onend` con MediaRecorder activo y comprobar continuidad |
| F-03 | P0 | `src/listening/listening-lab.js`: se habilitan opciones inmediatamente después de `speechSynthesis.speak(u)`, no tras `onstart` real; `onerror` intenta restar `plays` | Se puede contestar sin haber oído una pregunta si TTS no comenzó; contador no representa escuchas reales | TTS fallida / en cola / cancelada / navegación |
| F-04 | P1 | `src/listening/engine.js`: `nextQuestion()` añade a `seen` incluso antes de escuchar o contestar | Abandonar o recargar puede saltar ejercicios; no existe «reanudar esta pregunta» | Recargar antes de escuchar y comparar IDs |
| F-05 | P1 | `src/legacy/training.js`: entrevista puntúa cobertura de `keys` únicamente | «100 %» podría significar solo 3 palabras clave; no mide estructura, comprensibilidad, pronunciación ni calidad | Respuesta absurda con 3 palabras clave |
| F-06 | P1 | `src/legacy/islands.js`: `setResult` actualiza `stage,due,mastered` según coincidencia de palabras transcritas con Web Speech | Transcripción equivocada puede producir falsa maestría o repetición | Inyectar STT fallida, mala/muy buena transcripción |
| F-07 | P1 | `src/legacy/training.js` + `src/listening/engine.js` + `src/legacy/islands.js` + `src/core/storage.js` usan estados/progresos paralelos | Inicio no explica competencia, errores repetibles ni siguiente ejercicio | Comparar dashboard vs cuatro historiales |
| F-08 | P1 | `index.html`: Inicio contiene métricas, misión de 12 min, islas, tres accesos de entrenamiento, depuración ASR y diagnóstico de 22 tareas | Sobrecarga, poca claridad de la ruta «hoy» | Evaluación de 5 segundos: identificar único CTA |
| F-09 | P1 | Banco de listening: 20 intenciones × 3 paráfrasis = 60; respuestas mayormente opción múltiple de significado | Cobertura curricular limitada y poca transferencia a entender preguntas espontáneas o hablar | Pruebas con nuevas voces/acentos y audio auténtico |
| F-10 | P1 | `src/phonetics/pronunciation-lab.js` muestra IPA bruto Q4; STT clásico puede fallar | No existe evaluador fonético fiable ni feedback oral calibrado en tiempo real; no fingirlo | Probar con voz de aprendizaje y referencia humana |
| F-11 | P2 | `sw.js`: versión de caché en cadena fija y strategy network-first; `skipWaiting/clients.claim` | Requiere prueba de actualización de sesiones, caché y compatibilidad offline; **hipótesis**, no fallo probado | Prueba de upgrade de versión con sesión abierta |
| F-12 | P2 | `src/core/storage.js` y claves separadas, mismo origen github.io para los proyectos | Riesgo de migración/backup accidental si se homogeneiza almacenamiento sin protocolo | Migraciones reversibles con datos de prueba |

## Principios de diseño de la versión premium

1. **Una ruta clara, múltiples herramientas detrás.** Pantalla «Hoy» con CTA único `Continuar mi sesión`, bloque `Repasar mis errores` y progreso semanal verificable; diagnóstico técnico pasa a Ajustes/Soporte.
2. **Toda actividad es un ciclo cerrado**: escuchar → comprender/contestar → feedback inmediato verificable → repetir la *misma* pieza → usarla en voz propia → guardar dificultad → siguiente.
3. **Controles reversibles**: escuchar siempre, lento/normal, mostrar/ocultar texto, repetir intento (sin doble contador), guardar, volver, siguiente, saltar; ningún control visible debe hacer silencio.
4. **Sesiones flexibles**: modo 15 / 30 / 90 minutos para el mismo currículo, sin penalizar por cerrar la app; reanudar último ejercicio.
5. **Al aprender importa el recuerdo, no el tiempo de consumo**. Medir primeras escuchas, corrección después de ayuda, revisión diferida y transferencia a otra paráfrasis.
6. **Feedback honesto**: comprensión y contenido estructurado inmediato son viables con reglas; voz fonética seguirá experimental mientras Q4 no sea fiable; mostrar `no evaluado` en vez de porcentaje inventado.
7. **Diseño móvil limpio**: tres destinos predominantes «Hoy», «Practicar», «Progreso», biblioteca/accesos secundarios; jerarquía tipográfica y tarjetas consistentes, estados de carga claros y una acción principal por pantalla.
8. **No copiar código propietario**: reproducir patrones pedagógicos/interactivos observables en productos comerciales; usar solo bibliotecas abiertas con licencia compatible después de revisar seguridad y tamaño.

## Ingeniería inversa aplicable — sin copiar productos

- **Duolingo**: ruta guiada, lecciones pequeñas y práctica de errores integrada (https://blog.duolingo.com/new-duolingo-home-screen-design/, https://blog.duolingo.com/guide-to-duolingo-practice-hub/).
- **Speak**: aprender → practicar → aplicar, repetición deliberada y situaciones reales (https://www.speak.com/; https://help.speak.com/en/articles/11396739-what-is-speak-tutor). No prometer chat oral AI irrestricto con presupuesto 0.
- **Busuu**: revisión de vocabulario con fuerza y calendario (https://help.busuu.com/hc/en-gb/articles/16911730266513-What-is-Vocabulary-Review).
- **ELSA**: feedback por sonido, estrés y entonación como referencia de interacción (https://elsaspeak.com/en/faqs/how-does-elsas-pronunciation-feedback-work); no replicar semáforos de acierto con Q4 sin validación.
- **Ciencia de aprendizaje**: recuperación activa y práctica espaciada (https://doi.org/10.1038/s44159-022-00089-1).
- Código abierto **candidato**, no agregado aún: `ts-fsrs` MIT (https://github.com/open-spaced-repetition/ts-fsrs) para repetición espaciada, `idb-keyval` Apache-2.0 (https://github.com/jakearchibald/idb-keyval) para persistencia; `Playwright` Apache-2.0 (https://github.com/microsoft/playwright) para E2E. Revisar dependencias, tamaño y compatibilidad GitHub Pages. Preferir máquina de estados pequeña propia si evita dependencia innecesaria.

## Arquitectura evolutiva, no reescritura

```
src/
  experience/
    session-controller.js      // Sesión/estado única: idle, playing, answering, feedback, retry, complete
    session-plan.js            // cola 15/30/90 min, 60/40 contenido
    feedback-router.js         // feedback por evidencia, nunca métricas falseadas
    review-queue.js            // errores y repetición
    progress-aggregate.js      // lectura unificada, sin sobrescribir legacy
  ui/
    learning-shell.css         // capa visual sobre estilos existentes
    lesson-controls.js         // acciones consistentes para todos los modos
  listening/                   // conservar: bank/engine/listening-lab, adaptar
  phonetics/                   // conservar Q4 experimental
  legacy/                      // conservar islas/entrevistas, adaptar
```
Persistencia `vox_stage0_preview__learning_v2` con backup/restauración, esquema/versionado y migración read-through. Evitar reescribir claves antiguas; audio privado efímero por defecto.

## Secuencia de ejecución

### Fase A — P0: dejar de frustrar (PR separado)
- Corregir escuchar después de responder, repetir misma pregunta en modo práctica sin doble puntuación, grabar/detener/reintentar sin bloqueo.
- Separar ciclo de MediaRecorder y fin de Web Speech; TTS solo habilita respuesta cuando inicia o presenta alternativa clara.
- Centralizar máquina mínima de estados de interacción, con idempotencia y cancelación por navegación.
- Crear matriz e2e navegando `tocar → tocar otra vez → salir → regresar → recargar` para cada botón.
**Gate A**: 0 botones mudos en 3 ciclos seguidos de 20 flujos críticos, Chrome Android real; no regresiones de islas/diagnóstico.

### Fase B — P1: ruta de aprendizaje
- Inicio «Hoy» con objetivo unificado 15/30/90 min, CTA único y próximo ejercicio.
- Reutilizar `listen`, `pronounce`, `interview`, `islands` como pasos del entrenador, sin crear cuatro sistemas nuevos.
- Reanudar pregunta inacabada después de reinicio. Ocultar herramientas técnicas en Ajustes.
- Ajustar dificultad con evidencia de últimos intentos, no declarar B2 logrado solo por minutos.
**Gate B**: usuario sin instrucciones externas puede iniciar, detener, reanudar y explicar el objetivo en una sesión; restablece progreso tras reload.

### Fase C — P1: feedback y transferencia real
- `Listening`: primera escucha, evidencia de palabra/pista, otra paráfrasis y pregunta libre.
- `Entrevista`: rúbrica transparente STAR, pertinencia, claridad, ejemplo; feedback basado en texto cuando haya transcripción y autoevaluación guiada sin ella.
- `Pronunciación`: grabar/reproducir/grabar otra vez; Q4 solo exploratorio. Ayudas articulatorias provenientes de guías predefinidas, no inferidas de un diagnóstico inválido.
- Revisiones con cola `Again/Hard/Good/Easy`, nunca «dominado» solo por un acierto de STT.
**Gate C**: al fallar, el sistema recomienda qué practicar y evidencia progreso cuando mejora una habilidad en nuevos ejemplos.

### Fase D — P2: acabado premium
- Navegación reducida y consistente, transiciones y estados accesibles, tamaños táctiles ≥44 px, sonido/háptica solo opt-in y sin recompensas que incentiven consumo vacío.
- Biblioteca de situaciones y audio variedad de voces/velocidades/licencias; progresión A2→B1→B2 funcional.
- Telemetría **local y opt-in**, no recolectar audios privados; auditoría de caché y actualización.
**Gate D**: uso agradable sin instrucciones técnicas, 90 minutos productivos disponibles por elección, no obligatorios.

## Diseño del loop estándar

**Escucha sin texto** → **elige intención** → **por qué acertaste/fallaste** → **Escuchar otra vez** (nunca bloqueado) → **Repetir con la voz** (audio local) → **Responder variación** → **Guardar en repaso** → **Siguiente**.

- `Reproducir otra vez`: acción siempre válida, incluyendo en feedback, no altera contador.
- `Intentar otra vez`: conserva misma pregunta, etiqueta práctica sin duplicar acierto estadístico.
- `No puedo escuchar`: texto alternativo no puntuado y reporte TTS.
- `Cambiar de pantalla`: no deja micrófonos ni síntesis colgados.
- `Terminar por hoy`: guarda progreso sin castigo.
- `Continuar`: vuelve al paso/ejercicio sin saltarlo.

## Matriz de QA necesaria antes de publicar

| Escenario | Primer uso | Segundo uso | Después de volver | Después de recargar |
|---|---|---|---|---|
| Escuchar pregunta / repetir | ✓ | ✓ | ✓ | ✓ |
| Contestar / revisar / repetir misma | ✓ | ✓ | ✓ | ✓ |
| Voz TTS error y fallback a texto | ✓ | ✓ | ✓ | ✓ |
| Grabar / detener / reproducir audio | ✓ | ✓ | ✓ | ✓ |
| Cambiar frase durante grabación | ✓ | ✓ | ✓ | ✓ |
| Entrevista texto / oral sin STT | ✓ | ✓ | ✓ | ✓ |
| Islas crear / regresar / repetir | ✓ | ✓ | ✓ | ✓ |
| Diagnóstico iniciar / pausar / retomar | ✓ | ✓ | ✓ | ✓ |
| Historial / migración / backup | ✓ | ✓ | ✓ | ✓ |
| Service worker / refresh / nueva versión | ✓ | ✓ | ✓ | ✓ |

Los símbolos ✓ aquí representan **criterios a demostrar, NO resultados de pruebas ya ejecutadas**.

## Métricas útiles (no vanidad)

- Tasa de respuesta correcta en primera escucha; % con ayuda; retención a 1 y 7 días.
- Transferencia: interpretar la misma intención con **nueva formulación**.
- Repeticiones y reintentos completados sin bloquear; fallos por 100 acciones; sesión reanudada.
- % de actividades con feedback útil; dificultad por tema; recomendaciones seguidas.
- Tiempo real de práctica activa, no tiempo total en pantalla.
- No «pronunciación 100%», «B2 certificado» o «fluidez evaluada» sin medición real.

## Restricciones y límites auditados

- No hubo captura de sesión real Android ni test E2E completo en este informe: los bugs F-01 y el mecanismo F-02 provienen de lectura de código. F-11 es hipótesis.
- Nada de claves Azure ni APIs con coste sin consentimiento separado.
- Nunca fusionar el plan completo en un megacommit; entregas pequeñas con pruebas y posibilidad de rollback.
- Al pasar a `main`, GitHub Pages se actualizará: requiere aprobación específica del contenido probado.
