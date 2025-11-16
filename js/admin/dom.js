// --- DOM ELEMENTS ---
// Declare all variables as 'let' so they can be assigned later
export let logoutButton;
export let galleryTabBtn;
export let blogTabBtn;
export let membersTabBtn;
export let inviteUserTabBtn;
export let profilesTabBtn; // <-- ADDED
export let galleryContent;
export let blogContent;
export let membersContent;
export let inviteUserContent;
export let profilesContent; // <-- ADDED
export let loadingMessage;
export let adminContentWrapper;

// Gallery
export let galleryForm;
export let galleryList;
export let galleryStatus;
export let galleryMediaInput;
export let galleryTitleInput;
export let galleryFilterButtonsContainer;
export let galleryYoutubeUrl;

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
export let blogYoutubeUrl;
export let youtubeModal;
export let youtubeModalClose;
export let youtubePlayerContainer;
export let aiPromptTextarea;
export let generateAiContentBtn;
export let aiWriteSection;
export let suggestionsContainer;
export let refreshSuggestionsBtn;
export let generateIcon;
export let generateText;
export let generatingSpinner;


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

// Profiles (This section is new)
export let userProfileList;
export let profileUpdateStatus;

// --- NEW MOBILE MENU ELEMENTS ---
export let burgerMenuBtn;
export let mobileMenu;
export let mobileMenuCloseBtn;
export let mobileGalleryTabBtn;
export let mobileBlogTabBtn;
export let mobileMembersTabBtn;
export let mobileInviteUserTabBtn;
export let mobileProfilesTabBtn;
export let mobileLogoutBtn;

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
    profilesTabBtn = document.getElementById('profiles-tab-btn'); // <-- ADDED
    galleryContent = document.getElementById('gallery-content');
    blogContent = document.getElementById('blog-content');
    membersContent = document.getElementById('members-content');
    inviteUserContent = document.getElementById('invite-user-content');
    profilesContent = document.getElementById('profiles-content'); // <-- ADDED
    loadingMessage = document.getElementById('loading-message');
    adminContentWrapper = document.getElementById('admin-content-wrapper');

    galleryForm = document.getElementById('gallery-upload-form');
    galleryList = document.getElementById('gallery-list');
    galleryStatus = document.getElementById('gallery-status');
    galleryMediaInput = document.getElementById('gallery-media-file');
    galleryTitleInput = document.getElementById('gallery-title');
    galleryFilterButtonsContainer = document.getElementById('gallery-filter-buttons');
    galleryYoutubeUrl = document.getElementById('gallery-youtube-url');

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
    blogYoutubeUrl = document.getElementById('blog-youtube-url');
    youtubeModal = document.getElementById('youtube-modal');
    youtubeModalClose = document.getElementById('youtube-modal-close');
    youtubePlayerContainer = document.getElementById('youtube-player-container');
    aiPromptTextarea = document.getElementById('ai-prompt');
    generateAiContentBtn = document.getElementById('generate-ai-content-btn');
    aiWriteSection = document.getElementById('ai-write-section');
    suggestionsContainer = document.getElementById('suggestions-container');
    refreshSuggestionsBtn = document.getElementById('refresh-suggestions-btn');
    generateIcon = document.getElementById('generate-icon');
    generateText = document.getElementById('generate-text');
    generatingSpinner = document.getElementById('generating-spinner');


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

    // Add these for the Profiles tab
    userProfileList = document.getElementById('user-profile-list');
    profileUpdateStatus = document.getElementById('profile-update-status');
    
    // --- NEW ASSIGNMENTS FOR MOBILE MENU ---
    burgerMenuBtn = document.getElementById('burger-menu-btn');
    mobileMenu = document.getElementById('mobile-menu');
    mobileMenuCloseBtn = document.getElementById('mobile-menu-close-btn');
    mobileGalleryTabBtn = document.getElementById('mobile-gallery-tab-btn');
    mobileBlogTabBtn = document.getElementById('mobile-blog-tab-btn');
    mobileMembersTabBtn = document.getElementById('mobile-members-tab-btn');
    mobileInviteUserTabBtn = document.getElementById('mobile-invite-user-tab-btn');
    mobileProfilesTabBtn = document.getElementById('mobile-profiles-tab-btn');
    mobileLogoutBtn = document.getElementById('mobile-logout-btn');
}
