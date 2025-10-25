// Import your Supabase client
// Adjust this path if your supabaseClient.js file is located elsewhere!
import { _supabase } from './supabaseClient.js';

// --- DOM Elements ---
const loadingMessage = document.getElementById('loading-message');
const profileContent = document.getElementById('profile-content');
const logoutButton = document.getElementById('logout-button');

// Profile Form
const profileForm = document.getElementById('profile-form');
const profileEmail = document.getElementById('profile-email');
const profileName = document.getElementById('profile-name');
const profileRole = document.getElementById('profile-role');
const profileStatus = document.getElementById('profile-status');
const profileUpdateBtn = document.getElementById('profile-update-btn');

// Password Form
const passwordForm = document.getElementById('password-form');
const profilePassword = document.getElementById('profile-password');
const profilePasswordConfirm = document.getElementById('profile-password-confirm');
const passwordStatus = document.getElementById('password-status');
const passwordUpdateBtn = document.getElementById('password-update-btn');

let currentUser = null;

/**
 * Sets a status message and clears it after a delay.
 * @param {HTMLElement} el - The status message element.
 * @param {string} message - The text to display.
 * @param {boolean} isError - If true, displays as red.
 */
function setStatus(el, message, isError = false) {
    el.textContent = message;
    el.className = isError 
        ? 'text-center text-sm text-red-500' 
        : 'text-center text-sm text-green-500';
    
    setTimeout(() => {
        el.textContent = '';
    }, 4000);
}

/**
 * Loads the currently logged-in user's profile information.
 */
async function loadUserProfile() {
    try {
        const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
            // Not logged in
            window.location.href = '/login.html';
            return;
        }
        
        currentUser = session.user;

        // Fetch profile data from the 'profiles' table
        const { data: profile, error: profileError } = await _supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', currentUser.id)
            .single();

        if (profileError) throw profileError;

        // Populate the form fields
        profileEmail.value = currentUser.email;
        profileName.value = profile.full_name || '';
        
        // Format the role for display
        const role = profile.role || 'member';
        profileRole.value = role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');

        // Show the content
        loadingMessage.style.display = 'none';
        profileContent.classList.remove('hidden');

    } catch (error) {
        console.error('Error loading profile:', error.message);
        loadingMessage.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
}

/**
 * Handles submission of the "Update Profile" form.
 */
async function handleProfileUpdate(e) {
    e.preventDefault();
    if (!currentUser) return;

    const newName = profileName.value.trim();
    profileUpdateBtn.disabled = true;
    profileUpdateBtn.textContent = 'Saving...';

    try {
        const { error } = await _supabase
            .from('profiles')
            .update({ full_name: newName })
            .eq('id', currentUser.id);

        if (error) throw error;
        
        setStatus(profileStatus, 'Your name has been updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error.message);
        setStatus(profileStatus, `Error: ${error.message}`, true);
    } finally {
        profileUpdateBtn.disabled = false;
        profileUpdateBtn.textContent = 'Save Changes';
    }
}

/**
 * Handles submission of the "Update Password" form.
 */
async function handlePasswordUpdate(e) {
    e.preventDefault();
    
    const newPassword = profilePassword.value;
    const confirmPassword = profilePasswordConfirm.value;

    // --- Client-side validation ---
    if (newPassword.length < 6) {
        setStatus(passwordStatus, 'Password must be at least 6 characters long.', true);
        return;
    }
    if (newPassword !== confirmPassword) {
        setStatus(passwordStatus, 'Passwords do not match.', true);
        return;
    }
    // --- End validation ---

    passwordUpdateBtn.disabled = true;
    passwordUpdateBtn.textContent = 'Updating...';

    try {
        const { error } = await _supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
        
        setStatus(passwordStatus, 'Password updated successfully!');
        passwordForm.reset(); // Clear the form
    } catch (error) {
        console.error('Error updating password:', error.message);
        setStatus(passwordStatus, `Error: ${error.message}`, true);
    } finally {
        passwordUpdateBtn.disabled = false;
        passwordUpdateBtn.textContent = 'Update Password';
    }
}

/**
 * Handles user logout.
 */
async function handleLogout() {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Logging out...';
    try {
        const { error } = await _supabase.auth.signOut();
        if (error) throw error;
        window.location.href = '/login.html';
    } catch (error) {
        alert(`Logout failed: ${error.message}`);
        logoutButton.disabled = false;
        logoutButton.textContent = 'Logout';
    }
}

// --- Main execution ---
document.addEventListener('DOMContentLoaded', () => {
    // Check auth and load data
    loadUserProfile();

    // Attach event listeners
    profileForm.addEventListener('submit', handleProfileUpdate);
    passwordForm.addEventListener('submit', handlePasswordUpdate);
    logoutButton.addEventListener('click', handleLogout);
});
