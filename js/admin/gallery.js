import { _supabase } from './supabaseClient.js';
import * as dom from './dom.js';
import * as config from './config.js';
import { isVideoUrl, generateVideoThumbnail } from './utils.js';
import { currentUserRole } from './auth.js';

// YouTube Player Functions
function openYouTubeModal(videoUrl) {
    console.log('openYouTubeModal called with URL:', videoUrl);
    if (!dom.youtubeModal || !dom.youtubePlayerContainer) {
        console.error('YouTube modal elements not found');
        return;
    }

    const videoId = extractYouTubeVideoId(videoUrl);
    console.log('Extracted video ID:', videoId);
    if (!videoId) {
        console.error('Could not extract video ID from URL');
        return;
    }

    // Create YouTube embed iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.className = 'absolute inset-0 w-full h-full rounded-lg';

    console.log('Created iframe with src:', iframe.src);

    // Clear previous content and add new iframe
    dom.youtubePlayerContainer.innerHTML = '';
    dom.youtubePlayerContainer.appendChild(iframe);

    // Show modal
    dom.youtubeModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    console.log('YouTube modal should now be visible');
}

function closeYouTubeModal() {
    if (!dom.youtubeModal) return;

    // Stop video by clearing iframe
    dom.youtubePlayerContainer.innerHTML = '';

    // Hide modal
    dom.youtubeModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// --- GALLERY MANAGEMENT ---
export async function loadGalleryItems() {
    dom.galleryList.innerHTML = '<p class="text-gray-400 col-span-full text-center">Loading gallery...</p>';
    let thumbnailStatus = '';
    try {
        const { data, error } = await _supabase.from('galleryImages').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        dom.galleryList.innerHTML = ''; // Clear loading/previous items

        if (!data || data.length === 0) {
            dom.galleryList.innerHTML = '<p class="text-gray-400 col-span-full text-center">No items in the gallery yet.</p>';
            initializeGalleryFilter();
            return; // Exit if no data
        }

        const videosPresent = data.some(item => item.category === 'video' || (item.category !== 'photo' && isVideoUrl(item.imageUrl)));
        if (videosPresent && dom.galleryStatus) {
             thumbnailStatus = 'Generating video thumbnails (may take time)...';
             dom.galleryStatus.textContent = thumbnailStatus;
             dom.galleryStatus.style.color = 'white';
        }

        const itemPromises = data.map(async (itemData) => {
            const isVideo = itemData.category === 'video' || (itemData.category !== 'photo' && isVideoUrl(itemData.imageUrl));
            const itemCategory = isVideo ? 'video' : 'photo';
            let previewSrc = config.defaultPlaceholder;

            try {
                if (itemData.imageUrl) {
                    // Always check for YouTube URL first, regardless of category
                    if (itemData.imageUrl.includes('youtube.com') || itemData.imageUrl.includes('youtu.be')) {
                        // Extract YouTube video ID and create thumbnail URL
                        const videoId = extractYouTubeVideoId(itemData.imageUrl);
                        if (videoId) {
                            previewSrc = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                        } else {
                            previewSrc = config.defaultPlaceholder;
                        }
                    } else if (isVideo) {
                        // For non-YouTube videos, generate thumbnail
                        const thumbnailUrl = await generateVideoThumbnail(itemData.imageUrl);
                        previewSrc = thumbnailUrl || config.defaultPlaceholder;
                    } else {
                        // For photos and other non-video items
                        previewSrc = itemData.imageUrl;
                    }
                }
            } catch (thumbError) {
                console.error(`Error generating thumbnail for ${itemData.imageUrl}:`, thumbError);
                previewSrc = config.defaultPlaceholder;
            }

            let filePath = null;
            let isYouTubeItem = false;
            if (itemData.imageUrl) {
                // Check if it's a YouTube URL
                if (itemData.imageUrl.includes('youtube.com') || itemData.imageUrl.includes('youtu.be')) {
                    isYouTubeItem = true;
                    filePath = 'youtube_item'; // Special marker for YouTube items
                } else {
                    try {
                        const url = new URL(itemData.imageUrl);
                        const pathParts = url.pathname.split('/');
                        const bucketIndex = pathParts.indexOf(config.GALLERY_BUCKET);
                        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                            filePath = decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/'));
                        } else {
                            console.warn(`Could not extract file path from URL: ${itemData.imageUrl}`);
                            filePath = `missing_path_${itemData.id}`;
                        }
                    } catch (urlError) {
                        console.warn(`Invalid URL for gallery item ${itemData.id}: ${itemData.imageUrl}`, urlError);
                        filePath = `missing_path_${itemData.id}`;
                    }
                }
            }

            // Check if it's a YouTube URL for special handling
            const isYouTube = itemData.imageUrl.includes('youtube.com') || itemData.imageUrl.includes('youtu.be');
            const displayCategory = isYouTube ? 'video' : itemCategory;

            return `
                <div class="gallery-item relative group bg-gray-900 border border-gray-800 rounded-lg overflow-hidden aspect-[4/3]" data-category="${displayCategory}">
                    ${isYouTube ? `
                        <div data-youtube-url="${itemData.imageUrl}" class="youtube-play-btn absolute inset-0 w-full h-full cursor-pointer">
                            <img src="${previewSrc}" alt="Preview: ${itemData.title || 'Untitled'}" class="absolute inset-0 w-full h-full object-cover bg-gray-800" onerror="this.onerror=null;this.src='${config.defaultPlaceholder}';">
                            <div class="video-overlay-icon"><svg data-lucide="play"></svg></div>
                            <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                <div class="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                    Play Video
                                </div>
                            </div>
                        </div>
                    ` : `
                        <img src="${previewSrc}" alt="Preview: ${itemData.title || 'Untitled'}" class="absolute inset-0 w-full h-full object-cover bg-gray-800" onerror="this.onerror=null;this.src='${config.defaultPlaceholder}';">
                        ${isVideo ? `<div class="video-overlay-icon"><svg data-lucide="play"></svg></div>` : ''}
                    `}
                    <div class="p-3 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8">
                        <p class="font-bold text-white truncate text-base">${itemData.title || 'Untitled'}</p>
                        <p class="text-xs text-yellow-400 capitalize">${displayCategory}</p>
                    </div>
                    ${['admin', 'editor', 'super_admin', 'owner'].includes(currentUserRole) ? `<button data-id="${itemData.id}" data-path="${filePath}" ${filePath === 'youtube_item' ? 'title="Delete YouTube Item"' : filePath && filePath.startsWith('missing_path_') ? 'disabled title="Cannot delete - path missing"' : 'title="Delete Media"'} class="delete-gallery-btn absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <svg data-lucide="trash-2" width="14" height="14"></svg>
                    </button>` : ''}
                </div>`;
        });

        const cardHTMLArray = await Promise.all(itemPromises);
        dom.galleryList.innerHTML = cardHTMLArray.join('');

        if (dom.galleryStatus && dom.galleryStatus.textContent === thumbnailStatus) {
            dom.galleryStatus.textContent = '';
        }

        initializeGalleryFilter();
        initializeGallerySearch();
        lucide.createIcons();

    } catch (error) {
        console.error('Error fetching gallery items:', error);
        dom.galleryList.innerHTML = `<p class="text-red-500 col-span-full text-center">Could not fetch gallery: ${error.message}</p>`;
        if(dom.galleryStatus) dom.galleryStatus.textContent = '';
    }
}

