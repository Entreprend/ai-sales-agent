/* ════════════════════════════════════
   AI SALES AGENT — Moteur de conversation
   ════════════════════════════════════ */

const TYPING_DELAY = 800;

const BOT_AVATAR_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></svg>';

const data = {
  intent: '',
  prenom: '',
  besoin: '',
  ville: '',
  budget: '',
  email: '',
  telephone: ''
};

const steps = [
  {
    id: 'welcome',
    field: 'intent',
    message: () => "Bonjour 👋 Je suis Alex, votre assistant commercial Automex. Je suis là pour vous aider à trouver la solution idéale en énergie solaire. Comment puis-je vous aider aujourd'hui ?",
    options: ['Demande de devis', 'En savoir plus', 'Parler à un conseiller']
  },
  {
    id: 'nom',
    field: 'prenom',
    message: () => "Avec plaisir ! Pour commencer, puis-je avoir votre prénom ?",
    validate: (v) => v.trim().length > 0 ? null : "Je n'ai pas bien saisi — quel est votre prénom ?"
  },
  {
    id: 'besoin',
    field: 'besoin',
    message: (d) => `Bonjour ${d.prenom} ! Quel est votre besoin principal ?`,
    options: ['Installation résidentielle', 'Installation professionnelle', 'Maintenance / dépannage', 'Demande de devis']
  },
  {
    id: 'ville',
    field: 'ville',
    message: () => "Dans quelle ville êtes-vous situé ?",
    validate: (v) => v.trim().length > 0 ? null : "Merci de préciser votre ville."
  },
  {
    id: 'budget',
    field: 'budget',
    message: () => "Avez-vous une idée de votre budget ?",
    options: ['Moins de 500 000 FCFA', '500 000 — 1 000 000 FCFA', 'Plus de 1 000 000 FCFA', 'Je ne sais pas encore']
  },
  {
    id: 'email',
    field: 'email',
    message: () => "Parfait ! Pour vous envoyer une proposition personnalisée, j'ai besoin de votre email professionnel.",
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
      ? null
      : "Hmm, cette adresse email ne semble pas valide 🤔 Pouvez-vous vérifier et réessayer ?"
  },
  {
    id: 'telephone',
    field: 'telephone',
    message: () => "Et votre numéro WhatsApp ?",
    validate: (v) => /^[+]?[\d\s.-]{8,15}$/.test(v.trim())
      ? null
      : "Ce numéro ne semble pas valide 🤔 Merci de vérifier le format (8 à 15 chiffres)."
  },
  {
    id: 'confirmation',
    field: null,
    message: (d) => `Merci ${d.prenom} 🎉 Voici un résumé de votre demande :\n\n📋 Besoin : ${d.besoin}\n📍 Ville : ${d.ville}\n💰 Budget : ${d.budget}\n📧 Email : ${d.email}\n📱 WhatsApp : ${d.telephone}\n\nUn conseiller vous contactera sous 24h. Bonne journée ! ☀️`
  }
];

let currentStepIndex = 0;
let conversationEnded = false;

const FOLLOWUP_MESSAGE = "Avez-vous d'autres questions ? Je suis là pour vous aider. 😊";
const CONTACT_MESSAGE = "Pour toute question supplémentaire, vous pouvez aussi nous contacter directement sur WhatsApp : +229 50 13 18 05 ou par email : contact@automex.ai";

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setMultilineText(el, text) {
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    el.appendChild(document.createTextNode(line));
    if (i < lines.length - 1) el.appendChild(document.createElement('br'));
  });
}

function addBotMessage(text) {
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.innerHTML = `<div class="msg-avatar">${BOT_AVATAR_SVG}</div><div class="msg-bubble"></div>`;
  setMultilineText(row.querySelector('.msg-bubble'), text);
  chatMessages.appendChild(row);
  scrollToBottom();
  return row;
}

function addUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'msg-row user';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  setMultilineText(bubble, text);
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  scrollToBottom();
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'msg-row bot typing';
  row.id = 'typing-indicator';
  row.innerHTML = `<div class="msg-avatar">${BOT_AVATAR_SVG}</div><div class="msg-bubble"><span></span><span></span><span></span></div>`;
  chatMessages.appendChild(row);
  scrollToBottom();
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function addQuickReplies(options) {
  removeQuickReplies();
  const wrap = document.createElement('div');
  wrap.className = 'quick-replies';
  wrap.id = 'active-quick-replies';
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quick-reply-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => submitAnswer(opt));
    wrap.appendChild(btn);
  });
  chatMessages.appendChild(wrap);
  scrollToBottom();
}

function removeQuickReplies() {
  const el = document.getElementById('active-quick-replies');
  if (el) el.remove();
}

function setInputEnabled(enabled, placeholder) {
  chatInput.disabled = !enabled;
  chatSend.disabled = !enabled;
  chatInput.placeholder = placeholder || 'Écrivez votre message…';
}

function askCurrentStep() {
  const step = steps[currentStepIndex];
  setInputEnabled(false);
  showTyping();
  setTimeout(() => {
    hideTyping();
    addBotMessage(step.message(data));

    if (step.id === 'confirmation') {
      finalizeConversation();
      askFollowUp();
      return;
    }

    if (step.options) addQuickReplies(step.options);
    setInputEnabled(true);
    chatInput.focus();
  }, TYPING_DELAY);
}

function askFollowUp() {
  setInputEnabled(false);
  showTyping();
  setTimeout(() => {
    hideTyping();
    addBotMessage(FOLLOWUP_MESSAGE);
    conversationEnded = true;
    setInputEnabled(true);
    chatInput.focus();
  }, TYPING_DELAY);
}

function submitAnswer(rawValue) {
  const value = rawValue.trim();
  if (!value || chatInput.disabled) return;

  if (conversationEnded) {
    addUserMessage(value);
    chatInput.value = '';
    setInputEnabled(false);
    showTyping();
    setTimeout(() => {
      hideTyping();
      addBotMessage(CONTACT_MESSAGE);
      setInputEnabled(true);
      chatInput.focus();
    }, TYPING_DELAY);
    return;
  }

  const step = steps[currentStepIndex];

  if (step.validate) {
    const error = step.validate(value);
    if (error) {
      addUserMessage(value);
      chatInput.value = '';
      setInputEnabled(false);
      showTyping();
      setTimeout(() => {
        hideTyping();
        addBotMessage(error);
        setInputEnabled(true);
        chatInput.focus();
      }, TYPING_DELAY);
      return;
    }
  }

  addUserMessage(value);
  chatInput.value = '';
  removeQuickReplies();
  if (step.field) data[step.field] = value;

  currentStepIndex++;
  askCurrentStep();
}

function finalizeConversation() {
  console.log('AI Sales Agent — Données collectées:', data);
  sendToSheets(data);
  sendWhatsApp(data);
  sendEmail(data);
}

chatSend.addEventListener('click', () => submitAnswer(chatInput.value));
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitAnswer(chatInput.value);
  }
});

askCurrentStep();
