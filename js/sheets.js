/* ════════════════════════════════════
   AI SALES AGENT — Google Sheets
   ════════════════════════════════════ */

/**
 * Synchronise les données du lead avec Google Sheets via le webhook n8n.
 * Appelée à l'étape 8 avec les données collectées par le chat.
 */
async function sendToSheets(data) {
  try {
    const response = await fetch(
      'https://n8n-production-23287.up.railway.app/webhook/sales-agent-lead',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: data.prenom,
          besoin: data.besoin,
          ville: data.ville,
          budget: data.budget,
          email: data.email,
          telephone: data.telephone
        })
      }
    );
    return response.ok;
  } catch (error) {
    console.error('Erreur webhook:', error);
    return false;
  }
}
