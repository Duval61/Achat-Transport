export default async function handler(request, response) {


  const baseApiUrl = "http://54.247.248.45:5000"; // Votre API non sécurisée

  try {
    // Récupération des données JSON envoyées par votre frontend
    const {endpoint, donnees} = request.body;

        if (!endpoint) {
      return response.status(400).json({ error: "L'endpoint est requis." });
    }

    // On reconstruit l'URL finale (Ex: http://192.168.1)
    const urlApiFinal = `${baseApiUrl}${endpoint}`;


    // Transfert des données vers l'API tierce en HTTP
    const apiResponse = await fetch(urlApiFinal, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json'
        // Ajoutez ici d'autres en-têtes si l'API tierce demande une clé (ex: Authorization)
      },
      body: JSON.stringify(donnees) // On retransmet le JSON
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
