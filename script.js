/* ================================================
   CityNexus — Smart City Command Platform
   Core Interactions & AI Logic
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
    

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
        revealOnScroll();
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
    const sosMainBtn = document.getElementById('sos-main-btn');
    const sosHeroBtn = document.getElementById('hero-sos-btn');
    const sosNavBtn = document.getElementById('sos-nav-btn');
    const topSosBtn = document.getElementById('top-sos-btn');
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
                proceedSOSSequence();
            }, () => {
                sosLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i><span>Location: Approx. City Center (GPS Failed)</span>';
                proceedSOSSequence();
            });
        } else {
            sosLocation.innerHTML = '<i class="fas fa-map-marker-alt"></i><span>Location: Approx. City Center (No GPS)</span>';
            proceedSOSSequence();
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

    [sosMainBtn, sosHeroBtn, sosNavBtn, topSosBtn].forEach(btn => {
        if(btn) btn.addEventListener('click', activateSOS);
    });

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

    function handleServerResponse(userInput) {
        const lowerInput = userInput.toLowerCase();
        let response = "";

        // Simple Keyword Logic for AI Simulation
        if (lowerInput.includes('sos') || lowerInput.includes('emergency') || lowerInput.includes('help')) {
            response = "Activating Emergency SOS sequence now. Stay calm, help is being dispatched.";
            setTimeout(activateSOS, 1500);
        } 
        else if (lowerInput.includes('traffic') || lowerInput.includes('congestion')) {
            response = "Current traffic status: <strong>High congestion</strong> at Central & Park St. AI has initiated dynamic rerouting protocols and adjusted signals.";
            // Scroll to traffic
            document.getElementById('traffic').scrollIntoView({ behavior: 'smooth' });
        }
        else if (lowerInput.includes('crime') || lowerInput.includes('police')) {
             response = "Crime surveillance active. Recent high-priority alert at Market Road. Police dispatched.";
             document.getElementById('crime').scrollIntoView({ behavior: 'smooth' });
        }
        else {
             response = "I am CityNexus Command AI. You can ask me to check traffic, report an accident, clear an ambulance route, or activate the SOS.";
        }

        setTimeout(() => {
            addMessage('bot', response);
            speakText(response.replace(/<[^>]*>?/gm, '')); // Voice output
        }, 800);
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

    // --- Live City Map Initialization (Leaflet) ---
    const mapElement = document.getElementById('city-map');
    if (mapElement && typeof L !== 'undefined') {
        const map = L.map('city-map').setView([28.6139, 77.2090], 13); // Default Center (Delhi)

        // Custom Marker
        const documentStyle = getComputedStyle(document.body);
        const redColor = documentStyle.getPropertyValue('--accent-red') || '#ef4444';
        
        const incidentIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<i class='fas fa-exclamation-circle' style='color:${redColor}; font-size: 28px; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8));'></i>`,
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

        // 3D/Dark Terrain View
        const threeDLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO'
        });

        // Set default layer
        normalLayer.addTo(map);

        // Initial Dummy Markers
        const markers = [
            L.marker([28.6139, 77.2090], {icon: incidentIcon}).bindPopup("<h4>Traffic Collision</h4><p>High Priority. Units dispatched.</p>"),
            L.marker([28.6339, 77.2190], {icon: incidentIcon}).bindPopup("<h4>Suspicious Activity</h4><p>Reported near Metro Station.</p>")
        ];
        
        markers.forEach(m => m.addTo(map));

        // Map mode buttons (Switch Layers)
        const mapBtns = document.querySelectorAll('.map-btn');
        mapBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                mapBtns.forEach(b => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                
                const mode = target.getAttribute('data-mode');
                
                // Remove all tile layers
                map.eachLayer((layer) => {
                    if (layer._url) { // If it has a url, it's a tilLayer
                        map.removeLayer(layer);
                    }
                });

                if (mode === 'normal') normalLayer.addTo(map);
                else if (mode === 'satellite') satelliteLayer.addTo(map);
                else if (mode === '3d') threeDLayer.addTo(map);
            });
        });

        // --- Manual Report Form Handling ---
        const incidentForm = document.getElementById('incident-form');
        const locateBtn = document.getElementById('btn-locate');
        const locationInput = document.getElementById('incident-location');

        locateBtn.addEventListener('click', () => {
            locationInput.value = "Acquiring GPS coordinates...";
            if("geolocation" in navigator) {
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

        incidentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = incidentForm.querySelector('.submit-btn');
            const ogContent = btn.innerHTML;
            
            btn.innerHTML = '<span>Transmitting...</span> <i class="fas fa-spinner fa-spin"></i>';
            btn.style.background = "var(--accent-yellow)";
            btn.style.color = "#000";
            btn.style.boxShadow = "none";

            setTimeout(() => {
                btn.innerHTML = '<span>Report Filed Successfully</span> <i class="fas fa-check"></i>';
                btn.style.background = "var(--accent-green)";
                btn.style.color = "#fff";
                
                // Add marker to map if location is coordinates
                const locVal = locationInput.value;
                const coords = locVal.split(',');
                if(coords.length === 2 && !isNaN(parseFloat(coords[0]))) {
                    const newMarker = L.marker([parseFloat(coords[0]), parseFloat(coords[1])], {icon: incidentIcon})
                        .addTo(map)
                        .bindPopup("<h4>New Incident Reported</h4><p>Pending review by command center.</p>")
                        .openPopup();
                    markers.push(newMarker);
                }

                setTimeout(() => {
                    incidentForm.reset();
                    btn.innerHTML = ogContent;
                    btn.style = "";
                }, 3500);
            }, 1800);
        });
    }
    // --- Accident Detection — Manual Video Input ---
    (function initAccidentDetection() {
        const uploadZone    = document.getElementById('upload-zone');
        const fileInput     = document.getElementById('video-file-input');
        const browseBtn     = document.getElementById('upload-browse-btn');
        const zoneInner     = document.getElementById('upload-zone-inner');
        const fileInfo      = document.getElementById('upload-file-info');
        const fnameLbl      = document.getElementById('upload-fname');
        const fsizeLbl      = document.getElementById('upload-fsize');
        const removeBtn     = document.getElementById('upload-remove-btn');
        const previewWrap   = document.getElementById('video-preview-wrap');
        const previewVideo  = document.getElementById('footage-preview');
        const analyzeBtn    = document.getElementById('analyze-btn');
        const analysisLog   = document.getElementById('analysis-log');
        const logEntries    = document.getElementById('log-entries');

        if (!uploadZone) return; // guard if elements missing

        let currentObjectURL = null;

        // Helper: format file size
        function formatBytes(bytes) {
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }

        // Helper: get current time string HH:MM:SS
        function nowStr() {
            return new Date().toLocaleTimeString('en-GB', { hour12: false });
        }

        // Apply selected file
        function applyFile(file) {
            if (!file || !file.type.startsWith('video/')) {
                addLogEntry('warn', 'Invalid file type. Please upload a video file.', 'warn');
                return;
            }
            // Revoke previous URL
            if (currentObjectURL) URL.revokeObjectURL(currentObjectURL);
            currentObjectURL = URL.createObjectURL(file);

            // Update zone UI
            fnameLbl.textContent = file.name;
            fsizeLbl.textContent = formatBytes(file.size);
            zoneInner.style.display = 'none';
            fileInfo.style.display = 'flex';
            uploadZone.classList.add('has-file');
            uploadZone.classList.remove('dragover');

            // Show video preview
            previewVideo.src = currentObjectURL;
            previewWrap.style.display = 'block';

            // Enable analyze
            analyzeBtn.disabled = false;

            // Reset any previous log
            analysisLog.style.display = 'none';
            logEntries.innerHTML = '';
            analyzeBtn.classList.remove('running');
        }

        // Remove / reset
        function resetUpload() {
            if (currentObjectURL) {
                URL.revokeObjectURL(currentObjectURL);
                currentObjectURL = null;
            }
            fileInput.value = '';
            zoneInner.style.display = 'flex';
            fileInfo.style.display = 'none';
            uploadZone.classList.remove('has-file');
            previewVideo.src = '';
            previewWrap.style.display = 'none';
            analyzeBtn.disabled = true;
            analysisLog.style.display = 'none';
            logEntries.innerHTML = '';
            analyzeBtn.classList.remove('running');
        }

        // Click to browse
        browseBtn.addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
        uploadZone.addEventListener('click', () => { if (!uploadZone.classList.contains('has-file')) fileInput.click(); });

        // File input change
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

        // Remove button
        removeBtn.addEventListener('click', (e) => { e.stopPropagation(); resetUpload(); });

        // ---- Analysis Log Helper ----
        function addLogEntry(type, text, dotClass) {
            const entry = document.createElement('div');
            entry.className = `log-entry${type === 'result-ok' ? ' result-ok' : type === 'result-critical' ? ' result-critical' : type === 'result-warn' ? ' result-warn' : ''}`;
            entry.style.animationDelay = '0ms';
            entry.innerHTML = `<span class="log-dot ${dotClass || 'info'}"></span><span class="log-ts">[${nowStr()}]</span><span class="log-text">&nbsp;${text}</span>`;
            logEntries.appendChild(entry);
            logEntries.scrollTop = logEntries.scrollHeight;
        }

        // ---- Analyze Button ----
        analyzeBtn.addEventListener('click', () => {
            if (analyzeBtn.disabled) return;
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('running');
            logEntries.innerHTML = '';
            analysisLog.style.display = 'block';

            // Determine a pseudo-random result based on filename (deterministic per file)
            const fname = fnameLbl.textContent.toLowerCase();
            const seed = fname.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            const resultType = seed % 3; // 0 = accident, 1 = traffic jam, 2 = clear

            const steps = [
                { delay: 0,    dot: 'info',     text: 'Initializing AI pipeline... model loaded.' },
                { delay: 600,  dot: 'info',     text: 'Extracting keyframes at 2 fps...' },
                { delay: 1300, dot: 'info',     text: `Processed ${48 + (seed % 30)} frames from video.` },
                { delay: 1950, dot: 'info',     text: 'Running object detection (vehicles, persons, debris)...' },
                { delay: 2700, dot: 'warn',     text: 'Anomalous motion vectors detected in ROI zone 3.' },
                { delay: 3400, dot: 'info',     text: 'Running incident classification model...' },
                { delay: 4200, dot: 'info',     text: 'Cross-referencing with traffic density baseline...' },
                { delay: 5000, dot: 'info',     text: 'Preparing SOS dispatch decision...' },
            ];

            let resultEntry;
            if (resultType === 0) {
                resultEntry = { delay: 5800, dot: 'critical', text: '⚠ ACCIDENT DETECTED — Severity: CRITICAL — SOS dispatched to nearest units.', type: 'result-critical' };
            } else if (resultType === 1) {
                resultEntry = { delay: 5800, dot: 'warn', text: '⚠ TRAFFIC JAM DETECTED — Severity: MODERATE — Re-routing protocol triggered.', type: 'result-warn' };
            } else {
                resultEntry = { delay: 5800, dot: 'ok', text: '✓ No incident detected — Traffic flow nominal. No SOS required.', type: 'result-ok' };
            }

            steps.forEach(({ delay, dot, text }) => {
                setTimeout(() => addLogEntry('info', text, dot), delay);
            });

            setTimeout(() => {
                addLogEntry(resultEntry.type, resultEntry.text, resultEntry.dot);
                analyzeBtn.classList.remove('running');
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fas fa-rotate-right"></i><span>Re-analyze</span>';
            }, resultEntry.delay);
        });
    })();

});
