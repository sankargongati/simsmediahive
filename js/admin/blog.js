import { _supabase } from './supabaseClient.js';
import * as dom from './dom.js';
import * as config from './config.js';
import { currentUserRole } from './auth.js';

let easymde = null; // To hold the EasyMDE instance

// --- Update AI Section Visibility ---
async function updateAiSectionVisibility() {
    console.log("Updating AI section visibility");
    console.log("currentUserRole:", currentUserRole);
    console.log("aiWriteSection element:", dom.aiWriteSection);

    if (!dom.aiWriteSection) {
        console.log("AI write section element not found");
        return;
    }

    // Show AI section for owners or users with ai_access
    if (currentUserRole === 'owner') {
        console.log("User is owner, showing AI section");
        dom.aiWriteSection.style.display = 'block';
    } else {
        console.log("User is not owner, checking ai_access");
        // Check ai_access for non-owners
        const { data: { user }, error: authError } = await _supabase.auth.getUser();
        if (authError || !user) {
            console.log("Auth error or no user:", authError);
            dom.aiWriteSection.style.display = 'none';
        } else {
            console.log("Got user:", user.id);
            const { data: profile, error: profileError } = await _supabase
                .from('profiles')
                .select('ai_access')
                .eq('id', user.id)
                .single();
            if (profileError) {
                console.log("Profile fetch error:", profileError);
                dom.aiWriteSection.style.display = 'none';
            } else if (profile?.ai_access) {
                console.log("User has ai_access, showing AI section");
                dom.aiWriteSection.style.display = 'block';
            } else {
                console.log("User does not have ai_access, hiding AI section");
                dom.aiWriteSection.style.display = 'none';
            }
        }
    }
}

// --- Initialize EasyMDE ---
export async function initializeEasyMDE() {
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

    // Always update AI section visibility when initializing/activating blog editor
    await updateAiSectionVisibility();
}

async function handleBlogDelete(postId, postMediaUrl) {
    if (!confirm(`Are you sure you want to delete blog post ID ${postId} permanently?`)) return; dom.blogStatus.textContent = `Deleting post ${postId}...`; dom.blogStatus.style.color = 'white'; const deleteButtonInList = dom.blogPostList.querySelector(`.delete-post-btn[data-id="${postId}"]`); if(deleteButtonInList) deleteButtonInList.disabled = true;
    try { if (postMediaUrl) { try { const url = new URL(postMediaUrl); const pathParts = url.pathname.split('/'); const bucketIndex = pathParts.indexOf(config.BLOG_BUCKET); if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) { const filePath = decodeURIComponent(pathParts.slice(bucketIndex + 1).join('/')); console.log("Attempting to delete header media:", filePath); const { error: storageError } = await _supabase.storage.from(config.BLOG_BUCKET).remove([filePath]); if (storageError && storageError.message !== 'The resource was not found') console.warn("Could not delete header media:", storageError.message); else if (!storageError) console.log("Header media deleted successfully."); } } catch (mediaError) { console.warn("Could not process or delete header media URL:", postMediaUrl, mediaError); } } else { console.log("No header media URL found for post, skipping storage delete."); } const { error: dbError } = await _supabase.from('blogPosts').delete().eq('id', postId); if (dbError) throw dbError; dom.blogStatus.textContent = 'Post deleted successfully!'; dom.blogStatus.style.color = '#22c55e'; await loadBlogPosts(); if(dom.blogPostIdInput.value === postId.toString()) clearBlogForm(); }
    catch (error) { console.error('Delete failed:', error); dom.blogStatus.textContent = `Deletion failed: ${error.message}`; dom.blogStatus.style.color = 'red'; if(deleteButtonInList) deleteButtonInList.disabled = false; }
    finally { setTimeout(() => { if(dom.blogStatus) dom.blogStatus.textContent = ''; }, 4000); }
}

async function populateBlogFormForEdit(postId) {
    dom.blogStatus.textContent = "Loading post data for editing..."; dom.blogStatus.style.color = 'white'; clearBlogForm();
    try { const { data: post, error } = await _supabase.from('blogPosts').select('*').eq('id', postId).single(); if (error || !post) throw error || new Error("Post not found"); dom.blogPostIdInput.value = post.id; dom.blogTitleInput.value = post.title || ''; dom.blogAuthorInput.value = post.author || ''; await initializeEasyMDE(); if (easymde) easymde.value(post.content || ''); else { dom.blogContentEditor.value = post.content || ''; console.warn("Populating textarea because EasyMDE instance is not available."); } dom.blogHeaderMediaInput.value = ''; dom.blogStatus.textContent = "Editing post. Upload new header media only if you want to replace the current one."; dom.blogStatus.style.color = 'white'; window.scrollTo({ top: dom.blogForm.offsetTop - 100, behavior: 'smooth' }); }
    catch (error) { console.error("Failed to load post for editing:", error); dom.blogStatus.textContent = "Could not load post data for editing."; dom.blogStatus.style.color = 'red'; }
}

