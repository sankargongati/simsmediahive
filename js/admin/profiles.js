import { _supabase } from './supabaseClient.js'; 

/**
 * Creates the HTML for the role dropdown select element.
 */
function createRoleSelect(userId, currentRole, isDisabled = false) {
    const roles = ['member', 'editor', 'admin', 'super_admin'];
    const disabledAttr = isDisabled ? 'disabled' : '';

    let options = roles.map(role => {
        const selected = (role === currentRole) ? 'selected' : '';
        // Capitalize first letter and replace underscore for display
        const displayName = role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ');
        return `<option value="${role}" ${selected}>${displayName}</option>`;
    }).join('');

    return `
        <select data-user-id="${userId}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}" ${disabledAttr}>
            ${options}
        </select>
    `;
}

/**
 * Creates the HTML for a single user profile row.
 * (This function is updated to include a delete button)
 */
function createProfileRow(profile, currentAuthUserId) {
    const isCurrentUser = (profile.id === currentAuthUserId);
    const roleSelectHtml = createRoleSelect(profile.id, profile.role, isCurrentUser);
    const buttonDisabled = isCurrentUser ? 'disabled' : '';
    
    // Handle cases where full_name might be null or empty
    const displayName = profile.full_name || 'N/A';
    const email = profile.email || 'No Email';

    // SVG for the trash icon, matching your pencil icon style
    const trashIconSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
        </svg>
    `;

    return `
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-800 p-4 rounded-lg shadow" data-user-id="${profile.id}">
            <div class="col-span-12 md:col-span-4">
                <label class="md:hidden text-xs font-bold oswald text-gray-400">NAME</label>
                <div class="flex items-center gap-2" data-name-wrapper>
                    <p class="text-white font-semibold truncate profile-name-display" title="${displayName}">${displayName}</p>
                    <input type="text" class="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-md focus:ring-yellow-500 focus:border-yellow-500 profile-name-input hidden" value="${displayName}">
                    <button class="edit-name-btn flex-shrink-0 text-gray-400 hover:text-yellow-500" title="Edit name" ${buttonDisabled}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                </div>
            </div>
            
            <div class="col-span-12 md:col-span-4">
                <label class="md:hidden text-xs font-bold oswald text-gray-400">EMAIL</label>
                <p class="text-gray-300 truncate" title="${email}">${email}</p>
            </div>
            
            <div class="col-span-12 md:col-span-2">
                <label class="md:hidden text-xs font-bold oswald text-gray-400">ROLE</label>
                ${roleSelectHtml}
            </div>

            <div class="col-span-12 md:col-span-2">
                <label class="md:hidden text-xs font-bold oswald text-gray-400">ACTIONS</label>
                <div class="flex items-center justify-start md:justify-end gap-2">
                    <button 
                        class="update-profile-btn py-2 px-4 font-semibold text-black bg-yellow-500 rounded-md hover:bg-yellow-600 transition disabled:opacity-50 ${isCurrentUser ? 'cursor-not-allowed' : ''}" 
                        ${buttonDisabled}>
                        Save
                    </button>
                    <button
                        class="delete-user-btn py-2 px-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50 ${isCurrentUser ? 'cursor-not-allowed' : ''}"
                        data-user-id="${profile.id}"
                        data-user-email="${email}"
                        title="Delete User"
                        ${buttonDisabled}>
                        ${trashIconSvg}
                    </button>
                </div>
            </div>
            </div>
    `;
}

/**
 * Fetches all user profiles from the database and renders them in the list.
 * (This function is unchanged, but verified to fetch 'full_name')
 */
export async function loadUserProfiles() {
    const container = document.getElementById('user-profile-list');
    const statusEl = document.getElementById('profile-update-status');
    if (!container || !statusEl) return;
    
    if (!_supabase) { 
        console.error("Supabase client not loaded. Cannot load profiles.");
        return;
    }

    container.innerHTML = '<p class="text-gray-400 text-center col-span-full py-8">Loading user profiles...</p>';
    statusEl.textContent = '';

    try {
        const { data: { user }, error: authError } = await _supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error("User not authenticated.");
        const currentAuthUserId = user.id;

        // Fetching id, full_name, email, and role
        const { data: profiles, error: fetchError } = await _supabase
            .from('profiles')
            .select('id, full_name, email, role') 
            .order('full_name', { ascending: true, nullsFirst: false });

        if (fetchError) throw fetchError;

        if (profiles.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center col-span-full py-8">No user profiles found.</p>';
            return;
        }

        container.innerHTML = profiles
            .map(profile => createProfileRow(profile, currentAuthUserId))
            .join('');

    } catch (error) {
        console.error('Error loading user profiles:', error.message);
        container.innerHTML = `<p class="text-red-500 text-center col-span-full py-8">Error: ${error.message}</p>`;
    }
}

/**
 * NEW: Toggles a user's name field between text and input.
 */
function handleNameEditToggle(button) {
    const wrapper = button.closest('[data-name-wrapper]');
    if (!wrapper) return;

    const display = wrapper.querySelector('.profile-name-display');
    const input = wrapper.querySelector('.profile-name-input');

    if (display && input) {
        display.classList.toggle('hidden');
        input.classList.toggle('hidden');
        if (!input.classList.contains('hidden')) {
            input.focus();
            input.select();
        }
    }
}


/**
 * UPDATED: Handles the click event to update a user's role AND name.
 * (Replaces the old 'handleRoleUpdate' function)
 */
async function handleProfileUpdate(button) {
    if (!_supabase) { 
        console.error("Supabase client not loaded. Cannot update profile.");
        return;
    }

    const userRow = button.closest('.grid[data-user-id]');
    if (!userRow) return;

    const userId = userRow.dataset.userId;
    const nameInput = userRow.querySelector('.profile-name-input');
    const nameDisplay = userRow.querySelector('.profile-name-display');
    const roleSelect = userRow.querySelector('select[data-user-id]');

    if (!userId || !nameInput || !roleSelect || !nameDisplay) {
        console.error("Could not find all required elements for update.");
        return;
    }

    const newName = nameInput.value;
    const newRole = roleSelect.value;
    const statusEl = document.getElementById('profile-update-status');
    
    const updateData = {
        full_name: newName,
        role: newRole
    };

    button.disabled = true;
    button.textContent = 'Saving...';
    statusEl.textContent = `Processing update for ${newName || 'user'}...`; 
    statusEl.className = 'text-center text-sm text-yellow-500';

    try {
        const { error } = await _supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId);
        
        if (error) throw error;

        statusEl.textContent = `Successfully updated profile for ${newName}.`; 
        statusEl.className = 'text-center text-sm text-green-500';

        // Update display text and toggle back to display mode
        nameDisplay.textContent = newName;
        nameDisplay.title = newName;
        if (!nameInput.classList.contains('hidden')) {
            // Name was in edit mode, toggle it back
            nameInput.classList.add('hidden');
            nameDisplay.classList.remove('hidden');
        }

    } catch (error) { 
        console.error('Error updating profile:', error.message);
        statusEl.textContent = `Error: ${error.message}`;
    } finally {
        button.disabled = false;
        button.textContent = 'Save';
        setTimeout(() => {
            if (statusEl.textContent.startsWith('Successfully')) {
                statusEl.textContent = '';
            }
        }, 4000);
    }
}

/**
 * NEW: Handles the click event to delete a user.
 */
async function handleProfileDelete(button) {
    if (!_supabase) { 
        console.error("Supabase client not loaded. Cannot delete profile.");
        return;
    }

    const userRow = button.closest('.grid[data-user-id]');
    if (!userRow) return;

    const userId = button.dataset.userId;
    const userEmail = button.dataset.userEmail;
    const statusEl = document.getElementById('profile-update-status');

    // 1. Show a confirmation dialog
    if (!confirm(`Are you sure you want to permanently delete the user: ${userEmail}?\n\nThis action cannot be undone.`)) {
        return; // Stop if the admin clicks "Cancel"
    }

    // 2. Give visual feedback
    button.disabled = true;
    statusEl.textContent = `Deleting user ${userEmail}...`;
    statusEl.className = 'text-center text-sm text-yellow-500';

    try {
        // 3. Call the Edge Function
        const { data, error } = await _supabase.functions.invoke('delete-user', {
            body: { user_id: userId }
        });

        if (error) throw error;

        // 4. Handle success
        statusEl.textContent = data.message || `Successfully deleted ${userEmail}.`;
        statusEl.className = 'text-center text-sm text-green-500';
        
        // Remove the user's row from the page
        userRow.remove();

    } catch (error) {
        // 5. Handle failure
        console.error('Error deleting user:', error);
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.className = 'text-center text-sm text-red-500';
        button.disabled = false;
    } finally {
        // 6. Clear status message after a delay
        setTimeout(() => {
            if (statusEl.textContent.startsWith('Successfully') || statusEl.textContent.startsWith('Error:')) {
                statusEl.textContent = '';
            }
        }, 4000);
    }
}


/**
 * UPDATED: Sets up the event listener for the profile management section.
 */
export function setupProfileEventListeners() {
    const container = document.getElementById('user-profile-list');
    if (!container) {
        console.warn('Profile list container not found. Skipping event listeners.');
        return;
    }

    // Use event delegation for all button types
    container.addEventListener('click', (event) => {
        const saveBtn = event.target.closest('.update-profile-btn');
        const editNameBtn = event.target.closest('.edit-name-btn');
        const deleteBtn = event.target.closest('.delete-user-btn'); // <-- ADDED THIS

        if (saveBtn) {
            handleProfileUpdate(saveBtn); // Pass the button element
        } else if (editNameBtn) {
            handleNameEditToggle(editNameBtn); // Pass the button element
        } else if (deleteBtn) { // <-- ADDED THIS
            handleProfileDelete(deleteBtn); // Pass the button element
        }
    });
}
