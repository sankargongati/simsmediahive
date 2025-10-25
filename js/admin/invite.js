import { _supabase } from './supabaseClient.js';
import * as dom from './dom.js';
import * as config from './config.js';

// --- INVITE USER LOGIC ---
export function initInviteFormListener() {
    if (!dom.inviteUserForm) return; // Exit if form isn't on the page

    dom.inviteUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailToInvite = dom.inviteEmailInput.value;
        const roleToAssign = dom.inviteRoleInput.value; // <-- GET THE ROLE
        const submitBtn = dom.inviteUserForm.querySelector('button[type="submit"]');

        if (!emailToInvite || !roleToAssign) { // <-- CHECK FOR ROLE
            dom.inviteUserStatus.textContent = "Please enter an email address and select a role.";
            dom.inviteUserStatus.style.color = "red";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        dom.inviteUserStatus.textContent = `Sending invite to ${emailToInvite}...`;
        dom.inviteUserStatus.style.color = 'white';
        
        try {
            const { data: { session }, error: sessionError } = await _supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error("Could not get current session. Please log in again.");
            }
            const token = session.access_token;
            
            // --- FIX IS HERE ---
            // Send both email and role in the request body
            const response = await fetch(config.INVITE_USER_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: emailToInvite, role: roleToAssign }) // <-- SEND BOTH
            });
            // --- END OF FIX ---

            const result = await response.json();
            
            if (!response.ok) {
                // Use the error message from the function, or a default
                throw new Error(result.error || `Server error: ${response.status}`);
            }

            dom.inviteUserStatus.textContent = result.message || 'Invitation sent successfully!';
            dom.inviteUserStatus.style.color = 'green';
            dom.inviteUserForm.reset();

        } catch (error) {
            console.error("Invite User failed:", error);
            dom.inviteUserStatus.textContent = `Error: ${error.message}`;
            dom.inviteUserStatus.style.color = 'red';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Invitation';
            setTimeout(() => { if(dom.inviteUserStatus) dom.inviteUserStatus.textContent = ''; }, 5000);
        }
    });
}