import { loadGalleryItems } from './gallery.js';
import { loadBlogPosts, initializeEasyMDE } from './blog.js';
import { loadMembers } from './members.js';
import * as dom from './dom.js';

// --- TAB SWITCHING LOGIC ---
export function setupTabs() {
    const tabs = [
        { btn: dom.galleryTabBtn, content: dom.galleryContent, loadFunc: loadGalleryItems },
        { btn: dom.blogTabBtn, content: dom.blogContent, loadFunc: async () => { initializeEasyMDE(); await loadBlogPosts(); } },
        { btn: dom.membersTabBtn, content: dom.membersContent, loadFunc: loadMembers },
        { btn: dom.inviteUserTabBtn, content: dom.inviteUserContent, loadFunc: null } // Invite tab has no initial load func
    ];

    tabs.forEach(tab => {
        if (!tab.btn) { console.warn(`Tab button for content ID ${tab.content?.id} not found.`); return; }
        tab.btn.addEventListener('click', async () => {
            if (tab.content.classList.contains('active')) return;
            tabs.forEach(t => { t.btn?.classList.remove('active'); t.content?.classList.remove('active'); });
            tab.btn.classList.add('active');
            tab.content.classList.add('active');
            if (tab.loadFunc) {
                 try { await tab.loadFunc(); }
                 catch (loadError) { console.error(`Error loading content for ${tab.btn.id}:`, loadError); tab.content.innerHTML = `<div class="p-4"><p class="text-red-500 text-center font-semibold">Failed to load content: ${loadError.message}</p></div>`; }
            }
        });
    });
}