/* ================================================
   CityNexus — Smart City Command Platform
   Core Interactions & AI Logic — Full-Stack Edition
   ================================================ */

// Backend URL — localhost for dev, Vercel backend for production
const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'https://backend-murex-tau-22.vercel.app';

/* ─────────────────────────────────────────────────
   ONE-TIME LOGIN GATE
   ───────────────────────────────────────────────── */
(function loginGate() {
    const overlay = document.getElementById('login-overlay');
    if (!overlay) return;

    // Check if user already signed in
    const savedUser = localStorage.getItem('citynexus_user');
    if (savedUser) {
        overlay.classList.add('removed');
        return;
    }

    // Show overlay and lock scroll
    document.body.style.overflow = 'hidden';

    const form = document.getElementById('login-form');
    const card = overlay.querySelector('.login-card');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('login-name').value.trim();
        const phone = document.getElementById('login-phone').value.trim();
        const email = document.getElementById('login-email').value.trim();

        // Validate
        if (!name || name.length < 2) {
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 500);
            return;
        }
        if (!/^[0-9]{10,15}$/.test(phone)) {
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 500);
            return;
        }
        if (!email.includes('@')) {
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 500);
            return;
        }

        // Save to localStorage
        const userData = { name, phone, email, signedInAt: new Date().toISOString() };
        localStorage.setItem('citynexus_user', JSON.stringify(userData));

        // Animate out
        overlay.classList.add('hidden');
        document.body.style.overflow = '';

        setTimeout(() => {
            overlay.classList.add('removed');
        }, 700);
    });
})();

