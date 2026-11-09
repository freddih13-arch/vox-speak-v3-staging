/** 30 authored role-play cases: 18 B2B/fintech + 12 everyday. Not simulated AI conversations.
 * Three human-authored turns per case; guidance is self-check, never a CEFR or phonetic score. */
export const SCENARIOS=Object.freeze([
  {
    "id": "scenario-01",
    "domain": "professional",
    "role": "Recruiter",
    "topic": "Presentación profesional",
    "q": "Tell me about a business result you are proud of.",
    "followUp": "How did you measure your contribution?",
    "challenge": "Could you explain the same result without using numbers?",
    "model": "I helped a team improve its sales process by organizing follow-ups and focusing on customer needs. We measured progress through conversion and repeat business.",
    "tip": "Describe situación, acción, resultado y aprendizaje; utiliza datos reales, no inventados.",
    "keys": [
      "result",
      "improved",
      "measured"
    ],
    "chunks": [
      "One result I am proud of",
      "The main impact was"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-02",
    "domain": "professional",
    "role": "Sales Manager",
    "topic": "Discovery comercial",
    "q": "A prospect says their current process is working fine. What do you ask?",
    "followUp": "Which stakeholders should you involve?",
    "challenge": "They refuse a demo. How would you keep the conversation useful?",
    "model": "I would ask what is working and what takes the most time. Then I would explore potential gaps before suggesting a product demonstration.",
    "tip": "Pregunta antes de vender; valida el problema y el costo de no cambiar.",
    "keys": [
      "ask",
      "process",
      "problem"
    ],
    "chunks": [
      "What is working well today?",
      "What happens when"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-03",
    "domain": "general",
    "role": "New colleague",
    "topic": "Presentarse naturalmente",
    "q": "You meet a colleague at an event. How do you introduce yourself?",
    "followUp": "Ask them what they enjoy outside work.",
    "challenge": "They answer very quickly. How can you ask for clarification?",
    "model": "Hi, I am glad we met. I work in business development and I enjoy exploring new places. What do you like doing in your free time?",
    "tip": "Inicia, pregunta de vuelta y mantén un tono conversacional.",
    "keys": [
      "nice",
      "work",
      "you"
    ],
    "chunks": [
      "Nice to meet you",
      "What about you?"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-04",
    "domain": "professional",
    "role": "Procurement Lead",
    "topic": "Objeción de precio",
    "q": "Your client says your solution is too expensive. What do you say?",
    "followUp": "What if they demand a discount immediately?",
    "challenge": "They compare only the monthly fee. How can you shift toward value?",
    "model": "I understand the price concern. Could we compare the total cost of the current process and the savings your team expects?",
    "tip": "Reconoce la objeción y explora impacto antes de ofrecer descuento.",
    "keys": [
      "cost",
      "value",
      "understand"
    ],
    "chunks": [
      "I understand your concern",
      "Could we compare"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-05",
    "domain": "general",
    "role": "Friend",
    "topic": "Reprogramar un plan",
    "q": "You cannot make dinner on Friday. How would you let your friend know?",
    "followUp": "Offer an alternative time.",
    "challenge": "Your friend is disappointed. Respond with empathy.",
    "model": "I am sorry, but I cannot make it on Friday. Could we meet on Sunday instead? I was really looking forward to seeing you.",
    "tip": "Disculpa breve, motivo sin exceso y alternativa concreta.",
    "keys": [
      "sorry",
      "friday",
      "instead"
    ],
    "chunks": [
      "I cannot make it",
      "Would Sunday work?"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-06",
    "domain": "professional",
    "role": "Fintech Merchant",
    "topic": "Adopción fintech",
    "q": "A merchant accepts cards but barely uses the payment terminal. What do you ask?",
    "followUp": "What evidence would show greater adoption?",
    "challenge": "The merchant is afraid of technical problems. What would you offer?",
    "model": "I would ask when they prefer cash and what concerns they have. Then I would suggest a simple trial and review the results together.",
    "tip": "Detecta fricción, propone piloto y define señal verificable.",
    "keys": [
      "merchant",
      "payments",
      "trial"
    ],
    "chunks": [
      "What prevents you from",
      "We could test"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-07",
    "domain": "professional",
    "role": "Product Manager",
    "topic": "Trabajo con producto",
    "q": "A feature promised to a client is delayed. How do you communicate it?",
    "followUp": "How do you coordinate internally without promising a date you cannot guarantee?",
    "challenge": "The client asks for certainty. What can you commit to?",
    "model": "I would explain the confirmed status, the business impact and the next update. I would avoid promising a release date until product confirms it.",
    "tip": "Distingue hechos, hipótesis y compromisos.",
    "keys": [
      "update",
      "timeline",
      "client"
    ],
    "chunks": [
      "Here is what we know",
      "I will update you"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-08",
    "domain": "general",
    "role": "Tourist",
    "topic": "Pedir indicaciones",
    "q": "You are lost near a train station. Ask someone for directions.",
    "followUp": "Confirm which bus you need.",
    "challenge": "You did not understand the instructions. Ask them to repeat.",
    "model": "Excuse me, could you help me get to the station? Should I take this bus or walk? Could you repeat the last part more slowly?",
    "tip": "Usa preguntas cortas y confirma el punto clave.",
    "keys": [
      "station",
      "bus",
      "repeat"
    ],
    "chunks": [
      "Could you tell me",
      "Did you mean"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-09",
    "domain": "professional",
    "role": "Sales Director",
    "topic": "Priorización de pipeline",
    "q": "You have twenty opportunities and limited time. How do you prioritize them?",
    "followUp": "What data would change your ranking?",
    "challenge": "A large opportunity has no clear decision maker. What do you do?",
    "model": "I would prioritize fit, urgency, access to a decision maker and potential value. I would qualify the large deal before treating it as committed revenue.",
    "tip": "Explica trade-offs y riesgos de pronóstico.",
    "keys": [
      "priority",
      "fit",
      "decision"
    ],
    "chunks": [
      "I would prioritize",
      "The main risk is"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-10",
    "domain": "general",
    "role": "Travel companion",
    "topic": "Preferencias y acuerdos",
    "q": "Your friends want to visit a museum but you prefer a hike. Explain your preference.",
    "followUp": "Offer a compromise.",
    "challenge": "One friend disagrees strongly. Respond politely.",
    "model": "I would rather go hiking because the weather is great. How about a short walk this morning and the museum in the afternoon?",
    "tip": "Expresa opinión, razón y propuesta flexible.",
    "keys": [
      "prefer",
      "because",
      "how about"
    ],
    "chunks": [
      "I would rather",
      "How about we"
    ],
    "level": "B1 base"
  },
  {
    "id": "scenario-11",
    "domain": "professional",
    "role": "SaaS Founder",
    "topic": "Renovación SaaS",
    "q": "A customer is considering leaving your software. How do you investigate why?",
    "followUp": "Which usage signals matter most?",
    "challenge": "They say another tool is cheaper. What do you ask next?",
    "model": "I would ask which outcomes are missing and examine product adoption. Then I would compare the actual impact of both options, not just the subscription price.",
    "tip": "Explora adopción, resultados e intención real de churn.",
    "keys": [
      "outcomes",
      "usage",
      "alternative"
    ],
    "chunks": [
      "What outcome is missing?",
      "Beyond price"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-12",
    "domain": "professional",
    "role": "Procurement",
    "topic": "Negociar condiciones",
    "q": "A prospect wants an unrealistic implementation deadline. How do you respond?",
    "followUp": "What could you trade without compromising delivery quality?",
    "challenge": "They insist on signing today. What needs written agreement?",
    "model": "I would confirm their deadline and explain the constraints. We could agree on a phased rollout with milestones and clear ownership.",
    "tip": "Negocia el alcance, no prometas capacidades inexistentes.",
    "keys": [
      "timeline",
      "milestones",
      "scope"
    ],
    "chunks": [
      "We can agree on",
      "The trade-off would be"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-13",
    "domain": "general",
    "role": "Airline Staff",
    "topic": "Retraso de viaje",
    "q": "Your flight is delayed and you have a connection. Ask for assistance.",
    "followUp": "Ask about alternative routes.",
    "challenge": "The agent cannot help right away. What do you request?",
    "model": "My flight is delayed and I may miss my connection. Could you check alternative flights and tell me when I will receive an update?",
    "tip": "Describe el problema, pide opciones y confirma próximo paso.",
    "keys": [
      "flight",
      "connection",
      "options"
    ],
    "chunks": [
      "I may miss",
      "Could you check"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-14",
    "domain": "professional",
    "role": "Revenue Operations",
    "topic": "Métricas de ventas",
    "q": "Your sales team has many meetings but few closed deals. Explain what you would investigate.",
    "followUp": "How could you test your hypothesis?",
    "challenge": "The CEO demands a quick fix. How do you set expectations?",
    "model": "I would review lead quality, qualification and conversion between stages. Then I would test one change, track results and avoid assuming more meetings means more revenue.",
    "tip": "Crea hipótesis y una métrica para probarla.",
    "keys": [
      "conversion",
      "quality",
      "test"
    ],
    "chunks": [
      "My hypothesis is",
      "We should measure"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-15",
    "domain": "general",
    "role": "Coworker",
    "topic": "Resolver un malentendido",
    "q": "You accidentally double-booked a meeting. Explain what happened.",
    "followUp": "Suggest a new time and check availability.",
    "challenge": "They seem upset. How can you repair the relationship?",
    "model": "I am sorry, I made a scheduling mistake. Could we move our meeting to tomorrow morning? I understand this caused an inconvenience.",
    "tip": "Reconoce responsabilidad, ofrece solución y no culpes a terceros.",
    "keys": [
      "sorry",
      "meeting",
      "tomorrow"
    ],
    "chunks": [
      "I made a mistake",
      "Would tomorrow work?"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-16",
    "domain": "professional",
    "role": "Key Account",
    "topic": "Escalación de cliente",
    "q": "A key customer reports repeated payment failures. How do you handle the conversation?",
    "followUp": "What facts do you need from support and engineering?",
    "challenge": "The customer threatens to cancel. Respond without overpromising.",
    "model": "I would acknowledge the impact, collect transaction examples and coordinate a confirmed escalation. I would provide a clear update time and follow up after resolution.",
    "tip": "Prioriza impacto, evidencia, responsables y seguimiento.",
    "keys": [
      "impact",
      "support",
      "update"
    ],
    "chunks": [
      "I understand the impact",
      "Here is our next step"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-17",
    "domain": "professional",
    "role": "Remote Team Lead",
    "topic": "Alineación remota",
    "q": "Your remote teammates disagree about the next priority. How do you align them?",
    "followUp": "What would you document after the meeting?",
    "challenge": "A teammate stays silent. Invite their perspective.",
    "model": "I would restate the shared goal, ask about constraints and propose a measurable priority. I would document the owner, deadline and next checkpoint.",
    "tip": "Facilita consenso, no solo órdenes.",
    "keys": [
      "goal",
      "priority",
      "owner"
    ],
    "chunks": [
      "What is the shared goal?",
      "Can I hear your view?"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-18",
    "domain": "general",
    "role": "Receptionist",
    "topic": "Cita y confirmación",
    "q": "You need to move an appointment to next week. Explain your request.",
    "followUp": "Check whether morning appointments are available.",
    "challenge": "Confirm the date, time and location aloud.",
    "model": "Hello, I need to reschedule my appointment. Do you have anything on Tuesday morning? Let me confirm the address and time.",
    "tip": "Pide, confirma y reformula para evitar errores.",
    "keys": [
      "appointment",
      "tuesday",
      "confirm"
    ],
    "chunks": [
      "Could I reschedule",
      "Let me confirm"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-19",
    "domain": "professional",
    "role": "CFO",
    "topic": "Venta multistakeholder",
    "q": "Your champion supports your proposal, but the CFO is unconvinced. What do you ask?",
    "followUp": "How would you build a mutual action plan?",
    "challenge": "IT raises a security concern before approval. What do you do?",
    "model": "I would ask the CFO what business case they need to see, then align finance, IT and operations around measurable acceptance criteria and a shared timeline.",
    "tip": "Demuestra coordinación con comité de compra y criterio de inversión.",
    "keys": [
      "finance",
      "business",
      "criteria"
    ],
    "chunks": [
      "What would justify",
      "To move forward"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-20",
    "domain": "general",
    "role": "Shop Assistant",
    "topic": "Devolución de compra",
    "q": "You received a damaged product. Ask for an exchange or refund politely.",
    "followUp": "Explain when you purchased it.",
    "challenge": "The assistant says refunds are not possible. Ask about alternatives.",
    "model": "I bought this yesterday, but it arrived damaged. Could I exchange it or receive a refund? If not, what other option is available?",
    "tip": "Habla con firmeza y cortesía; conserva precisión temporal.",
    "keys": [
      "bought",
      "damaged",
      "exchange"
    ],
    "chunks": [
      "It arrived damaged",
      "What are my options?"
    ],
    "level": "B1+ transferencia"
  },
  {
    "id": "scenario-21",
    "domain": "professional",
    "role": "VP Sales",
    "topic": "Challenger insight",
    "q": "Your prospect believes their main problem is price. Offer a different perspective.",
    "followUp": "Which data would make your insight credible?",
    "challenge": "They challenge your assumption. How do you respond?",
    "model": "Price may not be the main cost. We should also examine delays, manual work and lost sales. I would validate that hypothesis with their data before recommending a change.",
    "tip": "Explica una perspectiva sin afirmar hipótesis como hechos.",
    "keys": [
      "cost",
      "manual",
      "data"
    ],
    "chunks": [
      "Another cost to consider",
      "We could validate"
    ],
    "level": "B2 preparación"
  },
  {
    "id": "scenario-22",
    "domain": "professional",
    "role": "Implementation Lead",
    "topic": "Migración de datos",
    "q": "A customer fears switching from spreadsheets to a platform. How do you propose a safe pilot?",
    "followUp": "What should be measured during the pilot?",
    "challenge": "They already had a failed software implementation. How do you address it?",
    "model": "I would start with a limited data sample, agree on success criteria and run a parallel process before full migration. Their team should approve every milestone.",
    "tip": "Riesgo, piloto y plan de reversión claros.",
    "keys": [
      "pilot",
      "data",
      "criteria"
    ],
    "chunks": [
      "We could start with",
      "Our success criteria"
    ],
    "level": "B2 preparación"
  },
  {
    "id": "scenario-23",
    "domain": "general",
    "role": "New friend",
    "topic": "Mantener conversación",
    "q": "You meet someone from another country. Ask about their hometown.",
    "followUp": "Tell a brief story about your own city.",
    "challenge": "You do not know a word. Rephrase without switching to Spanish.",
    "model": "What is your hometown like? I live in a city surrounded by mountains. I enjoy how easy it is to reach nature from here.",
    "tip": "Haz preguntas abiertas y amplía con una experiencia concreta.",
    "keys": [
      "hometown",
      "city",
      "nature"
    ],
    "chunks": [
      "What is it like?",
      "What I enjoy is"
    ],
    "level": "B2 preparación"
  },
  {
    "id": "scenario-24",
    "domain": "professional",
    "role": "CFO",
    "topic": "Justificar inversión",
    "q": "A CFO asks why investing this quarter matters. How do you build the case?",
    "followUp": "What assumptions would you disclose?",
    "challenge": "The forecast seems optimistic. Revise your claim.",
    "model": "I would compare the implementation cost with the verified savings and potential upside. I would present a conservative case and identify the assumptions that still require validation.",
    "tip": "Usa rangos razonables y no inventes ROI.",
    "keys": [
      "investment",
      "cost",
      "assumptions"
    ],
    "chunks": [
      "The conservative case",
      "We still need to validate"
    ],
    "level": "B2 preparación"
  },
  {
    "id": "scenario-25",
    "domain": "general",
    "role": "Colleague",
    "topic": "Defender una opinión",
    "q": "A colleague thinks remote work always reduces productivity. Explain your view.",
    "followUp": "Give an example that supports your argument.",
    "challenge": "They disagree. Acknowledge their concern and refine your view.",
    "model": "I see why communication can be harder remotely, but clear goals and regular updates can help. It depends on the team and the type of work.",
    "tip": "Opinión + matiz + evidencia + concesión.",
    "keys": [
      "remote",
      "depends",
      "team"
    ],
    "chunks": [
      "I see your point",
      "It depends on"
    ],
    "level": "B2 preparación"
  },
  {
    "id": "scenario-26",
    "domain": "professional",
    "role": "Sales Engineer",
    "topic": "Demo de producto",
    "q": "You have fifteen minutes to demonstrate a complex product. How do you choose what to show?",
    "followUp": "How will you check whether the audience understood the value?",
    "challenge": "The prospect asks about a feature you have never tested. How do you respond?",
    "model": "I would show one workflow tied to their priority outcome, confirm the impact and follow up on technical questions I cannot verify during the call.",
    "tip": "Prioriza caso de uso y evita afirmaciones técnicas no verificadas.",
    "keys": [
      "outcome",
      "workflow",
      "confirm"
    ],
    "chunks": [
      "Let me show you",
      "I will confirm that"
    ],
    "level": "B2 preparación"
  },
  {
    "id": "scenario-27",
    "domain": "professional",
    "role": "Security Officer",
    "topic": "Objeción de seguridad",
    "q": "A potential enterprise client questions data security. How do you respond?",
    "followUp": "Which evidence should the technical team provide?",
    "challenge": "They ask for a guarantee you cannot offer. What do you say?",
    "model": "I would acknowledge their requirements, involve our security team and share verified documentation. I would not promise a specific certification or guarantee without evidence.",
    "tip": "Reconoce límites de conocimiento y coordina especialistas.",
    "keys": [
      "requirements",
      "security",
      "documentation"
    ],
    "chunks": [
      "I want to verify",
      "Our security team"
    ],
    "level": "B2 preparación"
  },
  {
    "id": "scenario-28",
    "domain": "general",
    "role": "Neighbor",
    "topic": "Problema en casa",
    "q": "A water leak is affecting your apartment. Explain the problem to your landlord.",
    "followUp": "Ask when someone can inspect it.",
    "challenge": "The repair is delayed. Request a clear update politely.",
    "model": "There is a water leak under the sink and the floor is getting wet. Could someone inspect it today? Please let me know the expected repair time.",
    "tip": "Describe urgencia sin dramatizar; pide acción concreta.",
    "keys": [
      "leak",
      "repair",
      "time"
    ],
    "chunks": [
      "There is a leak",
      "Could someone inspect"
    ],
    "level": "B2 preparación"
  },
  {
    "id": "scenario-29",
    "domain": "professional",
    "role": "Executive Buyer",
    "topic": "Cierre ejecutivo",
    "q": "Your enterprise buyer agrees on value but wants to delay the decision. How do you uncover the real blocker?",
    "followUp": "Propose a mutual action plan with the stakeholders.",
    "challenge": "The buyer asks for a discount and immediate signature. Negotiate next steps.",
    "model": "I would ask what needs to be resolved before approval, identify the decision process and agree on next steps. I would not trade price without understanding scope and value.",
    "tip": "Ejecuta conversación consultiva, sin presionar un cierre ficticio.",
    "keys": [
      "approval",
      "decision",
      "next"
    ],
    "chunks": [
      "What still needs to happen?",
      "Can we agree on"
    ],
    "level": "B2 preparación"
  },
  {
    "id": "scenario-30",
    "domain": "general",
    "role": "Travel Friend",
    "topic": "Conversación espontánea",
    "q": "A friend invites you to a last-minute weekend trip. Explain whether you can join.",
    "followUp": "Ask about the budget and transport plan.",
    "challenge": "Something unexpected changes. Suggest a new plan confidently.",
    "model": "That sounds exciting. I need to check my schedule and budget first. Could you tell me how we are getting there? We can adjust the plan if needed.",
    "tip": "Decide, pregunta y negocia alternativas en inglés.",
    "keys": [
      "schedule",
      "budget",
      "plan"
    ],
    "chunks": [
      "That sounds exciting",
      "Could we adjust"
    ],
    "level": "B2 preparación"
  }
].map(s=>Object.freeze(s)));
