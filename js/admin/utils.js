// --- Helper Functions ---
export function isVideoUrl(url) {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.endsWith(ext));
}

// --- Video Thumbnail Generation Function ---
export async function generateVideoThumbnail(videoUrl) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        let resolved = false;

        video.classList.add('thumbnail-generator-video');
        video.muted = true; video.playsInline = true; video.preload = 'metadata'; video.crossOrigin = 'anonymous';

        const onError = (e) => { if (resolved) return; console.warn(`Thumb gen failed for ${videoUrl}:`, (e.type || 'Error'), e); cleanup(); resolve(null); };
        const cleanup = () => { video.removeEventListener('loadeddata', onLoadedData); video.removeEventListener('seeked', onSeeked); video.removeEventListener('error', onError); video.removeEventListener('stalled', onError); video.removeEventListener('abort', onError); clearTimeout(timeoutId); if (video.parentNode === document.body) document.body.removeChild(video); };
        const timeoutId = setTimeout(() => { if (resolved) return; console.warn(`Thumb gen timed out for ${videoUrl}`); cleanup(); resolve(null); }, 15000); // 15 seconds timeout

        const onLoadedData = () => {
            if (!video.videoWidth || !video.videoHeight) { console.warn(`Invalid dimensions for ${videoUrl} on loadeddata`); cleanup(); resolve(null); return; }
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            video.currentTime = Math.min(1, (video.duration || 2) / 2); // Seek to 1s or middle
         };
        const onSeeked = () => {
            if (resolved) return;
            setTimeout(() => {
                if (resolved) return;
                try {
                     if (!video.videoWidth || !video.videoHeight) { console.warn(`Invalid dimensions for ${videoUrl} on seeked`); cleanup(); resolve(null); return; }
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Quality 0.7
                    resolved = true;
                    cleanup();
                    resolve(dataUrl);
                } catch (drawError) {
                    onError(drawError);
                }
            }, 150); // 150ms delay
        };

        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);
        video.addEventListener('stalled', onError);
        video.addEventListener('abort', onError);

        video.src = videoUrl;
        document.body.appendChild(video); // Append to body helps ensure loading
        video.load(); // Explicitly call load
    });
}