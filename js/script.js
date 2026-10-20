document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('vendor-auth-form');
    const trackingInput = document.getElementById('tracking-number');
    const codeInput = document.getElementById('security-code');
    const trackingError = document.getElementById('tracking-error');
    const codeError = document.getElementById('code-error');
    const apiStatus = document.getElementById('api-status');

    // Restriction : Uniquement des chiffres dans le code secret
    codeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        trackingError.textContent = '';
        codeError.textContent = '';
        apiStatus.className = 'status-box hidden';
        
        let isValid = true;
        const trackingValue = trackingInput.value.trim();
        const codeValue = codeInput.value.trim();
        console.log(codeValue);
        

        if (!trackingValue) {
            trackingError.textContent = 'Le numéro de transaction est requis.';
            isValid = false;
        }
        if (!codeValue) {
            codeError.textContent = 'Le code secret doit comporter exactement 4 chiffres.';
            isValid = false;
        }

        if (!isValid) return;

        try {
            apiStatus.className = "status-box success";
            apiStatus.textContent = "Vérification de la transaction...";
            apiStatus.classList.remove('hidden');

            // --- CONNEXION REELLE A L'API BACKEND ---
            const response = await fetch('/api/get-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    trackingNumber: trackingValue,
                    securityCode: codeValue
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Stockage des données reçues pour la page suivante
                sessionStorage.setItem('tf_trackingNumber', trackingValue);
                sessionStorage.setItem('tf_transactionDetails', JSON.stringify(data.transaction));
                
                // Redirection vers le tableau de bord
                window.location.href = 'dashboard-vendor.html';
            } else {
                throw new Error(data.message || 'Accès refusé.');
            }

        } catch (error) {
            apiStatus.className = "status-box error";
            apiStatus.textContent = error.message || "Erreur de connexion avec le serveur.";
        }
    });
});
