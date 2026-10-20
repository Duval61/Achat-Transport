document.addEventListener('DOMContentLoaded', () => {


    
    
    // 1. Remplissage dynamique initial à partir du stockage de session
    const trackingNumber = sessionStorage.getItem('tf_trackingNumber');
    const rawDetails = sessionStorage.getItem('tf_transactionDetails');

    if (!trackingNumber || !rawDetails) {
        alert("Session expirée ou invalide. Redirection à l'accueil.");
        window.location.href = 'index.html';
        return;
    }

    const transaction = JSON.parse(rawDetails);
    console.log(transaction);
    
    // Remplissage dynamique des éléments de la section 1
    // (Assurez-vous que vos éléments HTML possèdent ces ID ou adaptez-les)
    document.querySelector('.text-highlight').textContent = transaction.site;
    document.querySelectorAll('.detail-value')[1].textContent = transaction.article;
    document.querySelectorAll('.detail-value')[2].textContent = transaction.price + " €";
    document.querySelectorAll('.detail-value')[3].textContent = transaction.frais + " €";
    const buyerPrice = parseFloat(transaction.price) + parseFloat(transaction.frais)
    document.querySelector('.price-tag').textContent = buyerPrice.toFixed(2) + " €" ;

    // 2. Gestion du formulaire et du pop-up widget
    const mainForm = document.getElementById('collection-details-form');
    const apiStatus = document.getElementById('dashboard-api-status');
    const passwordModal = document.getElementById('password-modal');
    const modalForm = document.getElementById('modal-password-form');
    const passwordInput = document.getElementById('new-password');
    const passwordError = document.getElementById('password-error');
    const btnCancel = document.getElementById('btn-modal-cancel');

    let temporaryPayload = {};
    let isSubmitting = false;

    // Bloquer les dates passées
    document.getElementById('pickup-date').min = new Date().toISOString().split('T')[0];

    mainForm.addEventListener('submit', (e) => {
        e.preventDefault();
         e.stopImmediatePropagation(); 
        if (isSubmitting) return;

        let isValid = true;
        const fields = ['buyer-name', 'buyer-phone', 'buyer-email', 'pickup-address', 'pickup-date', 'pickup-time', 'payment-method'];
        
        temporaryPayload = { trackingNumber };

        fields.forEach(id => {
            const element = document.getElementById(id);
            const errorElement = document.getElementById(`${id}-error`);
            if (errorElement) errorElement.textContent = '';

            if (!element.value.trim()) {
                if (errorElement) errorElement.textContent = 'Ce champ est requis.';
                isValid = false;
            } else {
                // Conversion camelCase pour correspondre aux attentes du backend Node
                const key = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                temporaryPayload[key] = element.value.trim();
                console.log(element.value.trim());
                
            }
        });

        if (isValid) {
            passwordModal.classList.remove('hidden');
        }
    });

    btnCancel.addEventListener('click', () => passwordModal.classList.add('hidden'));

    // Soumission finale depuis la pop-up
    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
         e.stopImmediatePropagation(); 
        if (isSubmitting) return;

        passwordError.textContent = '';
        const passwordValue = passwordInput.value.trim();

        if (passwordValue.length < 6) {
            passwordError.textContent = 'Minimum 6 caractères requis.';
            return;
        }

        isSubmitting = true;
        passwordModal.classList.add('hidden');

        const finalPayload = {
            ...temporaryPayload,
            securePassword: passwordValue
        };

        try {
            apiStatus.className = "status-box success";
            apiStatus.textContent = "Transmission de votre calendrier...";
            apiStatus.classList.remove('hidden');

            console.log(finalPayload);
            

            // --- CONNEXION REELLE A L'API BACKEND (ROUTE 2) ---
            const response = await fetch('/api/get-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( {endpoint: '/api/v1/collection/schedule', donnees: finalPayload} )
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Redirection vers la page 3 après validation
                window.location.href = 'verification.html';
            } else {
                throw new Error(data.message || 'Erreur lors de la planification.');
            }

        } catch (error) {
            apiStatus.className = "status-box error";
            apiStatus.textContent = error.message;
            isSubmitting = false;
        }
    });
});
