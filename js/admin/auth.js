import { _supabase } from './supabaseClient.js';
import { loadGalleryItems } from './gallery.js';
import { loadBlogPosts, initializeEasyMDE } from './blog.js';
import { loadMembers } from './members.js';
import * as dom from './dom.js';

/**
 * Applies permissions based on the user's role.
 * Hides/shows tabs and UI elements.
 * @param {string} role - The user's role (e.g., 'editor', 'admin', 'super_admin')
 */
function applyPermissions(role) {
    console.log(`Applying "${role}" permissions.`);

    // 1. Start by hiding all restricted tabs (they are hidden by default in HTML,
    // but this is a good safeguard)
    if (dom.membersTabBtn) dom.membersTabBtn.style.display = 'none';
    if (dom.inviteUserTabBtn) dom.inviteUserTabBtn.style.display = 'none';
    
    // 2. Grant permissions based on role (additive hierarchy)
    
    // 'editor' (or higher) can see Gallery and Blog
    if (role === 'editor' || role === 'admin' || role === 'super_admin') {
        if (dom.galleryTabBtn) dom.galleryTabBtn.style.display = 'flex';
        if (dom.blogTabBtn) dom.blogTabBtn.style.display = 'flex';
    }
    
    // 'admin' (or higher) can also see Members
    if (role === 'admin' || role === 'super_admin') {
        if (dom.membersTabBtn) dom.membersTabBtn.style.display = 'flex';
    }
    
    // 'super_admin' (only) can also see Invite User
    if (role === 'super_admin') {
        if (dom.inviteUserTabBtn) dom.inviteUserTabBtn.style.display = 'flex';
    }
    
    // 3. Ensure the active tab is one they are allowed to see
    const activeTabBtn = document.querySelector('.tab-btn.active');
    
    // Check if the currently active tab button is hidden
    if (activeTabBtn && getComputedStyle(activeTabBtn).display === 'none') {
        console.warn("Permissions hide the active tab. Switching to Gallery.");
        
        // Deactivate current hidden tab
        document.querySelector('.tab-content.active')?.classList.remove('active');
        activeTabBtn.classList.remove('active');
        
        // Activate the default 'Gallery' tab (if it's visible)
        if (dom.galleryTabBtn && dom.galleryContent && getComputedStyle(dom.galleryTabBtn).display !== 'none') {
            dom.galleryTabBtn.classList.add('active');
            dom.galleryContent.classList.add('active');
        }
    }
}

// --- AUTHENTICATION ---
export async function checkAuth() {
    console.log("Checking authentication...");
    try {
        const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
            console.log("No active session found.");
            dom.loadingMessage.textContent = "Authentication required. Redirecting to login...";
            setTimeout(() => window.location.href = '/login.html', 1500);
            return;
        }
        
        console.log("User authenticated:", session.user.email);
        
        // --- Fetch user's role from the 'profiles' table ---
        let userRole = null;
        try {
            const { data: profile, error: profileError } = await _supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single(); 
            
            if (profileError && profileError.code !== 'PGRST116') {
                // 'PGRST116' means 'no rows returned', which we check for below.
                // Any other error is a real problem.
                throw profileError;
            }
            if (profile) {
                userRole = profile.role;
            }
            console.log("User role:", userRole);

        } catch (roleError) {
            console.error("Error fetching user role:", roleError.message);
            dom.loadingMessage.textContent = `Error fetching permissions: ${roleError.message}`;
            dom.loadingMessage.style.color = '#ef4444'; // Red
            return; // Stop execution
        }
        
        // --- UPDATED PERMISSION CHECK ---
        
        // 1. If the user is a 'member', redirect them to their own dashboard.
        if (userRole === 'member') {
            console.warn("Access Denied: User is a 'member'. Redirecting to member dashboard...");
            dom.loadingMessage.textContent = "Redirecting to your dashboard...";
            
            // *** CHANGE THIS URL ***
            // Change '/member-dashboard.html' to the correct path for your member page.
            window.location.href = '/member-dashboard.html'; 
            return; // Stop execution
        }
        
        // 2. If the user has no role (e.g., trigger failed), block them.
        if (!userRole) {
             console.error("Access Denied: User role is null or undefined.");
             dom.loadingMessage.innerHTML = `
                <h1 class="text-3xl font-bold oswald text-red-500">Access Denied</h1>
                <p class="text-gray-400 mt-2">Your user profile does not have a role assigned. Please contact support.</p>
            `;
            dom.loadingMessage.style.display = 'flex';
            dom.adminContentWrapper.classList.add('hidden'); // Hide admin content
            return; // Stop execution
        }
        
        // 3. If the role is 'editor', 'admin', or 'super_admin', proceed.
        // --- END OF UPDATED CHECK ---

        // Apply permissions BEFORE showing the content
        applyPermissions(userRole);

        // Now show the admin panel
        dom.loadingMessage.style.display = 'none';
        dom.adminContentWrapper.classList.remove('hidden');

        // Load the content for the *visible* active tab
        const activeTab = document.querySelector('.tab-btn.active');
        if (!activeTab) {
             console.warn("No active tab found after permissions. Defaulting to gallery.");
             if (dom.galleryTabBtn.style.display !== 'none') {
                 dom.galleryTabBtn.classList.add('active');
                 dom.galleryContent.classList.add('active');
                 await loadGalleryItems();
             }
             return;
        }

        if (activeTab.id === 'gallery-tab-btn') {
            console.log("Initial load: Gallery tab active.");
            await loadGalleryItems();
        } else if (activeTab.id === 'blog-tab-btn') {
            console.log("Initial load: Blog tab active.");
            initializeEasyMDE();
            await loadBlogPosts();
        } else if (activeTab.id === 'members-tab-btn') {
            console.log("Initial load: Members tab active.");
            await loadMembers();
        } else if (activeTab.id === 'invite-user-tab-btn') {
            console.log("Initial load: Invite User tab active.");
            // No data load needed
        }

    } catch (error) {
         console.error("Auth check failed:", error);
         dom.loadingMessage.textContent = "Error verifying session. Redirecting to login...";
         setTimeout(() => window.location.href = '/login.html', 2000);
    }
}

export function initAuth() {
    dom.logoutButton.addEventListener('click', async () => {
        if(dom.galleryStatus) dom.galleryStatus.textContent = 'Logging out...';
        if(dom.blogStatus) dom.blogStatus.textContent = 'Logging out...';
        if(dom.membersStatus) dom.membersStatus.textContent = 'Logging out...';
        if(dom.inviteUserStatus) dom.inviteUserStatus.textContent = 'Logging out...';
        dom.logoutButton.disabled = true;
        try {
            const { error } = await _supabase.auth.signOut();
            if (error) throw error;
            window.location.href = '/login.html';
        } catch(error) {
            console.error("Logout error:", error);
            alert("Logout failed: " + error.message);
            if(dom.galleryStatus) dom.galleryStatus.textContent = '';
            if(dom.blogStatus) dom.blogStatus.textContent = '';
            if(dom.membersStatus) dom.membersStatus.textContent = '';
            if(dom.inviteUserStatus) dom.inviteUserStatus.textContent = '';
            dom.logoutButton.disabled = false;
        }
    });
}