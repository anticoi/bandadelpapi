// Calendario de Eventos - La Banda del Papi
// Muestra próximos eventos confirmados cargados desde /api/events (Postgres)

let calendarEvents = {};
let dbEventsLoaded = false;

async function loadDbEvents() {
    try {
        const res = await fetch('/api/events');
        if (res.ok) {
            const data = await res.json();
            if (data.events) {
                calendarEvents = { ...calendarEvents, ...data.events };
                dbEventsLoaded = true;
            }
        }
    } catch (err) {
        console.error('Error cargando eventos:', err);
    }
}

function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function renderCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const today = new Date();
    const todayKey = formatDateKey(today);

    let html = `
        <div class="bg-[#160f2e] rounded-2xl p-6 border border-amber-400/30">
            <div class="flex items-center justify-between mb-6">
                <button id="cal-prev" class="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 hover:bg-amber-400/30 transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
                <h3 class="font-title text-2xl font-bold text-gold">${monthNames[currentMonth]} ${currentYear}</h3>
                <button id="cal-next" class="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 hover:bg-amber-400/30 transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>

            <div class="grid grid-cols-7 gap-1 mb-2">
    `;

    dayNames.forEach(day => {
        html += `<div class="text-center text-gray-500 text-sm font-semibold py-2">${day}</div>`;
    });

    html += '</div><div class="grid grid-cols-7 gap-1">';

    for (let i = 0; i < startDayOfWeek; i++) {
        html += '<div></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateKey = formatDateKey(date);
        const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const isToday = dateKey === todayKey;
        const isSaturday = date.getDay() === 6;

        let dayClass = 'text-gray-400';
        let bgClass = 'bg-[#0c0612]/50';
        let extraHtml = '';
        let clickable = false;

        if (calendarEvents[dateKey]) {
            const event = calendarEvents[dateKey];
            clickable = true;
            if (event.type === 'public') {
                bgClass = 'bg-amber-400/20 border border-amber-400/50';
                dayClass = 'text-amber-400 font-bold';
                extraHtml = '<div class="w-1.5 h-1.5 bg-amber-400 rounded-full mx-auto mt-0.5"></div>';
            } else if (event.type === 'private') {
                bgClass = 'bg-orange-500/20 border border-orange-500/50';
                dayClass = 'text-orange-400 font-bold';
                extraHtml = '<div class="w-1.5 h-1.5 bg-orange-500 rounded-full mx-auto mt-0.5"></div>';
            }
        } else if (isSaturday && !isPast) {
            bgClass = 'bg-green-900/20 border border-green-500/30';
            dayClass = 'text-green-400 font-semibold';
            extraHtml = '<div class="w-1.5 h-1.5 bg-green-500 rounded-full mx-auto mt-0.5"></div>';
        }

        if (isToday) {
            bgClass += ' ring-2 ring-amber-400';
        }

        if (clickable) {
            html += `<div class="cal-day cursor-pointer hover:scale-105 transition-transform rounded-lg p-2 ${bgClass} ${dayClass} text-center" data-date="${dateKey}">${day}${extraHtml}</div>`;
        } else {
            html += `<div class="rounded-lg p-2 ${bgClass} ${dayClass} text-center">${day}${extraHtml}</div>`;
        }
    }

    html += '</div>';

    // Leyenda
    html += `
        <div class="mt-6 flex flex-wrap gap-4 justify-center text-sm">
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-amber-400/40 border border-amber-400/50 rounded"></div>
                <span class="text-gray-400">Evento Público</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-orange-500/40 border border-orange-500/50 rounded"></div>
                <span class="text-gray-400">Evento Privado</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-green-500/40 border border-green-500/50 rounded"></div>
                <span class="text-gray-400">Disponible</span>
            </div>
        </div>
    `;

    // Próximos eventos
    html += `
        <div class="mt-6 pt-6 border-t border-amber-400/20">
            <h4 class="text-gold font-bold mb-4 text-center">Próximos Eventos Confirmados</h4>
            <div class="space-y-3">
    `;

    const upcomingEvents = Object.entries(calendarEvents)
        .filter(([key]) => key >= todayKey)
        .sort((a, b) => a[0].localeCompare(b[0]));

    if (upcomingEvents.length === 0) {
        html += '<p class="text-gray-500 text-center text-sm">No hay eventos confirmados próximamente. ¡Contáctanos para agendar el tuyo!</p>';
    } else {
        upcomingEvents.forEach(([key, event]) => {
            const [y, m, d] = key.split('-');
            const eventDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][eventDate.getDay()];
            const typeColor = event.type === 'public' ? 'text-amber-400' : 'text-orange-400';
            const typeBg = event.type === 'public' ? 'bg-amber-400/10 border-amber-400/30' : 'bg-orange-500/10 border-orange-500/30';
            const typeLabel = event.type === 'public' ? 'Público' : 'Privado';

            html += `
                <div class="${typeBg} border rounded-lg p-3 flex items-center justify-between">
                    <div>
                        <div class="${typeColor} font-bold">${event.title}</div>
                        <div class="text-gray-400 text-sm">${event.location}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-white font-semibold">${dayName} ${d}</div>
                        <div class="text-gray-500 text-xs">${monthNames[parseInt(m) - 1]} ${y} · ${typeLabel}</div>
                    </div>
                </div>
            `;
        });
    }

    html += '</div></div></div>';

    container.innerHTML = html;

    document.getElementById('cal-prev').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('cal-next').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    document.querySelectorAll('.cal-day').forEach(day => {
        day.addEventListener('click', function() {
            const dateKey = this.dataset.date;
            const event = calendarEvents[dateKey];
            if (event) {
                showEventModal(dateKey, event);
            }
        });
    });
}

function showEventModal(dateKey, event) {
    const [y, m, d] = dateKey.split('-');
    const eventDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][eventDate.getDay()];
    const typeColor = event.type === 'private' ? '#FF5722' : '#FFC800';
    const typeLabel = event.type === 'private' ? 'Evento Privado' : 'Evento Público';

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-[#160f2e] rounded-2xl p-8 max-w-md w-full border" style="border-color: ${typeColor}80;">
            <div class="text-center">
                <div class="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-4" style="background: ${typeColor}30; color: ${typeColor};">${typeLabel}</div>
                <h3 class="font-title text-3xl font-bold text-gold mb-2">${event.title}</h3>
                <p class="text-gray-300 text-lg mb-1">${dayName} ${d} de ${monthNames[parseInt(m) - 1]} ${y}</p>
                ${event.location ? `<p class="text-gray-400 text-sm mb-6">${event.location}</p>` : '<div class="mb-6"></div>'}
                ${event.type === 'public' ? `
                    <a href="https://wa.me/56994775389?text=${encodeURIComponent('Hola, vengo del sitio web de La Banda del Papi y me gustaría más información sobre el evento: ' + event.title + ' del ' + d + ' de ' + monthNames[parseInt(m) - 1])}" target="_blank" class="inline-flex items-center gap-2 btn-primary px-6 py-3 rounded-full text-black font-bold">
                        Más información
                    </a>
                ` : `
                    <p class="text-gray-500 text-sm">Evento privado - No abierto al público</p>
                `}
                <button class="block mx-auto mt-6 text-gray-500 hover:text-gold transition-colors" onclick="this.closest('.fixed').remove()">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadDbEvents();
    renderCalendar();
});
