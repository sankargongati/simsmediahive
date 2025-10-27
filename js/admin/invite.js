import { _supabase } from './supabaseClient.js';
import * as dom from './dom.js';
import * as config from './config.js'; // Assuming you have a config file for your function URL

// --- INVITE USER LOGIC ---
export function initInviteFormListener() {
    if (!dom.inviteUserForm) {
        console.warn("Invite User form not found. Skipping listener.");
        return; 
    }

    dom.inviteUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Ensure DOM elements exist before accessing .value
        if (!dom.inviteEmailInput || !dom.inviteRoleInput || !dom.inviteUserStatus) {
            console.error("Invite form DOM elements are missing.");
            return;
        }

        const emailToInvite = dom.inviteEmailInput.value;
        const roleToAssign = dom.inviteRoleInput.value;
        const submitBtn = dom.inviteUserForm.querySelector('button[type="submit"]');

        if (!emailToInvite || !roleToAssign) {
            dom.inviteUserStatus.textContent = "Please enter an email address and select a role.";
            dom.inviteUserStatus.className = "text-center text-sm text-red-500";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        dom.inviteUserStatus.textContent = `Sending invite to ${emailToInvite}...`;
        dom.inviteUserStatus.className = "text-center text-sm text-yellow-500";
        
        try {
            // Get the current user's token to authorize the function call
            const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error("Could not get current session. Please log in again.");
            }
            const token = session.access_token;
            
            // Call your Supabase Edge Function
            const response = await fetch(config.INVITE_USER_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: emailToInvite, role: roleToAssign })
            });

            const result = await response.json();
            
            if (!response.ok) {
                // Use the error message from the function, or a default
                throw new Error(result.error || `Server error: ${response.status}`);
            }

            dom.inviteUserStatus.textContent = result.message || 'Invitation sent successfully!';
            dom.inviteUserStatus.className = "text-center text-sm text-green-500";
            dom.inviteUserForm.reset();

        } catch (error) {
            console.error("Invite User failed:", error);
            dom.inviteUserStatus.textContent = `Error: ${error.message}`;
            dom.inviteUserStatus.className = "text-center text-sm text-red-500";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Invitation';
            setTimeout(() => { 
                if(dom.inviteUserStatus && !dom.inviteUserStatus.className.includes('text-red-500')) {
                    dom.inviteUserStatus.textContent = ''; 
                }
            }, 5000);
        }
    });
}