function clearBlogForm() { dom.blogForm.reset(); dom.blogPostIdInput.value = ''; if (easymde) easymde.value(''); else if (dom.blogContentEditor) dom.blogContentEditor.value = ''; dom.blogStatus.textContent = ''; dom.blogHeaderMediaInput.value = ''; if (dom.aiPromptTextarea) dom.aiPromptTextarea.value = ''; console.log("Blog form cleared."); }

export async function loadBlogPosts() {
    dom.blogPostList.innerHTML = '<p class="text-gray-400 text-center">Loading posts...</p>';
    try { const { data, error } = await _supabase.from('blogPosts').select('id, title, author, imageUrl').order('created_at', { ascending: false }); if (error) throw error; dom.blogPostList.innerHTML = ''; if (!data || data.length === 0) { dom.blogPostList.innerHTML = '<p class="text-gray-400 text-center">No blog posts yet.</p>'; } else { data.forEach(post => { const postEl = document.createElement('div'); postEl.className = 'flex items-center justify-between bg-gray-800 p-4 rounded-md shadow'; const thumbnailSrc = getBlogPostThumbnail(post.imageUrl); postEl.innerHTML = `<div class="flex items-center space-x-3"><img src="${thumbnailSrc}" alt="Post thumbnail" class="w-12 h-12 object-cover rounded" onerror="this.src='${config.defaultPlaceholder}'"><div><p class="font-bold text-white">${post.title || 'Untitled Post'}</p><p class="text-sm text-gray-400">By ${post.author || 'Unknown Author'}</p></div></div><div class="flex space-x-2 flex-shrink-0"><button class="edit-post-btn p-2 bg-blue-600 hover:bg-blue-700 rounded-md text-xs font-semibold text-white transition">EDIT</button><button class="delete-post-btn p-2 bg-red-600 hover:bg-red-700 rounded-md text-xs font-semibold text-white transition">DELETE</button></div>`; postEl.querySelector('.edit-post-btn').addEventListener('click', () => populateBlogFormForEdit(post.id)); postEl.querySelector('.delete-post-btn').addEventListener('click', () => handleBlogDelete(post.id, post.imageUrl)); dom.blogPostList.appendChild(postEl); }); } }
    catch (error) { console.error('Error loading posts:', error); dom.blogPostList.innerHTML = `<p class="text-red-500 text-center">Error loading posts: ${error.message}</p>`; }
}

// Helper function to get blog post thumbnail
function getBlogPostThumbnail(imageUrl) {
    if (!imageUrl) return config.defaultPlaceholder;

    // Check if it's a YouTube URL
    if (imageUrl.includes('youtube.com') || imageUrl.includes('youtu.be')) {
        const videoId = extractYouTubeVideoId(imageUrl);
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
    }

    return imageUrl;
}

// Helper function to extract YouTube video ID from URL
function extractYouTubeVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

