// --- INITIAL PAGE LOAD ---
import { initDom } from './dom.js'; // <-- 1. IMPORT initDom
import { initAuth, checkAuth } from './auth.js';
import { setupTabs } from './tabs.js';
import { initGalleryListeners } from './gallery.js';
import { initBlogListeners } from './blog.js';
import { initMembersListeners } from './members.js';
import { initInviteFormListener } from './invite.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Setting up page...");
    
    initDom(); // <-- 2. RUN initDom FIRST!
    
    lucide.createIcons(); // Initialize static icons
    
    // Setup all event listeners (now safe to run)
    initAuth();
    setupTabs();
    initGalleryListeners();
    initBlogListeners();
    initMembersListeners();
    initInviteFormListener();
    
    // Check login status and load initial data
    checkAuth(); 
});
