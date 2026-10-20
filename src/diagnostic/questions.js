/** Original VOX content. Prompts are fixed for baseline; never use them as a certified CEFR examination. */
export const QUESTIONS = [
 // 8 listening: five professional, three everyday. English question is NOT displayed until answered.
 {id:'l01',kind:'listen',domain:'professional',en:'Could you walk me through your sales experience?',choices:['¿Podrías explicar tu experiencia en ventas?','¿Puedes reservar una reunión para mañana?','¿Puedes enviarme una factura?'],answer:0},
 {id:'l02',kind:'listen',domain:'professional',en:'What would you do if a client stopped responding?',choices:['¿Cómo respondes a una buena noticia?','¿Qué harías si un cliente dejara de responder?','¿Cuándo llamarías al equipo técnico?'],answer:1},
 {id:'l03',kind:'listen',domain:'professional',en:'How do you prioritize leads in your pipeline?',choices:['¿Cómo fijas precios de productos?','¿Dónde guardas tus contactos?','¿Cómo priorizas prospectos en tu embudo de ventas?'],answer:2},
 {id:'l04',kind:'listen',domain:'professional',en:'What attracted you to this opportunity?',choices:['¿Qué te atrajo de esta oportunidad?','¿Qué experiencia necesitas?','¿Qué objetivos lograste ayer?'],answer:0},
 {id:'l05',kind:'listen',domain:'professional',en:'Could you clarify the payment terms for this contract?',choices:['¿Puedes firmar el contrato?','¿Podrías aclarar las condiciones de pago de este contrato?','¿Puedes reducir el costo del producto?'],answer:1},
 {id:'l06',kind:'listen',domain:'everyday',en:'How long does it take you to get to the gym?',choices:['¿Cuándo terminas tu entrenamiento?','¿Con quién vas al gimnasio?','¿Cuánto tardas en llegar al gimnasio?'],answer:2},
 {id:'l07',kind:'listen',domain:'everyday',en:'Would you mind turning down the music?',choices:['¿Te importaría bajar el volumen de la música?','¿Me puedes recomendar una canción?','¿Quieres escuchar música conmigo?'],answer:0},
 {id:'l08',kind:'listen',domain:'everyday',en:'What do you usually do on weekends?',choices:['¿Qué hiciste el fin de semana pasado?','¿Qué sueles hacer los fines de semana?','¿Dónde estuviste el lunes?'],answer:1},
 // Six active retrieval prompts. Evaluation = exact/reference textual match ONLY; flexible valid alternatives can be self-reported.
 {id:'v01',kind:'vocab',domain:'professional',es:'Superé mis metas de ventas.',refs:['I exceeded my sales targets.','I exceeded my sales goals.']},
 {id:'v02',kind:'vocab',domain:'professional',es:'Construí relaciones sólidas con clientes.',refs:['I built strong relationships with clients.','I built strong client relationships.']},
 {id:'v03',kind:'vocab',domain:'professional',es:'¿Podrías repetir la pregunta, por favor?',refs:['Could you repeat the question, please?','Can you repeat the question, please?']},
 {id:'v04',kind:'vocab',domain:'professional',es:'Trabajo con dueños de pequeñas empresas.',refs:['I work with small business owners.','I work with owners of small businesses.']},
 {id:'v05',kind:'vocab',domain:'everyday',es:'Normalmente me levanto temprano.',refs:['I usually get up early.','I normally get up early.']},
 {id:'v06',kind:'vocab',domain:'everyday',es:'Estoy tratando de mejorar mi inglés.',refs:['I am trying to improve my English.','I am working on improving my English.']},
 // Four intelligibility probes: text recognised by Web Speech is NOT phoneme/accent scoring.
 {id:'p01',kind:'pron',domain:'professional',en:'I negotiated with business owners.',hint:'Haz una pausa y escucha la frase antes de grabarte.'},
 {id:'p02',kind:'pron',domain:'professional',en:'I identified new business opportunities.',hint:'Practica con un ritmo cómodo, sin acelerar artificialmente.'},
 {id:'p03',kind:'pron',domain:'everyday',en:'I usually go to the gym in the morning.',hint:'Concéntrate en que el sistema entienda cada palabra.'},
 {id:'p04',kind:'pron',domain:'everyday',en:'Could you speak a little more slowly?',hint:'No necesitas imitar un acento específico.'},
 // Four oral response probes. User rates self after listening to temporary recording.
 {id:'s01',kind:'speak',domain:'professional',en:'Tell me about a difficult sales challenge you solved.',es:'Cuenta un desafío comercial difícil que hayas resuelto.'},
 {id:'s02',kind:'speak',domain:'professional',en:'How would you explain a payment terminal to a new merchant?',es:'Explica un datáfono a un comerciante nuevo.'},
 {id:'s03',kind:'speak',domain:'everyday',en:'Describe your usual morning routine.',es:'Describe tu rutina habitual de la mañana.'},
 {id:'s04',kind:'speak',domain:'everyday',en:'What would you do if you missed an important appointment?',es:'Explica qué harías si faltaras a una cita importante.'}
];
export const TOTAL=QUESTIONS.length;