document.addEventListener('DOMContentLoaded', () => {

    // --- Check backend health on load ---
    (async function checkBackendHealth() {
        try {
            const res = await fetch(`${BACKEND_URL}/api/health`);
            const data = await res.json();
            console.log('[CityNexus] Backend status:', data);
            if (data.database === 'connected') {
                console.log('[CityNexus] ✓ MongoDB connected');
            } else {
                console.warn('[CityNexus] ⚠ MongoDB not connected —', data.database);
            }
            if (data.ai_service === 'reachable') {
                console.log('[CityNexus] ✓ AI service reachable');
            } else {
                console.warn('[CityNexus] ⚠ AI service not reachable');
            }
        } catch (e) {
            console.warn('[CityNexus] Backend not reachable at', BACKEND_URL);
        }
    })();

    // --- Live Dashboard Stats from Backend ---
    (async function loadDashboardStats() {
        try {
            const res = await fetch(`${BACKEND_URL}/api/stats`);
            const data = await res.json();
            if (data.success && data.stats) {
                const statNumbers = document.querySelectorAll('.stat-number');
                const statMap = {
                    'Cameras Active': null,          // keep hardcoded
                    'Intersections': null,            // keep hardcoded
                    'Ambulances Online': null,        // keep hardcoded
                    'Uptime %': null,                 // keep hardcoded
                };
                // Update stat counters if we have DB data
                // We overlay total incidents + SOS + detections as dynamic badges
                const s = data.stats;
                console.log(`[CityNexus] Live stats → Incidents: ${s.totalIncidents}, SOS: ${s.totalSOS}, Detections: ${s.totalDetections}, Contacts: ${s.totalContacts}`);
            }
        } catch (e) {
            console.log('[CityNexus] Stats API not available, using default values.');
        }
    })();
    

    // --- 3D Tilt on Feature Cards ---
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
            card.style.transform = `translateY(-8px) perspective(800px) rotateX(${y}deg) rotateY(${x}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // --- Glitch title nudge every 7s ---
    const glitchEl = document.querySelector('.glitch');
    if (glitchEl) {
        setInterval(() => {
            glitchEl.style.animation = 'none';
            glitchEl.offsetHeight; // reflow
            glitchEl.style.animation = '';
        }, 7000);
    }

    // --- Scroll & Navbar Logic ---
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const spans = mobileToggle.querySelectorAll('span');
        if (navLinks.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Close mobile menu on click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const spans = mobileToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        });
    });

    // --- Stats Counter Animation ---
    const stats = document.querySelectorAll('.stat-number');
    let hasCounted = false;

    function countUp(el) {
        const target = parseFloat(el.getAttribute('data-count'));
        const isDecimal = el.getAttribute('data-decimal') === 'true';
        const duration = 2000;
        const frames = 60;
        const step = target / (duration / (1000 / frames));
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                el.innerText = isDecimal ? target.toFixed(1) : Math.floor(target);
                clearInterval(timer);
            } else {
                el.innerText = isDecimal ? current.toFixed(1) : Math.floor(current);
            }
        }, 1000 / frames);
    }

    // --- Advanced Scroll Animations ---
    const animatedElements = document.querySelectorAll('.reveal-up, .reveal-zoom, .reveal-left, .reveal-right, .reveal-blur');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => scrollObserver.observe(el));

    // Stats counter trigger separately
    const statsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !hasCounted) {
            stats.forEach(countUp);
            hasCounted = true;
        }
    }, { threshold: 0.5 });
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) statsObserver.observe(heroStats);

    // --- SOS functionality ---
    const sosHeroBtn = document.getElementById('hero-sos-btn');
    const sosModal = document.getElementById('sos-modal');
    const sosCancelBtn = document.getElementById('sos-cancel-btn');
    const sosLocation = document.getElementById('sos-location');
    const sosSteps = [
        document.getElementById('sos-step-1'),
        document.getElementById('sos-step-2'),
        document.getElementById('sos-step-3'),
        document.getElementById('sos-step-4')
    ];

    let sosSequenceTimeout;

    let currentSOSId = null; // Track the current SOS alert ID from DB

    function activateSOS() {
        sosModal.classList.add('active');
        
        // Reset steps
        sosSteps.forEach(step => {
            step.classList.remove('active', 'done');
        });
        sosLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i><span>Location: Acquiring GPS signals...</span>';

        // Step 1: Location
        sosSteps[0].classList.add('active');
        
        // Simulate getting location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude.toFixed(4);
                const lng = position.coords.longitude.toFixed(4);
                sosLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i><span>Location: Lat ${lat}, Lng ${lng} — Sector Verified</span>`;
                
                // Save SOS to backend
                saveSOSToBackend({ lat: parseFloat(lat), lng: parseFloat(lng) }, `Lat ${lat}, Lng ${lng}`);
                proceedSOSSequence();
            }, () => {
                sosLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i><span>Location: Approx. City Center (GPS Failed)</span>';
                saveSOSToBackend(null, 'Approx. City Center (GPS Failed)');
                proceedSOSSequence();
            });
        } else {
            sosLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i><span>Location: Approx. City Center (No GPS)</span>';
            saveSOSToBackend(null, 'Approx. City Center (No GPS)');
            proceedSOSSequence();
        }
    }

    async function saveSOSToBackend(coordinates, locationText) {
        try {
            const res = await fetch(`${BACKEND_URL}/api/sos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coordinates, locationText }),
            });
            const data = await res.json();
            if (data.success) {
                currentSOSId = data.sos._id;
                console.log('[SOS] Alert saved to DB:', currentSOSId);
            }
        } catch (err) {
            console.error('[SOS] Failed to save to backend:', err.message);
        }
    }

    function proceedSOSSequence() {
        let currentStep = 0;
        
        function nextStep() {
            sosSteps[currentStep].classList.remove('active');
            sosSteps[currentStep].classList.add('done');
            
            currentStep++;
            
            if (currentStep < sosSteps.length) {
                sosSteps[currentStep].classList.add('active');
                
                // Audio queue for steps (simulation)
                if (currentStep === 1) playBeep(800, 100);
                if (currentStep === 2) playBeep(1000, 150);
                if (currentStep === 3) playBeep(1200, 300);

                sosSequenceTimeout = setTimeout(nextStep, 1500);
            } else {
                // Final step done
                const headerText = sosModal.querySelector('h2');
                headerText.innerText = "TEAMS DISPATCHED";
                headerText.style.color = "var(--accent-green)";
                sosModal.querySelector('.sos-modal-header i').style.color = "var(--accent-green)";
                sosModal.querySelector('.sos-modal-header i').className = "fas fa-check-circle";
                sosModal.style.borderColor = "var(--accent-green)";
            }
        }

        sosSequenceTimeout = setTimeout(nextStep, 1500);
    }

    function cancelSOS() {
        clearTimeout(sosSequenceTimeout);
        sosModal.classList.remove('active');

        // Update SOS status in DB
        if (currentSOSId) {
            fetch(`${BACKEND_URL}/api/sos/${currentSOSId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            }).catch(err => console.error('[SOS] Cancel update failed:', err));
            currentSOSId = null;
        }

        // Reset visual state
        setTimeout(() => {
            const headerText = sosModal.querySelector('h2');
            headerText.innerText = "SOS ACTIVATED";
            headerText.style.color = "var(--accent-red)";
            sosModal.querySelector('.sos-modal-header i').style.color = "var(--accent-red)";
            sosModal.querySelector('.sos-modal-header i').className = "fas fa-exclamation-triangle";
            sosModal.style.borderColor = "var(--accent-red)";
        }, 300);
    }

    if (sosHeroBtn) sosHeroBtn.addEventListener('click', activateSOS);

    sosCancelBtn.addEventListener('click', cancelSOS);

    // Keyboard shortcut for SOS (Ctrl+Shift+S)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            activateSOS();
        }
    });

    // --- AI Voice Assistant ---
    const aiToggleBtn = document.getElementById('ai-toggle-btn');
    const aiFab = document.getElementById('ai-fab');
    const aiPanel = document.getElementById('ai-panel');
    const aiCloseBtn = document.getElementById('ai-panel-close');
    const aiChat = document.getElementById('ai-chat');
    const aiTextInput = document.getElementById('ai-text-input');
    const aiSendBtn = document.getElementById('ai-send-btn');
    const aiVoiceBtn = document.getElementById('ai-voice-btn');
    const aiVoiceIndicator = document.getElementById('ai-voice-indicator');
    const aiStatusText = document.querySelector('.ai-status-text');

    function toggleAIPanel() {
        aiPanel.classList.toggle('active');
        if (aiPanel.classList.contains('active')) {
            setTimeout(() => aiTextInput.focus(), 100);
        }
    }

    aiToggleBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAIPanel(); });
    aiFab.addEventListener('click', toggleAIPanel);
    aiCloseBtn.addEventListener('click', () => aiPanel.classList.remove('active'));

    // Speech Recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = function() {
            isListening = true;
            aiVoiceBtn.classList.add('active');
            aiVoiceIndicator.classList.add('active');
            aiStatusText.innerText = "Listening...";
            aiStatusText.style.color = "var(--accent-cyan)";
            playBeep(600, 100);
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            aiTextInput.value = transcript;
            handleUserMessage(transcript);
        };

        recognition.onerror = function(event) {
            console.error(event.error);
            stopListening();
            addMessage("bot", "I couldn't hear that clearly. Could you type it or try again?");
        };

        recognition.onend = function() {
            stopListening();
        };
    } else {
        aiVoiceBtn.style.display = 'none';
        console.warn('Speech Recognition API not supported in this browser.');
    }

    function toggleListening() {
        if (isListening) {
            recognition.stop();
        } else {
            if (recognition) recognition.start();
            else addMessage("bot", "Voice recognition is not supported in your browser.");
        }
    }

    function stopListening() {
        isListening = false;
        aiVoiceBtn.classList.remove('active');
        aiVoiceIndicator.classList.remove('active');
        aiStatusText.innerText = "Voice Ready";
        aiStatusText.style.color = "var(--accent-green)";
    }

    aiVoiceBtn.addEventListener('mousedown', toggleListening);
    // Support touch devices
    aiVoiceBtn.addEventListener('touchstart', (e) => { e.preventDefault(); toggleListening(); });

    function addMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'ai-msg-avatar';
        avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const content = document.createElement('div');
        content.className = 'ai-msg-content';
        content.innerHTML = `<p>${text}</p>`;

        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        
        aiChat.appendChild(msgDiv);
        aiChat.scrollTop = aiChat.scrollHeight;
    }

    async function handleServerResponse(userInput) {
        const lowerInput = userInput.toLowerCase();

        // SOS — trigger immediately + backend
        if (lowerInput.includes('sos') || lowerInput.includes('emergency') || lowerInput.includes('help')) {
            setTimeout(activateSOS, 1500);
        }

        // Scroll to relevant sections
        if (lowerInput.includes('traffic') || lowerInput.includes('congestion')) {
            document.getElementById('traffic').scrollIntoView({ behavior: 'smooth' });
        } else if (lowerInput.includes('crime') || lowerInput.includes('police')) {
            document.getElementById('crime').scrollIntoView({ behavior: 'smooth' });
        }

        // Fetch response from backend (with live DB data)
        try {
            const res = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userInput }),
            });
            const data = await res.json();
            const response = data.response || "I couldn't process that. Please try again.";
            addMessage('bot', response);
            speakText(response.replace(/<[^>]*>?/gm, ''));
        } catch (err) {
            // Fallback to local responses if backend is down
            let response = '';
            if (lowerInput.includes('sos') || lowerInput.includes('emergency') || lowerInput.includes('help')) {
                response = "Activating Emergency SOS sequence now. Stay calm, help is being dispatched.";
            } else if (lowerInput.includes('traffic') || lowerInput.includes('congestion')) {
                response = "Current traffic status: <strong>High congestion</strong> at Central & Park St. AI has initiated dynamic rerouting protocols.";
            } else if (lowerInput.includes('crime') || lowerInput.includes('police')) {
                response = "Crime surveillance active. Recent high-priority alert at Market Road. Police dispatched.";
            } else {
                response = "I am CityNexus Command AI. Backend is currently offline. You can still check traffic, report an accident, or activate the SOS.";
            }
            addMessage('bot', response);
            speakText(response.replace(/<[^>]*>?/gm, ''));
        }
    }

    function handleUserMessage(text) {
        const input = text || aiTextInput.value.trim();
        if (!input) return;

        addMessage('user', input);
        aiTextInput.value = '';
        
        handleServerResponse(input);
    }

    aiSendBtn.addEventListener('click', () => handleUserMessage());
    aiTextInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });

    // Voice Synthesis for Bot Output
    function speakText(text) {
        if (!window.speechSynthesis) return;
        
        // Stop current speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Try to find a female/tech voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
    }

    // --- Audio Beep Utility ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playBeep(freq, duration) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // value in hertz
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (duration/1000));
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + (duration/1000));
    }

    // --- Particles Background Simulation ---
    // A lightweight implementation for node connections
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
                ctx.fill();
            }
        }

        for (let i = 0; i < 50; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Connect nearest nodes
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animate);
        }

        animate();
    }

    // --- Live City Map Initialization (Leaflet + Nominatim Search) ---
    const mapElement = document.getElementById('city-map');
    if (mapElement && typeof L !== 'undefined') {
        const map = L.map('city-map').setView([28.6139, 77.2090], 13);

        // Custom Marker Icon
        const incidentIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<i class='fas fa-exclamation-circle' style='color:#ef4444; font-size: 28px; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8));'></i>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });

        // Map Layers
        const normalLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        });
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        });
        const threeDLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO'
        });

        normalLayer.addTo(map);

        const markers = [];

        // Load existing incidents from database onto map
        (async function loadIncidentsOnMap() {
            try {
                const res = await fetch(`${BACKEND_URL}/api/incidents`);
                const data = await res.json();
                if (data.success && data.incidents && data.incidents.length > 0) {
                    data.incidents.forEach(inc => {
                        if (inc.coordinates && inc.coordinates.lat && inc.coordinates.lng) {
                            const statusBadge = inc.urgent
                                ? '<span style="color:#ef4444;font-weight:700;">⚠ URGENT</span>'
                                : `<span style="opacity:0.7;">${inc.status || 'pending'}</span>`;
                            const marker = L.marker([inc.coordinates.lat, inc.coordinates.lng], { icon: incidentIcon })
                                .addTo(map)
                                .bindPopup(`<h4>${inc.type.charAt(0).toUpperCase() + inc.type.slice(1)} Incident</h4><p>${inc.description}</p><p>${statusBadge}</p><p style="opacity:0.5;font-size:11px;">${inc.location}</p>`);
                            markers.push(marker);
                        }
                    });
                    console.log(`[CityNexus] Loaded ${data.incidents.length} incident(s) from database onto map.`);
                } else {
                    const defaultMarkers = [
                        L.marker([28.6139, 77.2090], {icon: incidentIcon}).bindPopup("<h4>Traffic Collision</h4><p>High Priority. Units dispatched.</p>"),
                        L.marker([28.6339, 77.2190], {icon: incidentIcon}).bindPopup("<h4>Suspicious Activity</h4><p>Reported near Metro Station.</p>")
                    ];
                    defaultMarkers.forEach(m => { m.addTo(map); markers.push(m); });
                    console.log('[CityNexus] No DB incidents found, showing default markers.');
                }
            } catch (err) {
                const defaultMarkers = [
                    L.marker([28.6139, 77.2090], {icon: incidentIcon}).bindPopup("<h4>Traffic Collision</h4><p>High Priority. Units dispatched.</p>"),
                    L.marker([28.6339, 77.2190], {icon: incidentIcon}).bindPopup("<h4>Suspicious Activity</h4><p>Reported near Metro Station.</p>")
                ];
                defaultMarkers.forEach(m => { m.addTo(map); markers.push(m); });
                console.warn('[CityNexus] Could not load incidents from DB:', err.message);
            }
        })();

        // Map mode buttons (Switch Layers)
        const mapBtns = document.querySelectorAll('.map-btn');
        mapBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                mapBtns.forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                const mode = target.getAttribute('data-mode');
                map.eachLayer((layer) => { if (layer._url) map.removeLayer(layer); });
                if (mode === 'normal') normalLayer.addTo(map);
                else if (mode === 'satellite') satelliteLayer.addTo(map);
                else if (mode === '3d') threeDLayer.addTo(map);
            });
        });

        // --- Interactive Location Search (Nominatim) ---
        const locateBtn = document.getElementById('btn-locate');
        const locationInput = document.getElementById('incident-location');

        // Create search results dropdown
        const searchDropdown = document.createElement('div');
        searchDropdown.className = 'location-search-dropdown';
        locationInput.parentElement.appendChild(searchDropdown);

        let searchTimeout = null;

        // Nominatim search as user types
        locationInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            const query = locationInput.value.trim();

            if (query.length < 3) {
                searchDropdown.innerHTML = '';
                searchDropdown.style.display = 'none';
                return;
            }

            // Check if it's coordinates (e.g. "28.6139, 77.2090")
            const coordMatch = query.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
            if (coordMatch) {
                searchDropdown.innerHTML = '';
                searchDropdown.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
                    const results = await res.json();

                    if (results.length > 0) {
                        searchDropdown.innerHTML = results.map((r, i) => `
                            <div class="search-result-item" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${r.display_name}">
                                <i class="fas fa-map-marker-alt"></i>
                                <div class="search-result-text">
                                    <span class="search-result-name">${r.display_name.split(',')[0]}</span>
                                    <span class="search-result-address">${r.display_name.split(',').slice(1, 3).join(',')}</span>
                                </div>
                            </div>
                        `).join('');
                        searchDropdown.style.display = 'block';

                        // Click on a result
                        searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const lat = parseFloat(item.dataset.lat);
                                const lng = parseFloat(item.dataset.lng);
                                const name = item.dataset.name;

                                locationInput.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                                locationInput.setAttribute('data-place-name', name);
                                map.setView([lat, lng], 16);

                                // Drop a temporary marker
                                const tempMarker = L.marker([lat, lng]).addTo(map)
                                    .bindPopup(`<b>${name.split(',')[0]}</b><br><span style="font-size:11px;opacity:0.7;">${name}</span>`)
                                    .openPopup();

                                searchDropdown.innerHTML = '';
                                searchDropdown.style.display = 'none';
                            });
                        });
                    } else {
                        searchDropdown.innerHTML = '<div class="search-result-item no-results"><i class="fas fa-search"></i><span>No results found</span></div>';
                        searchDropdown.style.display = 'block';
                    }
                } catch (err) {
                    console.warn('[Search] Nominatim error:', err.message);
                    searchDropdown.style.display = 'none';
                }
            }, 400); // debounce 400ms
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!locationInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = 'none';
            }
        });

        // --- Click on map to pick coordinates ---
        map.on('click', (e) => {
            const lat = e.latlng.lat.toFixed(4);
            const lng = e.latlng.lng.toFixed(4);
            locationInput.value = `${lat}, ${lng}`;
            locationInput.removeAttribute('data-place-name');
        });

        // GPS locate button
        locateBtn.addEventListener('click', () => {
            locationInput.value = "Acquiring GPS coordinates...";
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    locationInput.value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
                    map.setView([pos.coords.latitude, pos.coords.longitude], 15);
                }, () => {
                    locationInput.value = "GPS Access Denied";
                });
            } else {
                locationInput.value = "GPS Not Supported";
            }
        });

        // --- Manual Report Form Handling ---
        const incidentForm = document.getElementById('incident-form');

        incidentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = incidentForm.querySelector('.submit-btn');
            const ogContent = btn.innerHTML;

            btn.innerHTML = '<span>Transmitting...</span> <i class="fas fa-spinner fa-spin"></i>';
            btn.style.background = "var(--accent-yellow)";
            btn.style.color = "#000";
            btn.style.boxShadow = "none";
            btn.disabled = true;

            // Gather form data
            const incidentType = document.getElementById('incident-type').value;
            const incidentLocation = locationInput.value;
            const placeName = locationInput.getAttribute('data-place-name') || incidentLocation;
            const incidentDesc = document.getElementById('incident-desc').value;
            const incidentUrgent = document.getElementById('incident-urgent').checked;

            // Parse coordinates
            let coordinates = {};
            const coords = incidentLocation.split(',');
            if (coords.length === 2 && !isNaN(parseFloat(coords[0])) && !isNaN(parseFloat(coords[1]))) {
                coordinates = { lat: parseFloat(coords[0].trim()), lng: parseFloat(coords[1].trim()) };
            }

            // Save to backend
            try {
                const res = await fetch(`${BACKEND_URL}/api/incidents`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: incidentType,
                        location: placeName,
                        coordinates,
                        description: incidentDesc,
                        urgent: incidentUrgent,
                    }),
                });
                const data = await res.json();

                if (data.success) {
                    btn.innerHTML = '<span>Report Filed Successfully</span> <i class="fas fa-check"></i>';
                    btn.style.background = "var(--accent-green)";
                    btn.style.color = "#fff";
                    console.log('[Incident] Saved to DB:', data.incident._id);
                } else {
                    btn.innerHTML = '<span>Filed (DB unavailable)</span> <i class="fas fa-check"></i>';
                    btn.style.background = "var(--accent-green)";
                    btn.style.color = "#fff";
                }
            } catch (err) {
                console.warn('[Incident] Backend unavailable, report filed locally.');
                btn.innerHTML = '<span>Report Filed Locally</span> <i class="fas fa-check"></i>';
                btn.style.background = "var(--accent-green)";
                btn.style.color = "#fff";
            }

            // Add marker to map
            if (coordinates.lat && coordinates.lng) {
                const newMarker = L.marker([coordinates.lat, coordinates.lng], {icon: incidentIcon})
                    .addTo(map)
                    .bindPopup("<h4>New Incident Reported</h4><p>Pending review by command center.</p>")
                    .openPopup();
                markers.push(newMarker);
            }

            locationInput.removeAttribute('data-place-name');
            setTimeout(() => {
                incidentForm.reset();
                btn.innerHTML = ogContent;
                btn.style = "";
                btn.disabled = false;
            }, 3500);
        });
    }

    // --- Contact Form Submission Handler ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('contact-submit-btn');
            const ogContent = btn.innerHTML;

            btn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';
            btn.style.background = 'var(--accent-yellow)';
            btn.style.color = '#000';
            btn.style.boxShadow = 'none';
            btn.disabled = true;

            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value.trim();

            try {
                const res = await fetch(`${BACKEND_URL}/api/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message }),
                });
                const data = await res.json();

                if (data.success) {
                    btn.innerHTML = '<span>Message Sent Successfully!</span> <i class="fas fa-check"></i>';
                    btn.style.background = 'var(--accent-green)';
                    btn.style.color = '#fff';
                    console.log('[Contact] Message saved to DB:', data.message._id);
                } else {
                    btn.innerHTML = '<span>Sent (server issue)</span> <i class="fas fa-check"></i>';
                    btn.style.background = 'var(--accent-green)';
                    btn.style.color = '#fff';
                }
            } catch (err) {
                console.warn('[Contact] Backend unavailable:', err.message);
                btn.innerHTML = '<span>Message Sent Locally</span> <i class="fas fa-check"></i>';
                btn.style.background = 'var(--accent-green)';
                btn.style.color = '#fff';
            }

            setTimeout(() => {
                contactForm.reset();
                btn.innerHTML = ogContent;
                btn.style = '';
                btn.disabled = false;
            }, 3500);
        });
    }
    // --- Accident Detection — Real AI Backend Integration ---
    (function initAccidentDetection() {
        // Uses the global BACKEND_URL defined at the top of this file

        const uploadZone    = document.getElementById('upload-zone');
        const fileInput     = document.getElementById('image-file-input');
        const browseBtn     = document.getElementById('upload-browse-btn');
        const zoneInner     = document.getElementById('upload-zone-inner');
        const fileInfo      = document.getElementById('upload-file-info');
        const fnameLbl      = document.getElementById('upload-fname');
        const fsizeLbl      = document.getElementById('upload-fsize');
        const removeBtn     = document.getElementById('upload-remove-btn');
        const previewWrap   = document.getElementById('image-preview-wrap');
        const previewImage  = document.getElementById('preview-image');
        const bboxCanvas    = document.getElementById('bbox-canvas');
        const analyzeBtn    = document.getElementById('analyze-btn');
        const analysisLog   = document.getElementById('analysis-log');
        const logEntries    = document.getElementById('log-entries');
        const detectionResults = document.getElementById('detection-results');
        const resultsTbody  = document.getElementById('results-tbody');

        if (!uploadZone) return;

        let currentFile = null;
        let currentObjectURL = null;

        // Helper: format file size
        function formatBytes(bytes) {
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }

        // Helper: timestamp
        function nowStr() {
            return new Date().toLocaleTimeString('en-GB', { hour12: false });
        }

        // Apply selected file
        function applyFile(file) {
            if (!file || !file.type.startsWith('image/')) {
                addLogEntry('warn', 'Invalid file type. Please upload an image file (JPEG, PNG, WebP, BMP).', 'warn');
                return;
            }
            if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
            currentFile = file;
            currentObjectURL = URL.createObjectURL(file);

            fnameLbl.textContent = file.name;
            fsizeLbl.textContent = formatBytes(file.size);
            zoneInner.style.display = 'none';
            fileInfo.style.display = 'flex';
            uploadZone.classList.add('has-file');
            uploadZone.classList.remove('dragover');

            // Show image preview
            previewImage.src = currentObjectURL;
            previewWrap.style.display = 'block';

            // Clear previous bboxes
            const ctx = bboxCanvas.getContext('2d');
            ctx.clearRect(0, 0, bboxCanvas.width, bboxCanvas.height);

            analyzeBtn.disabled = false;
            analysisLog.style.display = 'none';
            logEntries.innerHTML = '';
            if (detectionResults) detectionResults.style.display = 'none';
            if (resultsTbody) resultsTbody.innerHTML = '';
            analyzeBtn.classList.remove('running');
            analyzeBtn.innerHTML = '<i class="fas fa-magnifying-glass-chart"></i><span>Detect Accidents</span>';
        }

        // Reset
        function resetUpload() {
            if (currentObjectURL) {
                URL.revokeObjectURL(currentObjectURL);
                currentObjectURL = null;
            }
            currentFile = null;
            fileInput.value = '';
            zoneInner.style.display = 'flex';
            fileInfo.style.display = 'none';
            uploadZone.classList.remove('has-file');
            previewImage.src = '';
            previewWrap.style.display = 'none';
            analyzeBtn.disabled = true;
            analysisLog.style.display = 'none';
            logEntries.innerHTML = '';
            if (detectionResults) detectionResults.style.display = 'none';
            if (resultsTbody) resultsTbody.innerHTML = '';
            analyzeBtn.classList.remove('running');
            analyzeBtn.innerHTML = '<i class="fas fa-magnifying-glass-chart"></i><span>Detect Accidents</span>';
            const ctx = bboxCanvas.getContext('2d');
            ctx.clearRect(0, 0, bboxCanvas.width, bboxCanvas.height);
        }

        // Click to browse
        browseBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
        uploadZone.addEventListener('click', () => { if (!uploadZone.classList.contains('has-file')) fileInput.click(); });

        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) applyFile(fileInput.files[0]);
        });

        // Drag & Drop
        uploadZone.addEventListener('dragenter', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
        uploadZone.addEventListener('dragleave', (e) => { if (!uploadZone.contains(e.relatedTarget)) uploadZone.classList.remove('dragover'); });
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) applyFile(file);
        });

        removeBtn.addEventListener('click', (e) => { e.stopPropagation(); resetUpload(); });

        // Log helper
        function addLogEntry(type, text, dotClass) {
            const entry = document.createElement('div');
            entry.className = `log-entry${type === 'result-ok' ? ' result-ok' : type === 'result-critical' ? ' result-critical' : type === 'result-warn' ? ' result-warn' : ''}`;
            entry.style.animationDelay = '0ms';
            entry.innerHTML = `<span class="log-dot ${dotClass || 'info'}"></span><span class="log-ts">[${nowStr()}]</span><span class="log-text">&nbsp;${text}</span>`;
            logEntries.appendChild(entry);
            logEntries.scrollTop = logEntries.scrollHeight;
        }

        // Draw bounding boxes on canvas
        function drawBoundingBoxes(detections) {
            const container = document.getElementById('image-canvas-container');
            const imgEl = previewImage;

            // Wait for image to load dimensions
            const displayW = imgEl.clientWidth;
            const displayH = imgEl.clientHeight;
            const naturalW = imgEl.naturalWidth;
            const naturalH = imgEl.naturalHeight;

            bboxCanvas.width = displayW;
            bboxCanvas.height = displayH;
            bboxCanvas.style.width = displayW + 'px';
            bboxCanvas.style.height = displayH + 'px';

            const ctx = bboxCanvas.getContext('2d');
            ctx.clearRect(0, 0, displayW, displayH);

            const scaleX = displayW / naturalW;
            const scaleY = displayH / naturalH;

            const colors = {
                'accident': '#ef4444',
                'vehicle': '#00d4ff',
                'default': '#facc15'
            };

            detections.forEach((det, idx) => {
                const [x1, y1, x2, y2] = det.box;
                const sx1 = x1 * scaleX;
                const sy1 = y1 * scaleY;
                const sx2 = x2 * scaleX;
                const sy2 = y2 * scaleY;
                const w = sx2 - sx1;
                const h = sy2 - sy1;

                const color = colors[det.label.toLowerCase()] || colors['default'];

                // Draw box
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.strokeRect(sx1, sy1, w, h);

                // Draw label background
                const label = `${det.label} ${(det.confidence * 100).toFixed(1)}%`;
                ctx.font = 'bold 13px "JetBrains Mono", monospace';
                const textWidth = ctx.measureText(label).width;
                const textHeight = 18;
                ctx.fillStyle = color;
                ctx.fillRect(sx1, sy1 - textHeight, textWidth + 10, textHeight);

                // Draw label text
                ctx.fillStyle = '#000';
                ctx.fillText(label, sx1 + 5, sy1 - 4);
            });
        }

        // Populate results table
        function populateResults(detections) {
            if (!resultsTbody || !detectionResults) return;
            resultsTbody.innerHTML = '';

            if (detections.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="4" style="text-align:center; opacity:0.6;">No detections found</td>';
                resultsTbody.appendChild(row);
            } else {
                detections.forEach((det, idx) => {
                    const row = document.createElement('tr');
                    const confPct = (det.confidence * 100).toFixed(1);
                    const isAccident = det.label.toLowerCase().includes('accident');
                    row.innerHTML = `
                        <td>${idx + 1}</td>
                        <td><span class="result-label ${isAccident ? 'label-critical' : 'label-normal'}">${det.label}</span></td>
                        <td><span class="result-confidence">${confPct}%</span></td>
                        <td class="result-box">[${det.box.map(v => v.toFixed(1)).join(', ')}]</td>
                    `;
                    resultsTbody.appendChild(row);
                });
            }
            detectionResults.style.display = 'block';
        }

        // ---- Analyze Button — Real Backend Call ----
        analyzeBtn.addEventListener('click', async () => {
            if (analyzeBtn.disabled || !currentFile) return;
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('running');
            logEntries.innerHTML = '';
            analysisLog.style.display = 'block';
            if (detectionResults) detectionResults.style.display = 'none';

            // Clear previous bboxes
            const ctx = bboxCanvas.getContext('2d');
            ctx.clearRect(0, 0, bboxCanvas.width, bboxCanvas.height);

            addLogEntry('info', 'Uploading image to AI backend...', 'info');

            // Build FormData
            const formData = new FormData();
            formData.append('image', currentFile);

            try {
                addLogEntry('info', 'Image uploaded. Waiting for DETR model inference...', 'info');

                const response = await fetch(`${BACKEND_URL}/api/detect`, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `Server error: ${response.status}`);
                }

                const data = await response.json();

                const modelUsed = data.model || 'AI';
                addLogEntry('info', `${modelUsed} inference complete. ${data.count || 0} object(s) detected.`, 'info');

                if (data.detections && data.detections.length > 0) {
                    const hasAccident = data.hasAccident || data.detections.some(d => d.label.toLowerCase().includes('accident'));

                    if (hasAccident) {
                        addLogEntry('result-critical', `⚠ ACCIDENT DETECTED (${modelUsed}) — SOS dispatch recommended.`, 'critical');
                        playBeep(400, 500);
                    } else {
                        addLogEntry('result-warn', `✓ Objects detected by ${modelUsed}. No accident found.`, 'warn');
                    }

                    // Draw bounding boxes on canvas
                    previewImage.onload = () => drawBoundingBoxes(data.detections);
                    if (previewImage.complete) drawBoundingBoxes(data.detections);

                    // Populate results table
                    populateResults(data.detections);
                } else {
                    addLogEntry('result-ok', `✓ No incidents detected by ${modelUsed} — Scene appears clear.`, 'ok');
                    populateResults([]);
                }

            } catch (err) {
                console.error('[Accident Detection] Error:', err);
                if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                    addLogEntry('result-critical', '✗ Backend server unreachable. Ensure the server is running.', 'critical');
                } else if (err.message.includes('No AI service')) {
                    addLogEntry('result-critical', '✗ No AI service available. Start Python DETR or configure Gemini API key.', 'critical');
                } else {
                    addLogEntry('result-critical', `✗ Detection failed: ${err.message}`, 'critical');
                }
                addLogEntry('info', 'Detection uses DETR locally and Gemini Vision as fallback on cloud.', 'warn');
            } finally {
                analyzeBtn.classList.remove('running');
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fas fa-rotate-right"></i><span>Re-analyze</span>';
            }
        });
    })();

    // ─────────────────────────────────────────────────
    //  PROFILE PANEL
    // ─────────────────────────────────────────────────
    (function initProfile() {
        const toggleBtn = document.getElementById('profile-toggle-btn');
        const panel = document.getElementById('profile-panel');
        const backdrop = document.getElementById('profile-backdrop');
        const closeBtn = document.getElementById('profile-close');
        const signoutBtn = document.getElementById('profile-signout');
        if (!toggleBtn || !panel) return;

        // Populate user info from localStorage
        const user = JSON.parse(localStorage.getItem('citynexus_user') || '{}');
        const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

        document.getElementById('profile-avatar-letter').textContent = initial;
        document.getElementById('profile-avatar-large').textContent = initial;
        document.getElementById('profile-user-name').textContent = user.name || 'User';
        document.getElementById('profile-user-email').textContent = user.email || '—';
        document.getElementById('profile-user-phone').querySelector('span').textContent = user.phone || '—';

        // Toggle panel
        function openPanel() {
            panel.classList.add('open');
            backdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
            loadProfileData();
        }
        function closePanel() {
            panel.classList.remove('open');
            backdrop.classList.remove('active');
            document.body.style.overflow = '';
        }

        toggleBtn.addEventListener('click', openPanel);
        closeBtn.addEventListener('click', closePanel);
        backdrop.addEventListener('click', closePanel);

        // Sign out
        signoutBtn.addEventListener('click', () => {
            localStorage.removeItem('citynexus_user');
            closePanel();
            location.reload();
        });

        // Fetch & populate data
        async function loadProfileData() {
            const activity = [];
            let trafficCount = 0, crimeCount = 0, sosCount = 0, msgCount = 0;

            try {
                // Fetch incidents
                const incRes = await fetch(`${BACKEND_URL}/api/incidents`).then(r => r.json());
                const incidents = Array.isArray(incRes) ? incRes : (incRes.incidents || []);
                incidents.forEach(inc => {
                    const type = (inc.type || 'traffic').toLowerCase();
                    if (type === 'traffic') trafficCount++;
                    else crimeCount++;
                    activity.push({
                        type,
                        title: `${type === 'crime' ? '🔴 Crime' : '🔵 Traffic'} Report`,
                        desc: inc.description || inc.location || '—',
                        status: inc.status || 'pending',
                        time: inc.createdAt,
                    });
                });
            } catch {}

            try {
                // Fetch SOS alerts
                const sosRes = await fetch(`${BACKEND_URL}/api/sos`).then(r => r.json());
                const alerts = Array.isArray(sosRes) ? sosRes : (sosRes.alerts || []);
                sosCount = alerts.length;
                alerts.forEach(a => {
                    activity.push({
                        type: 'sos',
                        title: '🆘 SOS Alert',
                        desc: a.message || `Lat: ${a.latitude?.toFixed(4)}, Lng: ${a.longitude?.toFixed(4)}`,
                        status: a.status || 'active',
                        time: a.createdAt,
                    });
                });
            } catch {}

            try {
                // Fetch contacts
                const conRes = await fetch(`${BACKEND_URL}/api/contacts`).then(r => r.json());
                const contacts = Array.isArray(conRes) ? conRes : (conRes.contacts || []);
                msgCount = contacts.length;
                contacts.forEach(c => {
                    activity.push({
                        type: 'message',
                        title: `✉️ Message: ${c.subject || 'General'}`,
                        desc: c.message || '—',
                        status: 'sent',
                        time: c.createdAt,
                    });
                });
            } catch {}

            try {
                // Fetch detections
                const detRes = await fetch(`${BACKEND_URL}/api/detections`).then(r => r.json());
                const detections = Array.isArray(detRes) ? detRes : (detRes.detections || []);
                detections.forEach(d => {
                    activity.push({
                        type: 'detection',
                        title: `🔍 AI Detection${d.hasAccident ? ' — ACCIDENT' : ''}`,
                        desc: `${d.count || 0} objects in ${d.filename || 'image'}`,
                        status: d.hasAccident ? 'critical' : 'clear',
                        time: d.createdAt,
                    });
                });
            } catch {}

            // Update stat numbers
            document.getElementById('pstat-reports').textContent = trafficCount + crimeCount;
            document.getElementById('pstat-sos').textContent = sosCount;
            document.getElementById('pstat-messages').textContent = msgCount;

            // Sort activity by time (newest first)
            activity.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

            // Render activity list
            const listEl = document.getElementById('profile-activity-list');
            if (activity.length === 0) {
                listEl.innerHTML = '<p class="profile-empty">No activity yet</p>';
            } else {
                listEl.innerHTML = activity.slice(0, 15).map(a => {
                    const timeStr = a.time ? new Date(a.time).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    }) : '';
                    const badgeClass = a.status === 'resolved' ? 'resolved' : 'pending';
                    return `
                        <div class="profile-activity-item">
                            <div class="profile-activity-dot ${a.type}"></div>
                            <div class="profile-activity-info">
                                <div class="profile-activity-title">${a.title}</div>
                                <div class="profile-activity-desc">${a.desc}</div>
                            </div>
                            <div class="profile-activity-time">
                                ${timeStr}<br>
                                <span class="profile-activity-badge ${badgeClass}">${a.status}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Render breakdown
            const total = trafficCount + crimeCount + sosCount + msgCount || 1;
            const breakdownEl = document.getElementById('profile-breakdown');
            const items = [
                { label: 'Traffic Reports', count: trafficCount, cls: 'traffic' },
                { label: 'Crime Reports', count: crimeCount, cls: 'crime' },
                { label: 'SOS Alerts', count: sosCount, cls: 'sos' },
                { label: 'Messages', count: msgCount, cls: 'message' },
            ].filter(i => i.count > 0);

            if (items.length === 0) {
                breakdownEl.innerHTML = '<p class="profile-empty">No data</p>';
            } else {
                breakdownEl.innerHTML = items.map(i => `
                    <div class="profile-breakdown-item">
                        <div class="profile-breakdown-header">
                            <span>${i.label}</span><span>${i.count}</span>
                        </div>
                        <div class="profile-breakdown-bar">
                            <div class="profile-breakdown-fill ${i.cls}" style="width: ${(i.count / total * 100).toFixed(1)}%"></div>
                        </div>
                    </div>
                `).join('');
            }
        }
    })();

});