async function handleAiGenerate() {
    // Check if user has permission (owner or users with ai_access)
    if (currentUserRole !== 'owner') {
        // Check if user has ai_access permission
        const { data: { user }, error: authError } = await _supabase.auth.getUser();
        if (authError || !user) {
            dom.blogStatus.textContent = 'Authentication error.';
            dom.blogStatus.style.color = 'red';
            setTimeout(() => { dom.blogStatus.textContent = ''; }, 3000);
            return;
        }

        const { data: profile, error: profileError } = await _supabase
            .from('profiles')
            .select('ai_access')
            .eq('id', user.id)
            .single();

        if (profileError || !profile?.ai_access) {
            dom.blogStatus.textContent = 'AI Write Assistant is only available to authorized users.';
            dom.blogStatus.style.color = 'red';
            setTimeout(() => { dom.blogStatus.textContent = ''; }, 3000);
            return;
        }
    }

    const prompt = dom.aiPromptTextarea.value.trim();
    if (!prompt) {
        dom.blogStatus.textContent = 'Please enter a prompt for AI generation.';
        dom.blogStatus.style.color = 'red';
        setTimeout(() => { dom.blogStatus.textContent = ''; }, 3000);
        return;
    }

    dom.generateAiContentBtn.disabled = true;
    if (dom.generateIcon) dom.generateIcon.classList.add('hidden');
    if (dom.generateText) dom.generateText.textContent = 'Generating...';
    if (dom.generatingSpinner) dom.generatingSpinner.classList.remove('hidden');
    dom.blogStatus.textContent = 'Generating content with AI...';
    dom.blogStatus.style.color = 'white';

    try {
        // Real AI generation using DeepSeek API with streaming
        const response = await fetch(config.DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: `Write a complete, comprehensive blog article based on this topic: "${prompt}".

Requirements:
- Write a FULL article with introduction, body sections, and conclusion
- Include a compelling headline at the top
- Use proper Markdown formatting with headers (H2, H3), paragraphs, and bullet points where appropriate
- Make it 800-1200 words long with detailed, valuable content
- Include practical examples, tips, and actionable advice
- Ensure the content is original, well-structured, and engaging
- Do not include any meta-comments or explanations - only the article content itself

Topic: ${prompt}`
                    }
                ],
                max_tokens: 3000,
                temperature: 0.7,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let generatedContent = '';
        let buffer = '';

        // Get current content
        const currentContent = easymde ? easymde.value() : dom.blogContentEditor.value;
        const prefix = currentContent ? currentContent + '\n\n' : '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices[0]?.delta?.content;
                        if (delta) {
                            generatedContent += delta;
                            // Update editor in real-time
                            const fullContent = prefix + generatedContent;
                            if (easymde) {
                                easymde.value(fullContent);
                            } else {
                                dom.blogContentEditor.value = fullContent;
                            }
                            // Small delay for smooth animation
                            await new Promise(resolve => setTimeout(resolve, 10));
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

        dom.blogStatus.textContent = 'Content generated and added to editor!';
        dom.blogStatus.style.color = 'green';
    } catch (error) {
        console.error('AI generation failed:', error);
        dom.blogStatus.textContent = 'AI generation failed. Please try again.';
        dom.blogStatus.style.color = 'red';
    } finally {
        dom.generateAiContentBtn.disabled = false;
        if (dom.generateIcon) dom.generateIcon.classList.remove('hidden');
        if (dom.generateText) dom.generateText.textContent = 'Generate Content with AI';
        if (dom.generatingSpinner) dom.generatingSpinner.classList.add('hidden');
        setTimeout(() => { dom.blogStatus.textContent = ''; }, 4000);
    }
}

// Function to refresh AI suggestions with new trending topics
function refreshAiSuggestions() {
    const suggestions = [
        {
            prompt: "Write about the impact of AI voice cloning technology on podcast production and storytelling",
            label: "AI voice cloning in podcasts"
        },
        {
            prompt: "How to create immersive 360-degree video content for virtual reality platforms",
            label: "360° video for VR"
        },
        {
            prompt: "The psychology of color in video thumbnails and its effect on click-through rates",
            label: "Color psychology in thumbnails"
        },
        {
            prompt: "Building sustainable content creation habits to avoid creator burnout",
            label: "Avoiding creator burnout"
        },
        {
            prompt: "Using blockchain technology for content ownership and monetization",
            label: "Blockchain for content creators"
        },
        {
            prompt: "The rise of interactive live streams with real-time audience participation",
            label: "Interactive live streaming"
        }
    ];

    if (dom.suggestionsContainer) {
        dom.suggestionsContainer.innerHTML = '';
        suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'ai-suggestion-btn bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition';
            button.setAttribute('data-prompt', suggestion.prompt);
            button.textContent = suggestion.label;
            dom.suggestionsContainer.appendChild(button);
        });
    }
}