function initializeGalleryFilter() {
    if (!dom.galleryFilterButtonsContainer || !dom.galleryList) return;
    const filterButtons = dom.galleryFilterButtonsContainer.querySelectorAll('.filter-btn');
    const galleryItems = dom.galleryList.querySelectorAll('.gallery-item');

     if ((!galleryItems || galleryItems.length === 0) && filterButtons.length > 0) {
         filterButtons.forEach((btn, index) => {
             const isActive = index === 0;
             btn.classList.toggle('active', isActive);
             btn.classList.toggle('bg-yellow-500', isActive);
             btn.classList.toggle('text-black', isActive);
             btn.classList.toggle('bg-gray-800', !isActive);
             btn.classList.toggle('text-gray-400', !isActive);
             btn.classList.toggle('hover:bg-gray-700', !isActive);
             btn.classList.toggle('hover:text-white', !isActive);
         });
         return;
     }

    const activeClasses = ['active', 'bg-yellow-500', 'text-black'];
    const inactiveClasses = ['bg-gray-800', 'text-gray-400', 'hover:bg-gray-700', 'hover:text-white'];

    dom.galleryFilterButtonsContainer.replaceWith(dom.galleryFilterButtonsContainer.cloneNode(true));
    document.getElementById('gallery-filter-buttons').addEventListener('click', (e) => {
         if (!e.target.classList.contains('filter-btn')) return;
         const clickedButton = e.target;
         const filterValue = clickedButton.getAttribute('data-filter');

          document.querySelectorAll('#gallery-filter-buttons .filter-btn').forEach(btn => {
             btn.classList.remove(...activeClasses);
             btn.classList.add(...inactiveClasses);
         });
         clickedButton.classList.add(...activeClasses);
         clickedButton.classList.remove(...inactiveClasses.filter(c => !c.startsWith('hover:')));

         dom.galleryList.querySelectorAll('.gallery-item').forEach(item => {
             const itemCategory = item.getAttribute('data-category');
             item.classList.toggle('hidden', !(filterValue === 'all' || itemCategory === filterValue));
         });
    });

     const initialActiveButton = document.getElementById('gallery-filter-buttons').querySelector('.filter-btn.active') || document.getElementById('gallery-filter-buttons').querySelector('.filter-btn');
     if (initialActiveButton) {
         const initialFilter = initialActiveButton.dataset.filter || 'all';
          document.querySelectorAll('#gallery-filter-buttons .filter-btn').forEach(btn => {
             const isActive = btn === initialActiveButton;
             btn.classList.toggle('active', isActive);
             btn.classList.toggle('bg-yellow-500', isActive);
             btn.classList.toggle('text-black', isActive);
             btn.classList.toggle('bg-gray-800', !isActive);
             btn.classList.toggle('text-gray-400', !isActive);
              btn.classList.toggle('hover:bg-gray-700', !isActive);
             btn.classList.toggle('hover:text-white', !isActive);
         });

         if (galleryItems && galleryItems.length > 0) {
             galleryItems.forEach(item => {
                 const itemCategory = item.getAttribute('data-category');
                 item.classList.toggle('hidden', !(initialFilter === 'all' || itemCategory === initialFilter));
             });
         }
     }
}

