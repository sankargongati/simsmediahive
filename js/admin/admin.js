// --- INITIAL PAGE LOAD ---
import { initDom } from './dom.js';
import { initAuth, checkAuth } from './auth.js';
import { setupTabs } from './tabs.js';
import { initGalleryListeners } from './gallery.js';
import { initBlogListeners } from './blog.js';
import { initMembersListeners } from './members.js';
import { initInviteFormListener } from './invite.js';
import { setupProfileEventListeners } from './profiles.js';
import * as dom from './dom.js'; // Import dom for mobile menu
import { SUPABASE_DASHBOARD_URL } from './config.js';

/**
 * Sets up the open/close listeners for the mobile burger menu
 */
function initMobileMenu() {
    if (dom.burgerMenuBtn) {
        dom.burgerMenuBtn.addEventListener('click', () => {
            dom.mobileMenu.classList.remove('hidden');
        });
    }
    if (dom.mobileMenuCloseBtn) {
        dom.mobileMenuCloseBtn.addEventListener('click', () => {
            dom.mobileMenu.classList.add('hidden');
        });
    }
    // Re-use existing logout logic
    if (dom.mobileLogoutBtn && dom.logoutButton) {
        dom.mobileLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dom.logoutButton.click(); // Trigger the original logout button
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Setting up page...");

    initDom(); // Run initDom FIRST

    lucide.createIcons(); // Initialize static icons (will now also render mobile icons)

    // Set database button hrefs
    const dbButtonDesktop = document.getElementById('db-button-desktop');
    const dbButtonMobile = document.getElementById('db-button-mobile');
    if (dbButtonDesktop) dbButtonDesktop.href = SUPABASE_DASHBOARD_URL;
    if (dbButtonMobile) dbButtonMobile.href = SUPABASE_DASHBOARD_URL;

    // Setup all event listeners
    initAuth();
    setupTabs();
    initMobileMenu(); // <-- ADD THIS
    initGalleryListeners();
    initBlogListeners();
    initMembersListeners();
    initInviteFormListener();
    setupProfileEventListeners();

    // Check login status and load initial data
    checkAuth();
});