export function initBlogListeners() {
    // AI Write Assistant
    if (dom.generateAiContentBtn) {
        dom.generateAiContentBtn.addEventListener('click', handleAiGenerate);
    }

    dom.easymdeFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0]; if (!file) return; if (!easymde) { console.error("Editor not initialized for upload."); return; } easymde.codemirror.setOption('readOnly', true); const originalStatus = dom.blogStatus.textContent; dom.blogStatus.textContent = `Uploading ${file.name}...`; dom.blogStatus.style.color = 'white'; const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); const filePath = `content_${Date.now()}_${cleanFileName}`;
        try { dom.blogStatus.textContent = `Uploading ${file.type}...`; const { error: uploadError } = await _supabase.storage.from(config.BLOG_BUCKET).upload(filePath, file); if (uploadError) throw uploadError; const { data: urlData } = _supabase.storage.from(config.BLOG_BUCKET).getPublicUrl(filePath); const publicURL = urlData.publicUrl; if(!publicURL) throw new Error("Could not get public URL for uploaded media."); const cm = easymde.codemirror; const doc = cm.getDoc(); const cursor = doc.getCursor(); let markdownSyntax = ''; if (file.type.startsWith('image/')) { markdownSyntax = `\n![${file.name || 'image alt text'}](${publicURL})\n`; } else if (file.type.startsWith('video/')) { markdownSyntax = `\n<video controls width="100%" src="${publicURL}">Your browser does not support the video tag.</video>\n`; } else { markdownSyntax = `\n[${file.name}](${publicURL})\n`; } doc.replaceRange(markdownSyntax, cursor); dom.blogStatus.textContent = 'Media inserted into content!'; dom.blogStatus.style.color = 'green'; }
        catch (error) { console.error("EasyMDE Upload failed:", error); dom.blogStatus.textContent = `Media upload failed: ${error.message}`; dom.blogStatus.style.color = 'red'; }
        finally { dom.easymdeFileInput.value = ''; easymde.codemirror.setOption('readOnly', false); setTimeout(() => { if (dom.blogStatus && (dom.blogStatus.textContent.includes('inserted') || dom.blogStatus.textContent.includes('failed'))) { dom.blogStatus.textContent = originalStatus || ''; } }, 3000); }
    });

    dom.blogForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const submitBtn = dom.blogForm.querySelector('button[type="submit"]'); submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; dom.blogStatus.textContent = 'Processing...'; dom.blogStatus.style.color='white'; const postId = dom.blogPostIdInput.value; const title = dom.blogTitleInput.value; const author = dom.blogAuthorInput.value; const content = easymde ? easymde.value() : dom.blogContentEditor.value; const headerFile = dom.blogHeaderMediaInput.files[0]; let headerMediaUrl = null; let newlyUploadedPath = null;
        try { if (headerFile || dom.blogYoutubeUrl.value.trim()) {
            const youtubeUrl = dom.blogYoutubeUrl.value.trim();
            if (youtubeUrl) {
                // Basic YouTube URL validation
                const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}/;
                if (!youtubeRegex.test(youtubeUrl)) {
                    throw new Error("Please enter a valid YouTube URL.");
                }
                headerMediaUrl = youtubeUrl;
                dom.blogStatus.textContent = 'Processing YouTube URL...';
            } else if (headerFile) {
                dom.blogStatus.textContent = `Uploading header ${headerFile.type.split('/')[0]}...`; const cleanFileName = headerFile.name.replace(/[^a-zA-Z0-9._-]/g, '_'); const filePath = `${Date.now()}_header_${cleanFileName}`; newlyUploadedPath = filePath; const { error: uploadError } = await _supabase.storage.from(config.BLOG_BUCKET).upload(filePath, headerFile); if (uploadError) throw uploadError; headerMediaUrl = _supabase.storage.from(config.BLOG_BUCKET).getPublicUrl(filePath).data.publicUrl; if (!headerMediaUrl) throw new Error("Could not get header media URL after upload.");
            }
        } let postData = { title, author, content }; if (headerMediaUrl) postData.imageUrl = headerMediaUrl; if (postId) { dom.blogStatus.textContent = 'Updating database record...'; const { error } = await _supabase.from('blogPosts').update(postData).eq('id', postId); if (error) throw error; dom.blogStatus.textContent = 'Post updated successfully!'; } else { dom.blogStatus.textContent = 'Creating database record...'; if (!headerMediaUrl && !postId) throw new Error("Header media (image, video, or YouTube URL) is required for creating new posts."); if(headerMediaUrl) postData.imageUrl = headerMediaUrl; const { error } = await _supabase.from('blogPosts').insert([postData]); if (error) throw error; dom.blogStatus.textContent = 'Post created successfully!'; } dom.blogStatus.style.color = 'green'; clearBlogForm(); await loadBlogPosts(); }
        catch (error) { console.error("Blog save failed:", error); dom.blogStatus.textContent = `Error: ${error.message}`; dom.blogStatus.style.color = 'red'; if (newlyUploadedPath && error.message !== "Header media (image or video) is required for creating new posts.") { console.log("Attempting cleanup of failed upload:", newlyUploadedPath); try { await _supabase.storage.from(config.BLOG_BUCKET).remove([newlyUploadedPath]); } catch(cleanupErr){ console.warn("Cleanup failed:", cleanupErr); } } }
        finally { submitBtn.disabled = false; submitBtn.textContent = 'Save Post'; setTimeout(() => { if(dom.blogStatus) dom.blogStatus.textContent = ''; }, 4000); }
    });

    dom.clearBlogFormBtn.addEventListener('click', clearBlogForm);

    // AI Write Assistant
    if (dom.generateAiContentBtn) {
        dom.generateAiContentBtn.addEventListener('click', handleAiGenerate);
    }

    // AI suggestion buttons
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('ai-suggestion-btn')) {
            const prompt = event.target.getAttribute('data-prompt');
            if (dom.aiPromptTextarea) {
                dom.aiPromptTextarea.value = prompt;
            }
        }
    });

    // Refresh suggestions button
    if (dom.refreshSuggestionsBtn) {
        dom.refreshSuggestionsBtn.addEventListener('click', () => {
            refreshAiSuggestions();
        });
    }
}