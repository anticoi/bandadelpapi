// MODULAR VIDEO DATA - Loads from /api/videos (DB) with fallback to hardcoded data

const fallbackVideoData = [
    { id: 1, type: 'youtube', title: 'Que No Pare la Fiesta', url: 'https://www.youtube.com/watch?v=T-rrTTiyUak', embedUrl: 'https://www.youtube.com/embed/T-rrTTiyUak', thumbnail: 'https://img.youtube.com/vi/T-rrTTiyUak/maxresdefault.jpg', description: 'El éxito que enciende la fiesta cumbiera' },
    { id: 2, type: 'youtube', title: 'Invéntame', url: 'https://www.youtube.com/watch?v=9OVUDKTye5A', embedUrl: 'https://www.youtube.com/embed/9OVUDKTye5A', thumbnail: 'https://img.youtube.com/vi/9OVUDKTye5A/maxresdefault.jpg', description: 'Cumbia con sabor y sentimiento tropical' },
    { id: 3, type: 'youtube', title: 'La Felicidad (Primicia)', url: 'https://www.youtube.com/watch?v=iq-oZkbqFSw', embedUrl: 'https://www.youtube.com/embed/iq-oZkbqFSw', thumbnail: 'https://img.youtube.com/vi/iq-oZkbqFSw/maxresdefault.jpg', description: 'Cumbia Urbana - Cesar Caamaño' },
    { id: 4, type: 'youtube', title: 'Que Linda Es la Vida', url: 'https://www.youtube.com/watch?v=8mULAVe2PGA', embedUrl: 'https://www.youtube.com/embed/8mULAVe2PGA', thumbnail: 'https://img.youtube.com/vi/8mULAVe2PGA/maxresdefault.jpg', description: 'Una cumbia que celebra la vida' },
    { id: 5, type: 'youtube', title: 'Evidencias', url: 'https://www.youtube.com/watch?v=clM2RGAcz-M', embedUrl: 'https://www.youtube.com/embed/clM2RGAcz-M', thumbnail: 'https://img.youtube.com/vi/clM2RGAcz-M/maxresdefault.jpg', description: 'Cumbia romántica con el sello de La Banda del Papi' },
    { id: 6, type: 'youtube', title: 'Quiero Que Me Paqueen', url: 'https://www.youtube.com/watch?v=QLR-Al_-i3o', embedUrl: 'https://www.youtube.com/embed/QLR-Al_-i3o', thumbnail: 'https://img.youtube.com/vi/QLR-Al_-i3o/maxresdefault.jpg', description: 'Pura cumbia bailable para no parar' }
];

let videoData = [];

// Load videos from API, fallback to hardcoded
async function loadVideoData() {
    try {
        const response = await fetch('/api/videos');
        if (response.ok) {
            const data = await response.json();
            if (data.videos && data.videos.length > 0) {
                videoData = data.videos.map(v => ({
                    type: 'youtube',
                    title: v.title,
                    url: 'https://www.youtube.com/watch?v=' + v.youtube_id,
                    embedUrl: 'https://www.youtube.com/embed/' + v.youtube_id,
                    thumbnail: 'https://img.youtube.com/vi/' + v.youtube_id + '/maxresdefault.jpg',
                    description: v.description || ''
                }));
                renderVideos();
                return;
            }
        }
        throw new Error('API vacia o error');
    } catch (error) {
        console.log('Cargando videos desde fallback...');
        videoData = fallbackVideoData;
        renderVideos();
    }
}

// Function to render videos dynamically
function renderVideos() {
    const container = document.getElementById('videos-container');
    if (!container) return;
    container.innerHTML = '';

    videoData.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'bg-[#0c0612] rounded-2xl overflow-hidden border border-amber-400/20 card-hover';

        if (video.type === 'youtube') {
            videoCard.innerHTML = `
                <div class="video-container">
                    <iframe
                        src="${video.embedUrl}"
                        title="${video.title}"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-bold text-gold mb-2">${video.title}</h3>
                    <p class="text-gray-400">${video.description}</p>
                    <a href="${video.url}" target="_blank" class="inline-flex items-center space-x-2 text-gold hover:underline mt-4">
                        <span>Ver en YouTube</span>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                        </svg>
                    </a>
                </div>
            `;
        }

        container.appendChild(videoCard);
    });
}

// Auto-load on DOM ready
document.addEventListener('DOMContentLoaded', loadVideoData);