export function initGalleryListeners() {
    // Modal close handlers
    if (dom.youtubeModalClose) {
        dom.youtubeModalClose.addEventListener('click', closeYouTubeModal);
    }

    // Close modal when clicking outside
    if (dom.youtubeModal) {
        dom.youtubeModal.addEventListener('click', (e) => {
            if (e.target === dom.youtubeModal) {
                closeYouTubeModal();
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dom.youtubeModal && !dom.youtubeModal.classList.contains('hidden')) {
            closeYouTubeModal();
        }
    });

    // Initialize Lucide icons for modal close button
    if (dom.youtubeModalClose) {
        lucide.createIcons();
    }

    console.log('Gallery listeners initialized, YouTube modal elements:', {
        modal: dom.youtubeModal,
        closeBtn: dom.youtubeModalClose,
        container: dom.youtubePlayerContainer
    });
    dom.galleryForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const submitBtn = dom.galleryForm.querySelector('button[type="submit"]'); submitBtn.disabled = true; submitBtn.textContent = 'Uploading...'; dom.galleryStatus.textContent = 'Starting...'; dom.galleryStatus.style.color = 'white'; const title = dom.galleryTitleInput.value; const category = dom.galleryForm.querySelector('input[name="gallery-category"]:checked').value; const file = dom.galleryMediaInput.files[0]; const youtubeUrl = dom.galleryYoutubeUrl.value.trim(); let imageUrl = null; let filePath = null;

        // Validation: either file or YouTube URL must be provided
        if (!file && !youtubeUrl) { dom.galleryStatus.textContent = 'Please select a file to upload or paste a YouTube URL.'; dom.galleryStatus.style.color = 'red'; submitBtn.disabled = false; submitBtn.textContent = 'Upload Media'; return; }
        if (file && youtubeUrl) { dom.galleryStatus.textContent = 'Please choose either file upload OR YouTube URL, not both.'; dom.galleryStatus.style.color = 'red'; submitBtn.disabled = false; submitBtn.textContent = 'Upload Media'; return; }

        // Handle YouTube URL
        if (youtubeUrl) {
            // Basic YouTube URL validation
            const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}/;
            if (!youtubeRegex.test(youtubeUrl)) {
                dom.galleryStatus.textContent = 'Please enter a valid YouTube URL.'; dom.galleryStatus.style.color = 'red'; submitBtn.disabled = false; submitBtn.textContent = 'Upload Media'; return;
            }
            imageUrl = youtubeUrl;
            dom.galleryStatus.textContent = 'Saving gallery item details...';
        } else {
            // Handle file upload
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); filePath = `${Date.now()}_${cleanFileName}`;
            try { dom.galleryStatus.textContent = `Uploading ${file.type.split('/')[0]}...`; const { error: uploadError } = await _supabase.storage.from(config.GALLERY_BUCKET).upload(filePath, file); if (uploadError) throw uploadError; const { data: urlData } = _supabase.storage.from(config.GALLERY_BUCKET).getPublicUrl(filePath); if (!urlData || !urlData.publicUrl) throw new Error("Could not retrieve public URL after upload."); imageUrl = urlData.publicUrl; dom.galleryStatus.textContent = 'Saving gallery item details...'; }
            catch (uploadError) { console.error("Gallery upload failed:", uploadError); dom.galleryStatus.textContent = `Error: ${uploadError.message}`; dom.galleryStatus.style.color = '#ef4444'; submitBtn.disabled = false; submitBtn.textContent = 'Upload Media'; return; }
        }

        try { const { error: dbError } = await _supabase.from('galleryImages').insert([{ title, category, imageUrl }]); if (dbError) throw dbError; dom.galleryStatus.textContent = 'Upload successful!'; dom.galleryStatus.style.color = '#22c55e'; dom.galleryForm.reset(); await loadGalleryItems(); }
        catch (error) { console.error("Gallery save failed:", error); dom.galleryStatus.textContent = `Error: ${error.message}`; dom.galleryStatus.style.color = '#ef4444'; if (filePath && !youtubeUrl && error.message !== "Could not retrieve public URL after upload.") { console.log("Attempting to remove orphaned file:", filePath); try { await _supabase.storage.from(config.GALLERY_BUCKET).remove([filePath]); } catch (cleanupError) { console.warn("Failed to cleanup orphaned file:", cleanupError); } } }
        finally { submitBtn.disabled = false; submitBtn.textContent = 'Upload Media'; setTimeout(() => { if(dom.galleryStatus && dom.galleryStatus.textContent !== 'Generating video thumbnails (may take time)...') dom.galleryStatus.textContent = ''; }, 4000); }
    });

    // Handle YouTube video play
    dom.galleryList.addEventListener('click', (e) => {
        const youtubePlayBtn = e.target.closest('.youtube-play-btn');
        if (youtubePlayBtn && !e.target.closest('.delete-gallery-btn')) {
            e.preventDefault();
            const videoUrl = youtubePlayBtn.dataset.youtubeUrl;
            if (videoUrl) {
                console.log('Opening YouTube modal for URL:', videoUrl);
                openYouTubeModal(videoUrl);
            }
            return;
        }
    });

    // Handle delete button
    dom.galleryList.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-gallery-btn:not([disabled])'); if (!deleteButton) return;

        // Check if user has permission to delete
        if (!['admin', 'editor', 'super_admin', 'owner'].includes(currentUserRole)) {
            alert('You do not have permission to delete gallery items.');
            return;
        }

        const docId = deleteButton.dataset.id; const filePath = deleteButton.dataset.path;

        // Allow deletion of YouTube items and items with valid file paths
        if (!filePath || filePath.startsWith('missing_path_')) {
            alert('Error: Cannot delete item because its file path is missing.');
            return;
        }

        const confirmMessage = filePath === 'youtube_item' ?
            'Are you sure you want to delete this YouTube item permanently? This cannot be undone.' :
            `Are you sure you want to delete "${filePath}" permanently? This cannot be undone.`;

        if (confirm(confirmMessage)) {
            dom.galleryStatus.textContent = 'Deleting item...';
            dom.galleryStatus.style.color = 'white';
            deleteButton.disabled = true;

            try {
                // Only try to delete from storage if it's not a YouTube item
                if (filePath !== 'youtube_item') {
                    const { error: storageError } = await _supabase.storage.from(config.GALLERY_BUCKET).remove([filePath]);
                    if (storageError && storageError.message !== 'The resource was not found') throw new Error(`Storage error: ${storageError.message}`);
                }

                const { error: dbError } = await _supabase.from('galleryImages').delete().eq('id', docId);
                if (dbError) throw new Error(`Database error: ${dbError.message}`);

                dom.galleryStatus.textContent = 'Item deleted successfully!';
                dom.galleryStatus.style.color = '#22c55e';
                await loadGalleryItems();
            } catch (error) {
                dom.galleryStatus.textContent = `Deletion failed: ${error.message}`;
                dom.galleryStatus.style.color = '#ef4444';
                console.error("Gallery delete failed:", error);
                deleteButton.disabled = false;
            } finally {
                setTimeout(() => {
                    if(dom.galleryStatus && dom.galleryStatus.textContent !== 'Generating video thumbnails (may take time)...') dom.galleryStatus.textContent = '';
                }, 4000);
            }
        }
    });
}

function initializeGallerySearch() {
    if (!dom.gallerySearch) return;
    
    dom.gallerySearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const galleryItems = dom.galleryList.querySelectorAll('.gallery-item');
        
        galleryItems.forEach(item => {
            const title = item.querySelector('p.font-bold').textContent.toLowerCase();
            const category = item.querySelector('p.text-xs').textContent.toLowerCase();
            
            const matchesSearch = title.includes(searchTerm) || category.includes(searchTerm);
            const isCurrentlyVisible = !item.classList.contains('hidden');
            const filterActive = item.classList.contains('hidden') === false; // Check if item is visible by filter
            
            // Only hide if it doesn't match search AND is currently visible
            if (!matchesSearch) {
                item.classList.add('hidden');
            } else if (matchesSearch && isCurrentlyVisible) {
                item.classList.remove('hidden');
            }
        });
    });
}