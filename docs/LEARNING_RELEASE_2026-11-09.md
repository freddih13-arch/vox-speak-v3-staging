# VOX Speak 3.0 · Release de aprendizaje (9 noviembre 2026)

## Veredicto del políglota
La versión anterior tenía un núcleo útil de listening (60 preguntas), shadowing y audio local, pero el cuarto paso de cada sesión reciclaba una lista de entrevistas cortas y daba retroalimentación basada en palabras clave. Eso no bastaba para practicar producción espontánea ni transferencia al B2.

## Decisiones pedagógicas implementadas
- Conserva 30 sesiones y sus 120 actividades para **no destruir** el progreso registrado con el esquema v1.
- El paso 4 ahora contiene **30 casos distintos**; cada caso tiene una pregunta inicial, una repregunta y un giro inesperado (90 turnos escritos y revisables). 18 escenarios son profesionales y 12 cotidianos.
- Progresión editorial: primeras 10 sesiones B1 base, siguientes 10 B1+ transferencia, últimas 10 preparación B2. No afirma certificación B2, y la dificultad todavía no se personaliza automáticamente por errores.
- Intensidad seleccionable: 15 minutos (1 ronda), 30 minutos (2 rondas), 45 minutos (3 rondas). Son **tiempos orientativos**, no temporizadores ni minutos garantizados.
- Repaso de listening: se debe escuchar el audio y escoger el significado correcto para cerrar el repaso. Pulsar «Ver texto» no lo elimina.
- Respuesta propia: las palabras clave son pistas, no notas automáticas. Los ejemplos son referencias. No se inventan resultados profesionales del usuario.

## Trabajo del ingeniero
- Entrenador: `src/coach/coach.js`; currículo: `src/coach/scenarios.js`; persistencia compatible: `src/coach/curriculum.js`.
- Audio: mantiene la grabación local `MediaRecorder` y añade en Coach un botón explícito **«Solo grabar · sin transcribir»** que no necesita `SpeechRecognition`. Se conserva el reproductor local en el mismo paso.
- Comparación `src/coach/voice-feedback.js`: alineación textual mediante distancia de edición, chips para palabras reconocidas/no reconocidas y guía IPA consultable. **No** es corrección automática de fonemas.
- `src/phonetics/ipa-guide.js` añade articulación de hasta tres sonidos presentes en una frase, con avisos explícitos de que no son errores individuales detectados.
- Protege la versión 2.1: se modifica exclusivamente `freddih13-arch/vox-speak-v3-staging`; claves de almacenamiento `vox_stage0_preview__...`; limpieza de caché limitada a prefijo `vox-v3-`.
- El progreso de 30 sesiones existente sigue intacto, sin migración destructiva. La preferencia de duración añade un campo opcional `sessionMinutes`, por defecto 30.

## Cómo estudiar desde hoy
1. Abre la app publicada en Chrome para Android y pulsa «Comenzar/Retomar mi sesión».
2. Elige 15, 30 o 45 minutos en Inicio; el modo de 30 es el recomendado.
3. Escucha las dos preguntas SIN leerlas; si no sale audio, revela el texto, sin puntuación.
4. Haz shadowing de la frase, consulta IPA, reproduce el modelo y tu voz; usa el modo **Solo grabar** si falla la transcripción.
5. Responde con tu experiencia en la conversación guiada: la repregunta exige ampliar la idea y la tercera ronda cambia las condiciones.
6. Repasa errores sin mirar el texto. Reproduce primero el audio; la comprensión se verifica al elegir la intención.
7. Exporta el progreso periódicamente. No hay cuenta, sincronización entre dispositivos ni copia del audio en la nube desde VOX. La transcripción de Chrome puede usar servicios externos.

## Limitaciones relevantes
- Un entorno Chromium simulado comprueba los controles, pero **no sustituye** una prueba de micrófono/TTS y `SpeechRecognition` en el dispositivo Android real.
- El vocabulario IPA se calcula sobre palabras del diccionario: no representa pronunciación conectada, prosodia ni tu pronunciación real.
- El laboratorio fonético Q4 se conserva **experimental**, sin calificaciones automáticas por sonido, y la revisión de respuestas libres no es evaluación gramatical integral.
- La versión construye práctica comunicativa realista con guiones; **no es** un interlocutor generativo adaptativo ni una garantía de B2 en 30 días.
- Los casos profesionales piden usar información real; no atribuyen cifras inventadas al usuario.

## Umbral de publicación
1. `npm test` en verde.
2. Tests de navegador: Coach, Listening, Islas + IPA + 3 grabaciones, voz clásica, laboratorio fonético y diagnóstico, todos en verde.
3. PR fusionada solo en `vox-speak-v3-staging/main` después del check.
4. GitHub Pages debe reportar `built` en el mismo commit que `main`.
5. SHA de `vox-speak-free/main` sin modificaciones.

## Siguiente evaluación humana
Tras practicar 2–3 días, registrar si el micrófono de Android funciona en 3 ciclos seguidos y si las repreguntas exigen producción propia. No ampliar alcance sin evidencia de uso.
