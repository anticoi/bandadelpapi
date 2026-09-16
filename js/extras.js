// La Banda del Papi - Secciones extras
// Integrantes, Stats animadas, Blog, Testimonios, Newsletter, Mapa, Spotify flotante, TikTok, Kiosk

document.addEventListener('DOMContentLoaded', () => {

    // === #2 SPOTIFY FLOTANTE ===
    (function initSpotifyFloat() {
        var wrap = document.createElement('div');
        wrap.id = 'spotify-float';
        wrap.style.cssText = 'position:fixed;bottom:90px;left:24px;z-index:9998;transition:transform 0.3s ease;';
        var btn = document.createElement('button');
        btn.style.cssText = 'width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;background:#1DB954;color:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(29,185,84,0.5);transition:transform 0.2s;';
        btn.innerHTML = '<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 14.879 10.561 18.6 12.84c.361.181.54.78.361 1.2zm.121-3.44C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>';
        var player = document.createElement('iframe');
        player.style.cssText = 'position:absolute;bottom:60px;left:0;width:300px;height:152px;border:0;border-radius:12px;display:none;box-shadow:0 8px 30px rgba(0,0,0,0.5);';
        player.src = 'https://open.spotify.com/embed/artist/75UgWA8c7eUEmUyWMikOXK?utm_source=generator&theme=0';
        player.setAttribute('allow', 'encrypted-media');
        wrap.appendChild(btn);
        wrap.appendChild(player);
        document.body.appendChild(wrap);
        btn.addEventListener('click', () => {
            player.style.display = player.style.display === 'block' ? 'none' : 'block';
        });
    })();

    // === #3 INTEGRANTES ===
    (function initIntegrantes() {
        var container = document.getElementById('integrantes-container');
        if (!container) return;
        var integrantes = [
            { nombre: 'Gustavo "El Papi" Dinamarca', rol: 'Batería / Timbal / Director', foto: 'fotos/WhatsApp%20Image%202026-09-15%20at%2017.58.13.jpeg' },
            { nombre: 'Músico 2', rol: 'Sección de Vientos', foto: '' },
            { nombre: 'Músico 3', rol: 'Sección de Vientos', foto: '' },
            { nombre: 'Músico 4', rol: 'Sección de Vientos', foto: '' },
            { nombre: 'Músico 5', rol: 'Bajo', foto: '' },
            { nombre: 'Músico 6', rol: 'Guitarra', foto: '' },
            { nombre: 'Músico 7', rol: 'Teclados', foto: '' },
            { nombre: 'Músico 8', rol: 'Percusión', foto: '' },
            { nombre: 'Músico 9', rol: 'Voz', foto: '' },
            { nombre: 'Músico 10', rol: 'Voz', foto: '' }
        ];
        var html = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">';
        integrantes.forEach(function(m) {
            var fotoHtml = m.foto
                ? '<img src="' + m.foto + '" alt="' + m.nombre + '" class="w-full h-48 object-cover rounded-t-2xl">'
                : '<div class="w-full h-48 flex items-center justify-center rounded-t-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20"><i class="fa-solid fa-user text-5xl text-amber-400/50"></i></div>';
            html += '<div class="bg-[#160f2e] rounded-2xl overflow-hidden border border-amber-400/20 card-hover">' + fotoHtml + '<div class="p-4 text-center"><h3 class="font-bold text-gold text-sm mb-1">' + m.nombre + '</h3><p class="text-gray-400 text-xs">' + m.rol + '</p></div></div>';
        });
        html += '</div>';
        html += '<p class="text-center text-gray-500 text-sm mt-6">Pronto actualizaremos con las fotos y nombres reales de cada músico.</p>';
        container.innerHTML = html;
    })();

    // === #4 STATS ANIMADAS ===
    (function initStats() {
        var container = document.getElementById('stats-animadas');
        if (!container) return;
        var stats = [
            { num: 65, suffix: '', label: 'Años de Trayectoria' },
            { num: 10, suffix: '', label: 'Músicos Profesionales' },
            { num: 11, suffix: 'K', label: 'Seguidores TikTok' },
            { num: 6, suffix: '+', label: 'Éxitos Propios' },
            { num: 1976, suffix: '', label: 'Rumba 8 Fundada' }
        ];
        var html = '<div class="grid grid-cols-2 md:grid-cols-5 gap-4">';
        stats.forEach(function(s, i) {
            html += '<div class="text-center stat-anim" data-target="' + s.num + '" data-suffix="' + s.suffix + '"><div class="text-4xl md:text-5xl font-black text-gold mb-2 counter">0' + s.suffix + '</div><div class="text-gray-400 text-sm">' + s.label + '</div></div>';
        });
        html += '</div>';
        container.innerHTML = html;

        // Intersection Observer para animar
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.querySelectorAll('.counter').forEach(function(el) {
                        var target = parseInt(entry.target.dataset.target);
                        var suffix = entry.target.dataset.suffix;
                        var current = 0;
                        var step = Math.max(1, Math.ceil(target / 40));
                        var interval = setInterval(function() {
                            current += step;
                            if (current >= target) { current = target; clearInterval(interval); }
                            el.textContent = current + suffix;
                        }, 30);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        document.querySelectorAll('.stat-anim').forEach(function(el) { observer.observe(el); });
    })();

    // === #5 BLOG ===
    (function initBlog() {
        var container = document.getElementById('blog-container');
        if (!container) return;
        fetch('/api/blog').then(r => r.json()).then(function(data) {
            if (!data.posts || data.posts.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">Próximamente nuevas publicaciones. ¡Mantente atento!</p>';
                return;
            }
            var html = '<div class="grid md:grid-cols-3 gap-6">';
            data.posts.forEach(function(post) {
                var date = new Date(post.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
                var img = post.imagen_url ? '<img src="' + post.imagen_url + '" alt="' + post.titulo + '" class="w-full h-40 object-cover rounded-t-2xl">' : '<div class="w-full h-40 flex items-center justify-center rounded-t-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20"><i class="fa-solid fa-newspaper text-4xl text-amber-400/50"></i></div>';
                html += '<article class="bg-[#160f2e] rounded-2xl overflow-hidden border border-amber-400/20 card-hover cursor-pointer" data-blog-id="' + post.id + '">' + img + '<div class="p-5"><div class="text-amber-400 text-xs mb-2">' + date + '</div><h3 class="font-bold text-gold mb-2">' + post.titulo + '</h3><p class="text-gray-400 text-sm">' + (post.resumen || '') + '</p></div></article>';
            });
            html += '</div>';
            container.innerHTML = html;
            container.querySelectorAll('[data-blog-id]').forEach(function(el) {
                el.addEventListener('click', function() {
                    var id = this.dataset.blogId;
                    fetch('/api/blog').then(r => r.json()).then(function(data) {
                        var post = data.posts.find(function(p) { return p.id == id; });
                        if (!post) return;
                        var modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4';
                        modal.innerHTML = '<div class="bg-[#160f2e] rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-amber-400/30"><h2 class="font-title text-3xl text-gold mb-4">' + post.titulo + '</h2><p class="text-gray-400 text-sm mb-4">' + new Date(post.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p><div class="text-gray-300 whitespace-pre-wrap">' + (post.contenido || post.resumen) + '</div><button class="block mx-auto mt-6 text-amber-400 hover:text-gold" onclick="this.closest(\'.fixed\').remove()">Cerrar</button></div>';
                        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
                        document.body.appendChild(modal);
                    });
                });
            });
        }).catch(function() {
            container.innerHTML = '<p class="text-gray-500 text-center">Próximamente nuevas publicaciones.</p>';
        });
    })();

    // === #7 TESTIMONIOS ===
    (function initTestimonios() {
        var container = document.getElementById('testimonios-container');
        if (!container) return;
        fetch('/api/testimonios').then(r => r.json()).then(function(data) {
            if (!data.testimonios || data.testimonios.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">Sé el primero en dejarnos un testimonio.</p>';
                return;
            }
            var html = '<div class="grid md:grid-cols-2 gap-6">';
            data.testimonios.forEach(function(t) {
                var stars = '⭐'.repeat(t.calificacion || 5);
                html += '<div class="bg-[#160f2e] rounded-2xl p-6 border border-amber-400/20"><div class="text-amber-400 mb-3">' + stars + '</div><p class="text-gray-300 italic mb-4">"' + t.mensaje + '"</p><div class="text-gold font-bold">' + t.nombre + '</div><div class="text-gray-500 text-sm">' + (t.evento || '') + '</div></div>';
            });
            html += '</div>';
            container.innerHTML = html;
        }).catch(function() {
            container.innerHTML = '<p class="text-gray-500 text-center">Sé el primero en dejarnos un testimonio.</p>';
        });
    })();

    // === FORMULARIO TESTIMONIO ===
    (function initFormTestimonio() {
        var form = document.getElementById('form-testimonio');
        if (!form) return;
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            var nombre = document.getElementById('test-nombre').value.trim();
            var evento = document.getElementById('test-evento').value.trim();
            var calificacion = document.getElementById('test-calificacion').value;
            var mensaje = document.getElementById('test-mensaje').value.trim();
            if (!nombre || !mensaje) return;
            try {
                var res = await fetch('/api/testimonios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nombre, evento: evento, calificacion: parseInt(calificacion), mensaje: mensaje }) });
                if (res.ok) {
                    form.reset();
                    alert('¡Gracias por tu testimonio! Será publicado tras revisión.');
                    location.reload();
                }
            } catch (err) { alert('Error al enviar. Intenta por WhatsApp.'); }
        });
    })();

    // === #9 NEWSLETTER ===
    (function initNewsletter() {
        var form = document.getElementById('form-newsletter');
        if (!form) return;
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            var email = document.getElementById('newsletter-email').value.trim();
            if (!email) return;
            try {
                var res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email }) });
                if (res.ok) {
                    form.reset();
                    var msg = document.getElementById('newsletter-msg');
                    msg.textContent = '¡Suscripción confirmada! Te avisaremos de próximos eventos.';
                    msg.className = 'text-green-400 text-sm mt-2';
                }
            } catch (err) { alert('Error al suscribirse.'); }
        });
    })();

    // === FORMULARIO RESERVA ===
    (function initFormReserva() {
        var form = document.getElementById('form-reserva');
        if (!form) return;
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            var data = {
                nombre: document.getElementById('res-nombre').value.trim(),
                email: document.getElementById('res-email').value.trim(),
                telefono: document.getElementById('res-telefono').value.trim(),
                fecha_evento: document.getElementById('res-fecha').value,
                tipo_evento: document.getElementById('res-tipo').value,
                lugar: document.getElementById('res-lugar').value.trim(),
                mensaje: document.getElementById('res-mensaje').value.trim()
            };
            if (!data.nombre || !data.mensaje) return;
            try {
                var res = await fetch('/api/reservas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                if (res.ok) {
                    form.reset();
                    var msg = document.getElementById('reserva-msg');
                    msg.textContent = '¡Solicitud enviada! Te contactaremos pronto.';
                    msg.className = 'text-green-400 text-sm mt-2';
                }
            } catch (err) { alert('Error al enviar. Intenta por WhatsApp.'); }
        });
    })();

    // === #6 MAPA DE EVENTOS ===
    (function initMapa() {
        var container = document.getElementById('mapa-container');
        if (!container) return;
        container.innerHTML = '<div id="leaflet-map" style="height:400px;border-radius:16px;border:1px solid rgba(255,200,0,0.2);"></div>';
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = function() {
            var map = L.map('leaflet-map').setView([-33.45, -70.65], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
            fetch('/api/events').then(r => r.json()).then(function(data) {
                if (!data.events) return;
                Object.entries(data.events).forEach(function(entry) {
                    var key = entry[0], ev = entry[1];
                    if (ev.location) {
                        // Geocoding simple basado en nombre del lugar
                        var loc = ev.location.toLowerCase();
                        var coords = null;
                        if (loc.includes('santiago')) coords = [-33.45, -70.65];
                        else if (loc.includes('viña') || loc.includes('vina')) coords = [-33.02, -71.55];
                        else if (loc.includes('valparaíso') || loc.includes('valparaiso')) coords = [-33.04, -71.62];
                        else if (loc.includes('concepción') || loc.includes('concepcion')) coords = [-36.82, -73.05];
                        else coords = [-33.45, -70.65];
                        var color = ev.type === 'public' ? '#FFC800' : '#FF5722';
                        var marker = L.circleMarker(coords, { radius: 8, fillColor: color, color: color, fillOpacity: 0.8 }).addTo(map);
                        marker.bindPopup('<strong>' + ev.title + '</strong><br>' + ev.location + '<br>' + key);
                    }
                });
            });
        };
        document.body.appendChild(script);
    })();

    // === #8 TIKTOK FEED ===
    (function initTikTok() {
        var container = document.getElementById('tiktok-container');
        if (!container) return;
        container.innerHTML = '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@la.banda.del.papi" data-embed-type="creator" style="max-width:780px;min-width:288px;"><section><a target="_blank" href="https://www.tiktok.com/@la.banda.del.papi?refer=creator_embed">@la.banda.del.papi</a></section></blockquote>';
        var script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
    })();

    // === #10 MODO KIOSK ===
    (function initKiosk() {
        var btn = document.createElement('button');
        btn.id = 'kiosk-btn';
        btn.style.cssText = 'position:fixed;bottom:24px;left:24px;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,200,0,0.3);background:#160f2e;color:#FFC800;cursor:pointer;z-index:9998;display:flex;align-items:center;justify-content:center;font-size:18px;';
        btn.title = 'Modo presentación';
        btn.innerHTML = '🖥️';
        document.body.appendChild(btn);
        btn.addEventListener('click', function() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });
    })();

});
