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

// Initialize drag and drop functionality for file uploads
function initDragAndDrop() {
    // Gallery upload area
    if (dom.galleryUploadArea) {
        setupDragAndDrop(dom.galleryUploadArea, dom.galleryMediaInput);
    }
    
    // Blog upload area
    if (dom.blogUploadArea) {
        setupDragAndDrop(dom.blogUploadArea, dom.blogHeaderMediaInput);
    }
    
    // Member upload area
    if (dom.memberUploadArea) {
        setupDragAndDrop(dom.memberUploadArea, dom.memberImageInput);
    }
}

function setupDragAndDrop(uploadArea, fileInput) {
    if (!uploadArea || !fileInput) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);
    
    // Handle click to select file
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length) {
            fileInput.files = files;
            // Trigger change event to update UI
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

// Initialize modal functionality
function initModals() {
    // Loading modal
    if (dom.loadingModal) {
        dom.loadingModal.addEventListener('click', (e) => {
            if (e.target === dom.loadingModal) {
                dom.loadingModal.classList.remove('active');
            }
        });
    }
    
    // Confirmation modal
    if (dom.confirmationModal) {
        dom.confirmationModal.addEventListener('click', (e) => {
            if (e.target === dom.confirmationModal) {
                dom.confirmationModal.classList.remove('active');
            }
        });
    }
    
    if (dom.cancelConfirmationBtn) {
        dom.cancelConfirmationBtn.addEventListener('click', () => {
            dom.confirmationModal.classList.remove('active');
        });
    }
    
    if (dom.confirmConfirmationBtn) {
        dom.confirmConfirmationBtn.addEventListener('click', () => {
            dom.confirmationModal.classList.remove('active');
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
    initDragAndDrop();
    initModals();

    // Check login status and load initial data
    checkAuth();
});
