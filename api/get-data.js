export default async function handler(request, response) {
  // Optionnel : On vérifie que la méthode est bien un POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const urlApiTierce = "http://54.247.248.45:5000/api/v1/vendor/verify"; // Votre API non sécurisée

  try {
    // Récupération des données JSON envoyées par votre frontend
    const corpsRecu = request.body;

    // Transfert des données vers l'API tierce en HTTP
    const apiResponse = await fetch(urlApiTierce, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Ajoutez ici d'autres en-têtes si l'API tierce demande une clé (ex: Authorization)
      },
      body: JSON.stringify(corpsRecu) // On retransmet le JSON
    });

    if (!apiResponse.ok) {
      return response.status(apiResponse.status).json({ error: "L'API tierce a renvoyé une erreur." });
    }

    // Récupération de la réponse de l'API tierce
    const data = await apiResponse.json();

    // Renvoi des données au frontend en HTTPS
    return response.status(200).json(data);

  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}

