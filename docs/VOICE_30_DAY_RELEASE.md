# VOX Speak 3 — guía de voz para la ruta de 30 sesiones

## Diseño de práctica oral (Android y costo recurrente 0 COP)

La aplicación tiene **dos funcionalidades diferentes** que jamás deben confundirse:

1. **Grabar y comparar mi voz**: MediaRecorder local, reproducir y volver a grabar. Siempre que Android permita captura de audio, funciona aunque Web Speech API no transcriba.
2. **Hablar y revisar palabras**: MediaRecorder más la transcripción de Chrome (que puede utilizar servicios externos). Cuando Chrome emite hipótesis parciales, VOX las muestra como **borrador**, no como una nota. Si hay transcripción final, se visualiza la coincidencia de palabras, sin llamarla calificación fonética. Si el reconocimiento falla, queda el audio local para comparación.

### Referencia IPA

- El mapa léxico está construido offline con entradas del Carnegie Mellon Pronouncing Dictionary (CMUdict), con conversiones ARPABET→IPA y ajustes puntuales de palabras funcionales. Copyright © 1993–2015 Carnegie Mellon University, conservado según la licencia de CMUdict: https://github.com/cmusphinx/cmudict/blob/master/LICENSE. Atribución oficial: https://github.com/cmusphinx/cmudict.
- Es un **IPA de referencia aproximado para palabras aisladas en inglés US**. En inglés conectado hay reducciones, coarticulaciones y variaciones, por lo que una lectura real puede diferir. Las palabras desconocidas en islas personalizadas se señalan sin inventar IPA.
- No se extraen fonemas de la voz del estudiante ni se comparan automáticamente contra una grabación. El modelo ONNX Gruut Q4 sigue experimental y no se usa para asignar notas por fonema.
- En Islas, cada palabra de la frase tiene una ficha IPA táctil para reproducirla lentamente. En las tareas «sin mirar» se oculta hasta revelar.
- El entrenador Coach muestra IPA en las frases y después de revelar la pregunta de entrevista. El entrenamiento clásico de pronunciación también muestra fichas IPA.

### QA y publicación

1. 3 ciclos de grabar, detener, escuchar, volver a grabar sin que desaparezca el botón.
2. Reconocimiento en vivo: texto parcial etiquetado como borrador, el texto final es corregible, errores de red no eliminan audio.
3. Modos Islas: shadowing con fichas IPA, recall/dictado sin filtrar la transcripción antes de revelar.
4. Coach 30, pron clásico, entrevista clásica y diagnóstico conservan botones y avance.
5. Cambiar de frase/pestaña detiene pistas activas y limpia audios temporales; datos y progresos en localStorage no se migran ni se sobrescriben.
6. Tests automatizados en Chrome emulado. **Validación real en el Android del usuario sigue siendo necesaria**: permisos, TTS, STT externo, micrófono, voz US/UK.
7. Cambiar la versión de caché solo en VOX 3, sin purgar cachés de VOX 2.1.

### Limitación pedagógica

ELSA emplea sistemas de evaluación específicos. VOX, de costo 0, no puede ofrecer por ahora una validación comparable por cada fonema. El valor del módulo es escuchar audio modelo, mirar una pronunciación de referencia, grabar tu voz, comparar y repetir. Ninguna «palabra roja» demuestra por sí misma un error articulatorio; puede ser un fallo de transcripción.
