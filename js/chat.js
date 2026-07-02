/* ════════════════════════════════════
   AI SALES AGENT — Moteur de conversation (agent n8n)
   ════════════════════════════════════ */

const MIN_TYPING_MS = 500;
const LEAD_MARKER = '[LEAD_COMPLET]';
const WELCOME_MESSAGE = "Bonjour 👋 Je suis Alex, votre assistant commercial Automex. Je suis là pour vous aider à trouver la solution idéale en énergie solaire. Comment puis-je vous aider aujourd'hui ?";
const ERROR_MESSAGE = "Désolé, je rencontre un souci technique en ce moment 😕 Vous pouvez me réécrire dans un instant, ou nous contacter directement sur WhatsApp : +229 50 13 18 05 ou par email : contact@automex.ai";

const BOT_AVATAR_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></svg>';

// Historique envoyé à l'agent n8n à chaque tour (rôles "user"/"assistant").
const conversationHistory = [
  { role: 'assistant', content: WELCOME_MESSAGE }
];

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

function setInputEnabled(enabled) {
  chatInput.disabled = !enabled;
  chatSend.disabled = !enabled;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cherche le marqueur [LEAD_COMPLET]{...JSON...} dans la réponse d'Alex.
 * Retourne { displayText, leadData } — leadData est null si le marqueur
 * est absent ou si le JSON est invalide.
 */
function extractLead(replyText) {
  const idx = replyText.indexOf(LEAD_MARKER);
  if (idx === -1) {
    return { displayText: replyText, leadData: null };
  }

  const displayText = replyText.slice(0, idx).trim();
  const jsonPart = replyText.slice(idx + LEAD_MARKER.length).trim();

  try {
    const leadData = JSON.parse(jsonPart);
    return { displayText, leadData };
  } catch (err) {
    console.warn('Impossible de parser le JSON du lead:', err, jsonPart);
    return { displayText, leadData: null };
  }
}

function finalizeConversation(leadData) {
  console.log('AI Sales Agent — Lead complet:', leadData);
  sendToSheets(leadData);
  sendWhatsApp(leadData);
  sendEmail(leadData);
}

async function submitAnswer(rawValue) {
  const value = rawValue.trim();
  if (!value || chatInput.disabled) return;

  addUserMessage(value);
  chatInput.value = '';
  conversationHistory.push({ role: 'user', content: value });

  setInputEnabled(false);
  showTyping();

  try {
    const [reply] = await Promise.all([
      callN8nAgent(conversationHistory),
      wait(MIN_TYPING_MS)
    ]);

    hideTyping();

    const { displayText, leadData } = extractLead(reply);
    if (displayText) addBotMessage(displayText);
    conversationHistory.push({ role: 'assistant', content: reply });

    if (leadData) finalizeConversation(leadData);
  } catch (error) {
    console.error('Erreur conversation n8n:', error);
    hideTyping();
    addBotMessage(ERROR_MESSAGE);
  } finally {
    setInputEnabled(true);
    chatInput.focus();
  }
}

chatSend.addEventListener('click', () => submitAnswer(chatInput.value));
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitAnswer(chatInput.value);
  }
});

addBotMessage(WELCOME_MESSAGE);
