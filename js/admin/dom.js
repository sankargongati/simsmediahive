// --- DOM ELEMENTS ---
// Declare all variables as 'let' so they can be assigned later
export let logoutButton;
export let galleryTabBtn;
export let blogTabBtn;
export let membersTabBtn;
export let inviteUserTabBtn;
export let galleryContent;
export let blogContent;
export let membersContent;
export let inviteUserContent;
export let loadingMessage;
export let adminContentWrapper;

// Gallery
export let galleryForm;
export let galleryList;
export let galleryStatus;
export let galleryMediaInput;
export let galleryTitleInput;
export let galleryFilterButtonsContainer;

// Blog
export let blogForm;
export let blogPostList;
export let blogStatus;
export let clearBlogFormBtn;
export let blogPostIdInput;
export let blogTitleInput;
export let blogAuthorInput;
export let blogHeaderMediaInput;
export let easymdeFileInput;
export let blogContentEditor;

// Members
export let membersForm;
export let memberList;
export let membersStatus;
export let clearMembersFormBtn;
export let memberIdInput;
export let memberNameInput;
export let memberRoleInput;
export let memberDescriptionInput;
export let memberImageInput;

// Invite User
export let inviteUserForm;
export let inviteUserStatus;
export let inviteEmailInput;
export let inviteRoleInput;

/**
 * NEW FUNCTION
 * This function will be called *after* the DOM is loaded.
 * It finds all the elements and assigns them to the exported variables.
 */
export function initDom() {
    logoutButton = document.getElementById('logout-button');
    galleryTabBtn = document.getElementById('gallery-tab-btn');
    blogTabBtn = document.getElementById('blog-tab-btn');
    membersTabBtn = document.getElementById('members-tab-btn');
    inviteUserTabBtn = document.getElementById('invite-user-tab-btn');
    galleryContent = document.getElementById('gallery-content');
    blogContent = document.getElementById('blog-content');
    membersContent = document.getElementById('members-content');
    inviteUserContent = document.getElementById('invite-user-content');
    loadingMessage = document.getElementById('loading-message');
    adminContentWrapper = document.getElementById('admin-content-wrapper');

    galleryForm = document.getElementById('gallery-upload-form');
    galleryList = document.getElementById('gallery-list');
    galleryStatus = document.getElementById('gallery-status');
    galleryMediaInput = document.getElementById('gallery-media-file');
    galleryTitleInput = document.getElementById('gallery-title');
    galleryFilterButtonsContainer = document.getElementById('gallery-filter-buttons');

    blogForm = document.getElementById('blog-form');
    blogPostList = document.getElementById('blog-post-list');
    blogStatus = document.getElementById('blog-status');
    clearBlogFormBtn = document.getElementById('clear-blog-form-btn');
    blogPostIdInput = document.getElementById('blog-post-id');
    blogTitleInput = document.getElementById('blog-title');
    blogAuthorInput = document.getElementById('blog-author');
    blogHeaderMediaInput = document.getElementById('blog-header-media-file');
    easymdeFileInput = document.getElementById('easymde-file-input');
    blogContentEditor = document.getElementById('blog-content-editor');

    membersForm = document.getElementById('members-form');
    memberList = document.getElementById('member-list');
    membersStatus = document.getElementById('members-status');
    clearMembersFormBtn = document.getElementById('clear-members-form-btn');
    memberIdInput = document.getElementById('member-id');
    memberNameInput = document.getElementById('member-name');
    memberRoleInput = document.getElementById('member-role');
    memberDescriptionInput = document.getElementById('member-description');
    memberImageInput = document.getElementById('member-image-file');

    inviteUserForm = document.getElementById('invite-user-form');
    inviteUserStatus = document.getElementById('invite-user-status');
    inviteEmailInput = document.getElementById('invite-email');
    inviteRoleInput = document.getElementById('invite-role');
}

