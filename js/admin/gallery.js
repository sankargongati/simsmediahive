import { _supabase } from './supabaseClient.js';
import * as dom from './dom.js';
import * as config from './config.js';
import { isVideoUrl, generateVideoThumbnail } from './utils.js';

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
                if (isVideo && itemData.imageUrl) {
                    const thumbnailUrl = await generateVideoThumbnail(itemData.imageUrl);
                    previewSrc = thumbnailUrl || config.defaultPlaceholder;
                } else if (!isVideo && itemData.imageUrl) {
                    previewSrc = itemData.imageUrl;
                }
            } catch (thumbError) {
                console.error(`Error generating thumbnail for ${itemData.imageUrl}:`, thumbError);
                previewSrc = config.defaultPlaceholder;
            }

            let filePath = `missing_path_${itemData.id}`;
            if (itemData.imageUrl) {
                try {
                    const url = new URL(itemData.imageUrl);
                    const pathParts = url.pathname.split('/');
                    const bucketIndex = pathParts.indexOf(config.GALLERY_BUCKET);
                    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
                        filePath = decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/'));
                    } else {
                        console.warn(`Could not extract file path from URL: ${itemData.imageUrl}`);
                    }
                } catch (urlError) {
                    console.warn(`Invalid URL for gallery item ${itemData.id}: ${itemData.imageUrl}`, urlError);
                }
            }

            return `
                <div class="gallery-item relative group bg-gray-900 border border-gray-800 rounded-lg overflow-hidden aspect-[4/3]" data-category="${itemCategory}">
                    <img src="${previewSrc}" alt="Preview: ${itemData.title || 'Untitled'}" class="absolute inset-0 w-full h-full object-cover bg-gray-800" onerror="this.onerror=null;this.src='${config.defaultPlaceholder}';">
                    ${isVideo ? `<div class="video-overlay-icon"><svg data-lucide="play"></svg></div>` : ''}
                    <div class="p-3 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8">
                        <p class="font-bold text-white truncate text-base">${itemData.title || 'Untitled'}</p>
                        <p class="text-xs text-yellow-400 capitalize">${itemCategory}</p>
                    </div>
                    <button data-id="${itemData.id}" data-path="${filePath}" ${filePath.startsWith('missing_path_') ? 'disabled title="Cannot delete - path missing"' : 'title="Delete Media"'} class="delete-gallery-btn absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity disabled:bg-gray-500 disabled:cursor-not-allowed">
                        <svg data-lucide="trash-2" width="14" height="14"></svg>
                    </button>
                </div>`;
        });

        const cardHTMLArray = await Promise.all(itemPromises);
        dom.galleryList.innerHTML = cardHTMLArray.join('');

        if (dom.galleryStatus && dom.galleryStatus.textContent === thumbnailStatus) {
            dom.galleryStatus.textContent = '';
        }

        initializeGalleryFilter();
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
    dom.galleryForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const submitBtn = dom.galleryForm.querySelector('button[type="submit"]'); submitBtn.disabled = true; submitBtn.textContent = 'Uploading...'; dom.galleryStatus.textContent = 'Starting...'; dom.galleryStatus.style.color = 'white'; const title = dom.galleryTitleInput.value; const category = dom.galleryForm.querySelector('input[name="gallery-category"]:checked').value; const file = dom.galleryMediaInput.files[0]; let imageUrl = null; let filePath = null;
        if (!file) { dom.galleryStatus.textContent = 'Please select a file to upload.'; dom.galleryStatus.style.color = 'red'; submitBtn.disabled = false; submitBtn.textContent = 'Upload Media'; return; }
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); filePath = `${Date.now()}_${cleanFileName}`;
        try { dom.galleryStatus.textContent = `Uploading ${file.type.split('/')[0]}...`; const { error: uploadError } = await _supabase.storage.from(config.GALLERY_BUCKET).upload(filePath, file); if (uploadError) throw uploadError; const { data: urlData } = _supabase.storage.from(config.GALLERY_BUCKET).getPublicUrl(filePath); if (!urlData || !urlData.publicUrl) throw new Error("Could not retrieve public URL after upload."); imageUrl = urlData.publicUrl; dom.galleryStatus.textContent = 'Saving gallery item details...'; const { error: dbError } = await _supabase.from('galleryImages').insert([{ title, category, imageUrl }]); if (dbError) throw dbError; dom.galleryStatus.textContent = 'Upload successful!'; dom.galleryStatus.style.color = '#22c55e'; dom.galleryForm.reset(); await loadGalleryItems(); }
        catch (error) { console.error("Gallery upload failed:", error); dom.galleryStatus.textContent = `Error: ${error.message}`; dom.galleryStatus.style.color = '#ef4444'; if (imageUrl && error.message !== "Could not retrieve public URL after upload.") { console.log("Attempting to remove orphaned file:", filePath); try { await _supabase.storage.from(config.GALLERY_BUCKET).remove([filePath]); } catch (cleanupError) { console.warn("Failed to cleanup orphaned file:", cleanupError); } } else if (!imageUrl && filePath){ console.log("Upload likely failed before URL generation, skipping removal attempt for:", filePath); } }
        finally { submitBtn.disabled = false; submitBtn.textContent = 'Upload Media'; setTimeout(() => { if(dom.galleryStatus && dom.galleryStatus.textContent !== 'Generating video thumbnails (may take time)...') dom.galleryStatus.textContent = ''; }, 4000); }
    });

    dom.galleryList.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-gallery-btn:not([disabled])'); if (!deleteButton) return; const docId = deleteButton.dataset.id; const filePath = deleteButton.dataset.path; if (!filePath || filePath.startsWith('missing_path_')) { alert('Error: Cannot delete item because its file path is missing.'); return; }
        if (confirm(`Are you sure you want to delete "${filePath}" permanently? This cannot be undone.`)) { dom.galleryStatus.textContent = 'Deleting item...'; dom.galleryStatus.style.color = 'white'; deleteButton.disabled = true; try { const { error: storageError } = await _supabase.storage.from(config.GALLERY_BUCKET).remove([filePath]); if (storageError && storageError.message !== 'The resource was not found') throw new Error(`Storage error: ${storageError.message}`); const { error: dbError } = await _supabase.from('galleryImages').delete().eq('id', docId); if (dbError) throw new Error(`Database error: ${dbError.message}`); dom.galleryStatus.textContent = 'Item deleted successfully!'; dom.galleryStatus.style.color = '#22c55e'; await loadGalleryItems(); } catch (error) { dom.galleryStatus.textContent = `Deletion failed: ${error.message}`; dom.galleryStatus.style.color = '#ef4444'; console.error("Gallery delete failed:", error); deleteButton.disabled = false; } finally { setTimeout(() => { if(dom.galleryStatus && dom.galleryStatus.textContent !== 'Generating video thumbnails (may take time)...') dom.galleryStatus.textContent = ''; }, 4000); } }
    });
}