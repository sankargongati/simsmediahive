import { _supabase } from './supabaseClient.js';
import * as dom from './dom.js';
import * as config from './config.js';

let easymde = null; // To hold the EasyMDE instance

// --- Initialize EasyMDE ---
export function initializeEasyMDE() {
    if (!easymde && dom.blogContentEditor) {
        try {
            easymde = new EasyMDE({
                element: dom.blogContentEditor,
                spellChecker: false,
                placeholder: "Write content using Markdown... Use the paperclip icon to upload images/videos.",
                toolbar: [
                    "bold", "italic", "heading", "|",
                    "quote", "unordered-list", "ordered-list", "|",
                    "link",
                    { name: "upload-media", action: (editor) => dom.easymdeFileInput.click(), className: "fa fa-paperclip", title: "Upload Image/Video" },
                    "image", "|",
                    "preview", "side-by-side", "fullscreen", "|",
                    "guide"
                ]
            });
            console.log("EasyMDE initialized.");
        } catch (error) {
            console.error("Failed to initialize EasyMDE:", error);
            if(dom.blogStatus) { 
                dom.blogStatus.textContent = "Error initializing text editor.";
                dom.blogStatus.style.color = 'red';
            }
        }
    }
}

async function handleBlogDelete(postId, postMediaUrl) {
    if (!confirm(`Are you sure you want to delete blog post ID ${postId} permanently?`)) return; dom.blogStatus.textContent = `Deleting post ${postId}...`; dom.blogStatus.style.color = 'white'; const deleteButtonInList = dom.blogPostList.querySelector(`.delete-post-btn[data-id="${postId}"]`); if(deleteButtonInList) deleteButtonInList.disabled = true;
    try { if (postMediaUrl) { try { const url = new URL(postMediaUrl); const pathParts = url.pathname.split('/'); const bucketIndex = pathParts.indexOf(config.BLOG_BUCKET); if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) { const filePath = decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/')); console.log("Attempting to delete header media:", filePath); const { error: storageError } = await _supabase.storage.from(config.BLOG_BUCKET).remove([filePath]); if (storageError && storageError.message !== 'The resource was not found') console.warn("Could not delete header media:", storageError.message); else if (!storageError) console.log("Header media deleted successfully."); } } catch (mediaError) { console.warn("Could not process or delete header media URL:", postMediaUrl, mediaError); } } else { console.log("No header media URL found for post, skipping storage delete."); } const { error: dbError } = await _supabase.from('blogPosts').delete().eq('id', postId); if (dbError) throw dbError; dom.blogStatus.textContent = 'Post deleted successfully!'; dom.blogStatus.style.color = '#22c55e'; await loadBlogPosts(); if(dom.blogPostIdInput.value === postId.toString()) clearBlogForm(); }
    catch (error) { console.error('Delete failed:', error); dom.blogStatus.textContent = `Deletion failed: ${error.message}`; dom.blogStatus.style.color = 'red'; if(deleteButtonInList) deleteButtonInList.disabled = false; }
    finally { setTimeout(() => { if(dom.blogStatus) dom.blogStatus.textContent = ''; }, 4000); }
}

async function populateBlogFormForEdit(postId) {
    dom.blogStatus.textContent = "Loading post data for editing..."; dom.blogStatus.style.color = 'white'; clearBlogForm();
    try { const { data: post, error } = await _supabase.from('blogPosts').select('*').eq('id', postId).single(); if (error || !post) throw error || new Error("Post not found"); dom.blogPostIdInput.value = post.id; dom.blogTitleInput.value = post.title || ''; dom.blogAuthorInput.value = post.author || ''; initializeEasyMDE(); if (easymde) easymde.value(post.content || ''); else { dom.blogContentEditor.value = post.content || ''; console.warn("Populating textarea because EasyMDE instance is not available."); } dom.blogHeaderMediaInput.value = ''; dom.blogStatus.textContent = "Editing post. Upload new header media only if you want to replace the current one."; dom.blogStatus.style.color = 'white'; window.scrollTo({ top: dom.blogForm.offsetTop - 100, behavior: 'smooth' }); }
    catch (error) { console.error("Failed to load post for editing:", error); dom.blogStatus.textContent = "Could not load post data for editing."; dom.blogStatus.style.color = 'red'; }
}

function clearBlogForm() { dom.blogForm.reset(); dom.blogPostIdInput.value = ''; if (easymde) easymde.value(''); else if (dom.blogContentEditor) dom.blogContentEditor.value = ''; dom.blogStatus.textContent = ''; dom.blogHeaderMediaInput.value = ''; console.log("Blog form cleared."); }

export async function loadBlogPosts() {
    dom.blogPostList.innerHTML = '<p class="text-gray-400 text-center">Loading posts...</p>';
    try { const { data, error } = await _supabase.from('blogPosts').select('id, title, author, imageUrl').order('created_at', { ascending: false }); if (error) throw error; dom.blogPostList.innerHTML = ''; if (!data || data.length === 0) { dom.blogPostList.innerHTML = '<p class="text-gray-400 text-center">No blog posts yet.</p>'; } else { data.forEach(post => { const postEl = document.createElement('div'); postEl.className = 'flex items-center justify-between bg-gray-800 p-4 rounded-md shadow'; postEl.innerHTML = `<div><p class="font-bold text-white">${post.title || 'Untitled Post'}</p><p class="text-sm text-gray-400">By ${post.author || 'Unknown Author'}</p></div><div class="flex space-x-2 flex-shrink-0"><button class="edit-post-btn p-2 bg-blue-600 hover:bg-blue-700 rounded-md text-xs font-semibold text-white transition">EDIT</button><button class="delete-post-btn p-2 bg-red-600 hover:bg-red-700 rounded-md text-xs font-semibold text-white transition">DELETE</button></div>`; postEl.querySelector('.edit-post-btn').addEventListener('click', () => populateBlogFormForEdit(post.id)); postEl.querySelector('.delete-post-btn').addEventListener('click', () => handleBlogDelete(post.id, post.imageUrl)); dom.blogPostList.appendChild(postEl); }); } }
    catch (error) { console.error('Error loading posts:', error); dom.blogPostList.innerHTML = `<p class="text-red-500 text-center">Error loading posts: ${error.message}</p>`; }
}

export function initBlogListeners() {
    dom.easymdeFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return; if (!easymde) { console.error("Editor not initialized for upload."); return; } easymde.codemirror.setOption('readOnly', true); const originalStatus = dom.blogStatus.textContent; dom.blogStatus.textContent = `Uploading ${file.name}...`; dom.blogStatus.style.color = 'white'; const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); const filePath = `content_${Date.now()}_${cleanFileName}`;
        try { dom.blogStatus.textContent = `Uploading ${file.type}...`; const { error: uploadError } = await _supabase.storage.from(config.BLOG_BUCKET).upload(filePath, file); if (uploadError) throw uploadError; const { data: urlData } = _supabase.storage.from(config.BLOG_BUCKET).getPublicUrl(filePath); const publicURL = urlData.publicUrl; if(!publicURL) throw new Error("Could not get public URL for uploaded media."); const cm = easymde.codemirror; const doc = cm.getDoc(); const cursor = doc.getCursor(); let markdownSyntax = ''; if (file.type.startsWith('image/')) { markdownSyntax = `\n![${file.name || 'image alt text'}](${publicURL})\n`; } else if (file.type.startsWith('video/')) { markdownSyntax = `\n<video controls width="100%" src="${publicURL}">Your browser does not support the video tag.</video>\n`; } else { markdownSyntax = `\n[${file.name}](${publicURL})\n`; } doc.replaceRange(markdownSyntax, cursor); dom.blogStatus.textContent = 'Media inserted into content!'; dom.blogStatus.style.color = 'green'; }
        catch (error) { console.error("EasyMDE Upload failed:", error); dom.blogStatus.textContent = `Media upload failed: ${error.message}`; dom.blogStatus.style.color = 'red'; }
        finally { dom.easymdeFileInput.value = ''; easymde.codemirror.setOption('readOnly', false); setTimeout(() => { if (dom.blogStatus && (dom.blogStatus.textContent.includes('inserted') || dom.blogStatus.textContent.includes('failed'))) { dom.blogStatus.textContent = originalStatus || ''; } }, 3000); }
    });

    dom.blogForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const submitBtn = dom.blogForm.querySelector('button[type="submit"]'); submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; dom.blogStatus.textContent = 'Processing...'; dom.blogStatus.style.color='white'; const postId = dom.blogPostIdInput.value; const title = dom.blogTitleInput.value; const author = dom.blogAuthorInput.value; const content = easymde ? easymde.value() : dom.blogContentEditor.value; const headerFile = dom.blogHeaderMediaInput.files[0]; let headerMediaUrl = null; let newlyUploadedPath = null;
        try { if (headerFile) { dom.blogStatus.textContent = `Uploading header ${headerFile.type.split('/')[0]}...`; const cleanFileName = headerFile.name.replace(/[^a-zA-Z0-9._-]/g, '_'); const filePath = `${Date.now()}_header_${cleanFileName}`; newlyUploadedPath = filePath; const { error: uploadError } = await _supabase.storage.from(config.BLOG_BUCKET).upload(filePath, headerFile); if (uploadError) throw uploadError; headerMediaUrl = _supabase.storage.from(config.BLOG_BUCKET).getPublicUrl(filePath).data.publicUrl; if (!headerMediaUrl) throw new Error("Could not get header media URL after upload."); } let postData = { title, author, content }; if (headerMediaUrl) postData.imageUrl = headerMediaUrl; if (postId) { dom.blogStatus.textContent = 'Updating database record...'; const { error } = await _supabase.from('blogPosts').update(postData).eq('id', postId); if (error) throw error; dom.blogStatus.textContent = 'Post updated successfully!'; } else { dom.blogStatus.textContent = 'Creating database record...'; if (!headerMediaUrl && !postId) throw new Error("Header media (image or video) is required for creating new posts."); if(headerMediaUrl) postData.imageUrl = headerMediaUrl; const { error } = await _supabase.from('blogPosts').insert([postData]); if (error) throw error; dom.blogStatus.textContent = 'Post created successfully!'; } dom.blogStatus.style.color = 'green'; clearBlogForm(); await loadBlogPosts(); }
        catch (error) { console.error("Blog save failed:", error); dom.blogStatus.textContent = `Error: ${error.message}`; dom.blogStatus.style.color = 'red'; if (newlyUploadedPath && error.message !== "Header media (image or video) is required for creating new posts.") { console.log("Attempting cleanup of failed upload:", newlyUploadedPath); try { await _supabase.storage.from(config.BLOG_BUCKET).remove([newlyUploadedPath]); } catch(cleanupErr){ console.warn("Cleanup failed:", cleanupErr); } } }
        finally { submitBtn.disabled = false; submitBtn.textContent = 'Save Post'; setTimeout(() => { if(dom.blogStatus) dom.blogStatus.textContent = ''; }, 4000); }
    });

    dom.clearBlogFormBtn.addEventListener('click', clearBlogForm);
}