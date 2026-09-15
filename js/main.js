// La Banda del Papi - Main JavaScript
// Mobile menu, floating notes, audio pad, share & fiesta effects

document.addEventListener('DOMContentLoaded', function() {
    // Set current year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
        // Close mobile menu on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });
    }

    // Generate Floating Musical Notes background
    const notesContainer = document.getElementById('notesContainer');
    if (notesContainer) {
        const noteSymbols = ['🎵', '🎶', '🎷', '🎺', '🪗', '🪘', '✨', '⭐'];
        for (let i = 0; i < 15; i++) {
            const note = document.createElement('div');
            note.className = 'note';
            note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
            note.style.left = `${Math.random() * 100}vw`;
            note.style.animationDuration = `${6 + Math.random() * 6}s`;
            note.style.animationDelay = `${Math.random() * 5}s`;
            note.style.fontSize = `${18 + Math.random() * 20}px`;
            notesContainer.appendChild(note);
        }
    }

    // Contact form - open WhatsApp with prefilled message
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nombre = this.nombre.value || '';
            const email = this.email.value || '';
            const telefono = this.telefono.value || '';
            const fecha = this.fecha.value || '';
            const mensaje = this.mensaje.value || '';

            const text = `Hola La Banda del Papi, soy ${nombre}.%0A` +
                `Email: ${email}%0A` +
                `Teléfono: ${telefono}%0A` +
                `Fecha del evento: ${fecha}%0A` +
                `Mensaje: ${mensaje}`;
            window.open(`https://wa.me/56994775389?text=${text}`, '_blank');
            showToast('¡Mensaje listo para enviar por WhatsApp!');
        });
    }
});

// Web Audio API - Cumbia Synthesized Instruments (No external assets required)
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

function playCumbiaSound(type) {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'guiro') {
        const bufferSize = audioCtx.sampleRate * 0.12;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3500, now);
        filter.Q.setValueAtTime(3, now);

        noise.connect(filter);
        filter.connect(audioCtx.destination);
        noise.start(now);

    } else if (type === 'timbal') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);

    } else if (type === 'conga') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);

    } else if (type === 'campana') {
        [800, 1250].forEach(freq => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        });
    }
}

// Share Functionality
function shareLink() {
    const shareData = {
        title: 'La Banda del Papi | La Facultad de la Cumbia',
        text: '¡Escucha a La Banda del Papi! Pura cumbia y sabor tropical.',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => copyToClipboard());
    } else {
        copyToClipboard();
    }
}

function copyToClipboard() {
    const dummy = document.createElement('input');
    document.body.appendChild(dummy);
    dummy.value = window.location.href;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    showToast('¡Enlace de La Banda del Papi copiado!');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
    }, 3000);
}

// Fiesta Confetti / Notes burst effect
function triggerFiestaEffect() {
    showToast('¡SABORRR! 🎉 Modo Fiesta Activado');

    playCumbiaSound('campana');
    setTimeout(() => playCumbiaSound('timbal'), 150);
    setTimeout(() => playCumbiaSound('guiro'), 300);
    setTimeout(() => playCumbiaSound('conga'), 450);

    const colors = ['#FFC800', '#FF5722', '#00E676', '#E50914', '#00E5FF'];
    for (let i = 0; i < 35; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = '50vw';
        particle.style.top = '50vh';
        particle.style.width = '10px';
        particle.style.height = '10px';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        particle.style.zIndex = '9999';
        particle.style.pointerEvents = 'none';
        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 5 + Math.random() * 12;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        let posX = window.innerWidth / 2;
        let posY = window.innerHeight / 2;
        let opacity = 1;

        const anim = setInterval(() => {
            posX += vx;
            posY += vy + 1.5;
            opacity -= 0.02;
            particle.style.left = `${posX}px`;
            particle.style.top = `${posY}px`;
            particle.style.opacity = opacity;

            if (opacity <= 0) {
                clearInterval(anim);
                particle.remove();
            }
        }, 16);
    }
}
