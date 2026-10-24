document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-buyer-form');
    const idInput = document.getElementById('generated-id');
    const apiStatus = document.getElementById('admin-api-status');
    const dynamicContent = document.getElementById('admin-dynamic-content');
    let isProcessing = false;

    // Fonction de génération d'ID unique
    function generateTransactionId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `TF-${year}${month}${day}-${hours}${minutes}${seconds}`;
    }

    if (idInput) idInput.value = generateTransactionId();

    function sanitize(text) {
        const tempDiv = document.createElement('div');
        tempDiv.innerText = text;
        return tempDiv.innerHTML;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isProcessing) return;

        apiStatus.className = 'status-box hidden';
        const fields = ['sale-site', 'article-name', 'article-price', 'service-fees'];
        let isValid = true;

        fields.forEach(id => {
            const el = document.getElementById(id);
            const err = document.getElementById(`${id}-error`);
            if (err) err.textContent = '';
            
            if (!el.value.trim()) {
                if (err) err.textContent = 'Ce champ est obligatoire.';
                isValid = false;
            }
        });

        if (!isValid) return;

        isProcessing = true;

        const trackingNumber = idInput.value;
        const site = sanitize(document.getElementById('sale-site').value);
        const article = sanitize(document.getElementById('article-name').value.trim());
        const price = parseFloat(document.getElementById('article-price').value);
        const fees = parseFloat(document.getElementById('service-fees').value);
        const totalPaid = (price + fees).toFixed(2);
        const defaultVendorCode = "1234"; 
        // Construction du payload assaini
        const payload = {
            trackingNumber: idInput.value,
            site: sanitize(document.getElementById('sale-site').value),
            article: sanitize(document.getElementById('article-name').value.trim()),
            price: `${price.toFixed(2)}`,
            frais: `${fees.toFixed(2)}` 
        };

        console.log(payload);

        try {
            apiStatus.className = "status-box success";
            apiStatus.textContent = "Création du dossier sur la base de données séquestre...";
            apiStatus.classList.remove('hidden');

            const response = await fetch('https://54-247-248-45.sslip.io/api/v1/buyer/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                apiStatus.classList.add('hidden');
                
                // RENDU DU REÇU OFFICIEL AVEC MARQUE DE LA SOCIÉTÉ
                dynamicContent.innerHTML = `
                    <div class="receipt-print-box" style="background: #fff; padding: 30px; border: 1px solid #cbd5e1; border-radius: 12px; position: relative;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                            <div>
                                <h2 style="color: #1e3a8a; margin: 0; font-size: 1.6rem; font-weight: 800;">🤝 TrustFetch Inc.</h2>
                                <p style="margin: 4px 0 0 0; color: #64748b; font-size: 0.9rem; font-weight: 500;">Reçu officiel de dépôt séquestre sécurisé</p>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;" class="qr-code-receipt-container">
                                <!-- Conteneur local pour dessiner le code QR -->
                                <div id="qrcode-target" style="border: 1px solid #e2e8f0; padding: 6px; background: #fff; border-radius: 4px; display: inline-block;"></div>
                                <p style="margin: 4px 0 0 0; font-size: 0.7rem; font-family: monospace; color: #64748b;">Scanner pour suivi</p>
                            </div>
                        </div>

                        <div class="transaction-details" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
                            <div class="detail-item" style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px;">
                                <span class="detail-label" style="color: #64748b;">N° de Transaction (Tracking) :</span>
                                <strong class="detail-value" style="font-family: monospace; font-size: 1.1rem; color: #1e3a8a;">${trackingNumber}</strong>
                            </div>
                            <div class="detail-item" style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px;">
                                <span class="detail-label" style="color: #64748b;">Code secret Vendeur :</span>
                                <strong class="detail-value" style="font-family: monospace; font-size: 1.1rem; color: #dc2626;">${defaultVendorCode}</strong>
                            </div>
                            <div class="detail-item" style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px;">
                                <span class="detail-label" style="color: #64748b;">Plateforme d'origine :</span>
                                <strong class="detail-value" style="color: #ea580c;">${site}</strong>
                            </div>
                            <div class="detail-item" style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px;">
                                <span class="detail-label" style="color: #64748b;">Désignation de l'article :</span>
                                <strong class="detail-value" style="color: #0f172a;">${article}</strong>
                            </div>
                            <div class="detail-item" style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px;">
                                <span class="detail-label" style="color: #64748b;">Prix net de l'article :</span>
                                <strong class="detail-value" style="color: #0f172a;">${price.toFixed(2)} €</strong>
                            </div>
                            <div class="detail-item" style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px;">
                                <span class="detail-label" style="color: #64748b;">Frais logistiques de service :</span>
                                <strong class="detail-value" style="color: #0f172a;">${fees.toFixed(2)} €</strong>
                            </div>
                            <div class="detail-item total-box" style="display: flex; justify-content: space-between; margin-top: 14px; background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <span class="detail-label" style="font-weight: 700; color: #334155;">Montant total consigné par l'acheteur :</span>
                                <strong class="detail-value price-tag" style="font-size: 1.4rem; color: #0d9488; font-weight: 800;">${totalPaid} €</strong>
                            </div>
                        </div>

                        <div class="info-alert no-print" style="margin-bottom: 24px; padding: 16px; background-color: #eff6ff; border-left: 4px solid #1e3a8a; border-radius: 4px; font-size: 0.9rem; color: #1e40af;">
                            <p>💡 <strong>Note administrative :</strong> Imprimez ce reçu ou transmettez l'ID et le code secret au vendeur pour qu'il valide ses coordonnées de collecte.</p>
                        </div>

                        <div class="action-buttons-group no-print" style="display: flex; gap: 12px; justify-content: center;">
                            <button onclick="window.print()" class="btn-submit" style="width: auto; padding: 14px 28px; background-color: #475569; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">🖨️ Télécharger le reçu en PDF</button>
                            <button onclick="window.location.reload()" class="btn-submit btn-accent" style="width: auto; padding: 14px 28px; background-color: #0d9488; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Enregistrer une autre vente</button>
                        </div>
                    </div>
                `;

                // --- GÉNÉRATION NATIVE DU CODE QR SANS REQUÊTE INTERNET ---
                new QRCode(document.getElementById("qrcode-target"), {
                    text: trackingNumber,
                    width: 110,
                    height: 110,
                    colorDark : "#1e3a8a", // Assorti au bleu TrustFetch
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });

            } else {
                throw new Error(data.message || 'Erreur lors de la création du dossier.');
            }
        } catch (error) {
            apiStatus.className = "status-box error";
            apiStatus.textContent = error.message;
            isProcessing = false;
        }
    });
});
