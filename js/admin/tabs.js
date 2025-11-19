import { loadGalleryItems } from './gallery.js';
import { loadBlogPosts, initializeEasyMDE } from './blog.js';
import { loadMembers } from './members.js';
import { loadUserProfiles } from './profiles.js';
import { loadAnalytics } from './auth.js';
import * as dom from './dom.js';

// --- TAB SWITCHING LOGIC ---
export function setupTabs() {
    const tabs = [
        // Now includes both desktop (btn) and mobile (mobileBtn)
        { btn: dom.galleryTabBtn, mobileBtn: dom.mobileGalleryTabBtn, content: dom.galleryContent, loadFunc: loadGalleryItems },
        { btn: dom.blogTabBtn, mobileBtn: dom.mobileBlogTabBtn, content: dom.blogContent, loadFunc: async () => { initializeEasyMDE(); await loadBlogPosts(); } },
        { btn: dom.membersTabBtn, mobileBtn: dom.mobileMembersTabBtn, content: dom.membersContent, loadFunc: loadMembers },
        { btn: dom.inviteUserTabBtn, mobileBtn: dom.mobileInviteUserTabBtn, content: dom.inviteUserContent, loadFunc: null },
        { btn: dom.profilesTabBtn, mobileBtn: dom.mobileProfilesTabBtn, content: dom.profilesContent, loadFunc: loadUserProfiles },
        { btn: dom.analyticsTabBtn, mobileBtn: dom.analyticsTabBtn, content: dom.analyticsContent, loadFunc: loadAnalytics }
    ];

    tabs.forEach(tab => {
        // Create an array of buttons that exist (filters out nulls)
        const buttons = [tab.btn, tab.mobileBtn].filter(Boolean);

        buttons.forEach(button => {
            if (!button) { console.warn(`A tab button for content ID ${tab.content?.id} not found.`); return; }
            
            button.addEventListener('click', async () => {
                if (tab.content.classList.contains('active')) {
                    // If it's already active, just close the mobile menu
                    if (dom.mobileMenu) dom.mobileMenu.classList.add('hidden');
                    return;
                }
                
                // Deactivate all tabs (both desktop and mobile)
                tabs.forEach(t => { 
                    t.btn?.classList.remove('active'); 
                    t.mobileBtn?.classList.remove('active');
                    t.content?.classList.remove('active'); 
                });
                
                // Activate the correct tab (both desktop and mobile)
                tab.btn?.classList.add('active');
                tab.mobileBtn?.classList.add('active');
                tab.content.classList.add('active');
                
                // Close the mobile menu on selection
                if (dom.mobileMenu) dom.mobileMenu.classList.add('hidden');
                
                // Load content
                if (tab.loadFunc) {
                     try { await tab.loadFunc(); }
                     catch (loadError) { console.error(`Error loading content for ${tab.btn.id}:`, loadError); tab.content.innerHTML = `<div class="p-4"><p class="text-red-500 text-center font-semibold">Failed to load content: ${loadError.message}</p></div>`; }
                }
            });
        });
    });
}
