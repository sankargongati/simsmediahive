import { _supabase } from './supabaseClient.js'; 
import { currentUserRole } from './auth.js'; // <-- NEW: Import the logged-in user's role

/**
 * Creates the HTML for the role dropdown select element.
 */
function createRoleSelect(userId, currentRole, isDisabled = false, loggedInUserRole) {
    let roles;
    
    // Filter the list of roles based on the logged-in user's permissions
    if (loggedInUserRole === 'owner') {
        roles = ['member', 'editor', 'admin', 'super_admin', 'owner'];
    } else if (loggedInUserRole === 'super_admin') {
        // Super admins cannot see or assign the 'owner' role
        roles = ['member', 'editor', 'admin', 'super_admin'];
    } else if (loggedInUserRole === 'admin') {
        // Admins can only see or assign 'member' and 'editor'
        roles = ['member', 'editor'];
    } else {
        // Default for any other role (like 'editor')
        roles = [currentRole]; 
    }

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
 * (This function is updated to include delete permissions)
 */
function createProfileRow(profile, currentAuthUserId, loggedInUserRole) {
    const isCurrentUser = (profile.id === currentAuthUserId);
    const targetRole = profile.role; // The role of the user in this row

    // === NEW HIERARCHICAL PERMISSION LOGIC ===
    let canDelete = false;
    let canModify = false; // For Save, Edit Name
    let canChangeRole = false; // For Role Select

    if (loggedInUserRole === 'owner') {
        // Owner can modify everyone
        canModify = true;
        // Owner can change everyone's role
        canChangeRole = true;
        // Owner can delete everyone *except* another owner
        canDelete = (targetRole !== 'owner');

    } else if (loggedInUserRole === 'super_admin') {
        // Super Admin can modify (name) anyone *except* owners
        canModify = (targetRole !== 'owner');
        // Super Admin can change role of anyone *except* owners AND other super_admins
        canChangeRole = (targetRole !== 'owner' && targetRole !== 'super_admin');
        // Super Admin can delete anyone *except* owners AND other super_admins
        canDelete = (targetRole !== 'owner' && targetRole !== 'super_admin');

    } else if (loggedInUserRole === 'admin') {
        // Admin can modify/delete members and editors
        canModify = (targetRole === 'member' || targetRole === 'editor');
        canChangeRole = (targetRole === 'member' || targetRole === 'editor');
        canDelete = (targetRole === 'member' || targetRole === 'editor');
    }

    // Final check: You can't delete or modify yourself.
    if (isCurrentUser) {
        canDelete = false;
        canModify = false; 
        canChangeRole = false;
    }

    const deleteButtonDisabled = !canDelete ? 'disabled' : '';
    const modifyButtonDisabled = !canModify ? 'disabled' : ''; // For Save & Edit Name
    const roleSelectDisabled = !canChangeRole; // Disable select if can't change role
    // === END NEW LOGIC ===


    const roleSelectHtml = createRoleSelect(profile.id, profile.role, roleSelectDisabled, loggedInUserRole);
    const buttonDisabled = isCurrentUser ? 'disabled' : ''; // This is now redundant but safe
    
    // Handle cases where full_name might be null or empty
    const displayName = profile.full_name || 'N/A';
    const email = profile.email || 'No Email';

    // SVG for the trash icon
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
                    <button class="edit-name-btn flex-shrink-0 text-gray-400 hover:text-yellow-500" title="Edit name" ${modifyButtonDisabled}>
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

            <!-- === UPDATED ACTIONS BLOCK === -->
            <div class="col-span-12 md:col-span-2">
                <label class="md:hidden text-xs font-bold oswald text-gray-400">ACTIONS</label>
                <div class="flex items-center justify-start md:justify-end gap-2">
                    <button 
                        class="update-profile-btn py-2 px-4 font-semibold text-black bg-yellow-500 rounded-md hover:bg-yellow-600 transition disabled:opacity-50 ${modifyButtonDisabled ? 'cursor-not-allowed' : ''}" 
                        ${modifyButtonDisabled}>
                        Save
                    </button>
                    <!-- === DELETE BUTTON WITH NEW PERMISSIONS === -->
                    <button
                        class="delete-user-btn py-2 px-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50 ${deleteButtonDisabled ? 'cursor-not-allowed' : ''}"
                        data-user-id="${profile.id}"
                        data-user-email="${email}"
                        title="Delete User"
                        ${deleteButtonDisabled}>
                        ${trashIconSvg}
                    </button>
                </div>
            </div>
            <!-- === END OF UPDATED BLOCK === -->
        </div>
    `;
}

/**
 * Fetches all user profiles from the database and renders them in the list.
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
        
        // We already have currentUserRole from auth.js, which ran on page load.
        if (!currentUserRole) {
            throw new Error("Could not determine current user's role. Check auth.js");
        }
        
        // === NEW DEBUGGING LOGS ===
        console.log('--- DEBUG: loadUserProfiles ---');
        console.log('DEBUG: Current user role is:', currentUserRole);
        // === END DEBUGGING LOGS ===

        // === NEW DYNAMIC QUERY ===
        // 1. Start building the query
        let query = _supabase
            .from('profiles')
            .select('id, full_name, email, role');

        // 2. Add filters based on the logged-in user's role
        if (currentUserRole === 'admin') {
            // Admin sees everyone EXCEPT owners and super_admins
            query = query.neq('role', 'owner');
            query = query.neq('role', 'super_admin');
            
        } else if (currentUserRole === 'editor') {
            // Editor should not see this tab, but as a safeguard, show no one.
            query = query.eq('role', 'non_existent_role'); // Returns 0 profiles
        }
        // Note: If role is 'owner' or 'super_admin', no filter is added, so they see everyone.

        // 3. Add the ordering
        query = query.order('full_name', { ascending: true, nullsFirst: false });
        
        // 4. Execute the query
        const { data: profiles, error: fetchError } = await query;
        // === END OF DYNAMIC QUERY ===

        if (fetchError) throw fetchError;

        if (profiles.length === 0) {
            // This is what you are seeing, but it's *after* the query.
            // Your error happens *during* the query.
            container.innerHTML = '<p class="text-gray-400 text-center col-span-full py-8">No user profiles found.</p>';
            return;
        }

        container.innerHTML = profiles
            .map(profile => createProfileRow(profile, currentAuthUserId, currentUserRole)) // <-- UPDATED: Pass the role
            .join('');

    } catch (error) {
        // THIS is where your error is being caught.
        console.error('Error loading user profiles:', error.message);
        container.innerHTML = `<p class="text-red-500 text-center col-span-full py-8">Error: ${error.message}</p>`;
    }
}

/**
 * Toggles a user's name field between text and input.
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
 * Handles the click event to update a user's role AND name.
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
    
    // === NEW: Client-side role update check ===
    // Fetch the user's current role from the DB to prevent client-side manipulation
    const { data: originalProfile, error: fetchErr } = await _supabase.from('profiles').select('role').eq('id', userId).single();
    if (fetchErr) {
        statusEl.textContent = `Error: Could not verify original role. Aborting.`;
        statusEl.className = 'text-center text-sm text-red-500';
        return;
    }
    const originalRole = originalProfile.role;

    // Check if a role change is happening
    const isRoleChanging = (newRole !== originalRole);

    if (currentUserRole === 'super_admin') {
        // Super admin cannot promote to 'owner'
        if (newRole === 'owner') {
            statusEl.textContent = `Error: Only an 'owner' can assign the role of 'owner'.`; 
            statusEl.className = 'text-center text-sm text-red-500';
            roleSelect.value = originalRole; // Revert dropdown
            return;
        }
        // NEW: Super admin cannot change another super admin's role
        if (originalRole === 'super_admin' && isRoleChanging) {
            statusEl.textContent = `Error: A 'super_admin' cannot change another 'super_admin's' role.`;
            statusEl.className = 'text-center text-sm text-red-500';
            roleSelect.value = originalRole; // Revert dropdown
            return;
        }

    } else if (currentUserRole === 'admin') {
        // Admin cannot promote to 'admin', 'super_admin', or 'owner'
        if (newRole === 'admin' || newRole === 'super_admin' || newRole === 'owner') {
            statusEl.textContent = `Error: Only 'super_admin' or 'owner' can assign the role of '${newRole}'.`; 
            statusEl.className = 'text-center text-sm text-red-500';
            roleSelect.value = originalRole; // Revert dropdown
            return;
        }
    }
    // If currentUserRole is 'owner', no checks are needed. They can do anything.
    // === END OF NEW CHECK ===
    
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
 * Handles the click event to delete a user.
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
            body: { 
                user_id: userId,
                user_email: userEmail // <-- Pass email for notifications
            }
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
        // The error from the Edge Function will be more descriptive
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
 * Sets up the event listener for the profile management section.
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
        const deleteBtn = event.target.closest('.delete-user-btn');

        if (saveBtn) {
            handleProfileUpdate(saveBtn); // Pass the button element
        } else if (editNameBtn) {
            handleNameEditToggle(editNameBtn); // Pass the button element
        } else if (deleteBtn) { 
            handleProfileDelete(deleteBtn); // Pass the button element
        }
    });
}

