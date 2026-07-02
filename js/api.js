/* ════════════════════════════════════
   AI SALES AGENT — Notifications (API)
   ════════════════════════════════════ */

// Webhook n8n qui pilote la conversation (reçoit { messages } et renvoie { reply }).
const N8N_CHAT_WEBHOOK_URL = 'https://n8n-production-23287.up.railway.app/webhook/sales-agent-chat';

/**
 * Envoie l'historique de conversation au webhook n8n, qui pilote la
 * conversation (IA + logique métier) et renvoie le texte de la réponse
 * d'Alex. Lève une erreur si l'appel échoue.
 */
async function callN8nAgent(messages) {
  const response = await fetch(N8N_CHAT_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });

  if (!response.ok) {
    throw new Error(`Erreur webhook n8n (${response.status})`);
  }

  const data = await response.json();
  return data.reply;
}

/**
 * Envoie une notification WhatsApp instantanée au commercial.
 * Pas encore connecté (WhatsApp Business API / Twilio) —
 * appelée à l'étape 8 pour préparer l'intégration.
 */
function sendWhatsApp(data) {
  console.log('[sendWhatsApp] Notification WhatsApp à envoyer:', data);
}

/**
 * Envoie l'email de confirmation / proposition personnalisée au lead.
 * Pas encore connecté (Formspree, SendGrid, etc.) —
 * appelée à l'étape 8 pour préparer l'intégration.
 */
function sendEmail(data) {
  console.log('[sendEmail] Email de confirmation à envoyer:', data);
}
