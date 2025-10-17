// ComposerUnion.com - Admin Dashboard Logic

// Role-based access control
async function checkAdminAccess() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        window.location.href = 'signup.html';
        return false;
    }
    
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (!profile || profile.role !== 'admin') {
        window.showCustomAlert('Access denied. Admin privileges required.', 'error');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Tab switching
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and sections
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding section
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-section`).classList.add('active');
    });
});

// Load writers for author dropdown
async function loadWriters() {
    const { data: writers } = await supabaseClient
        .from('profiles')
        .select('id, full_name')
        .in('role', ['writer', 'admin']);
    
    const authorSelect = document.getElementById('post-author');
    if (authorSelect && writers) {
        authorSelect.innerHTML = writers.map(writer => 
            `<option value="${writer.id}">${writer.full_name}</option>`
        ).join('');
    }
}

// Auto-generate slug from title
const postTitleInput = document.getElementById('post-title');
if (postTitleInput) {
    postTitleInput.addEventListener('input', (e) => {
        const slug = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        document.getElementById('post-slug').value = slug;
    });
}

// Image preview for featured image
const postImageInput = document.getElementById('post-image');
const imagePreview = document.getElementById('image-preview');
if (postImageInput) {
    postImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.style.display = 'none';
        }
    });
}

// Initialize Quill editor
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'image'],
            [{ 'align': [] }],
            ['clean']
        ]
    }
});

// Custom image handler for Quill
quill.getModule('toolbar').addHandler('image', () => {
    selectLocalImage();
});

function selectLocalImage() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
        const file = input.files[0];
        if (file) {
            const imageUrl = await uploadImage(file);
            if (imageUrl) {
                const range = quill.getSelection();
                quill.insertEmbed(range.index, 'image', imageUrl);
            } else {
                window.showCustomAlert('Failed to upload image for post content.', 'error');
            }
        }
    };
}

// Upload image to Supabase Storage
async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { data, error } = await supabaseClient.storage
        .from('blog-images')
        .upload(filePath, file);
    
    if (error) {
        console.error('Upload error:', error);
        // Display a user-friendly error message
        window.showCustomAlert('Image upload failed: ' + error.message + '. Please check your Supabase Storage RLS policies.', 'error');
        return null;
    }
    
    const { data: { publicUrl } } = supabaseClient.storage
        .from('blog-images')
        .getPublicUrl(filePath);
    
    return publicUrl;
}

// Save blog post
const postForm = document.getElementById('post-form');
if (postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const postId = document.getElementById('post-id').value;
        const title = document.getElementById('post-title').value;
        const slug = document.getElementById('post-slug').value;
        const category = document.getElementById('post-category').value;
        const contentHtml = quill.root.innerHTML; // Get HTML content from Quill
        document.getElementById('post-content').value = contentHtml; // Set to hidden input
        const authorId = document.getElementById('post-author').value;
        const published = document.getElementById('post-published').checked;
        
        let featuredImageUrl = null;
        const featuredImageFile = document.getElementById('post-image').files[0];
        
        if (featuredImageFile) {
            featuredImageUrl = await uploadImage(featuredImageFile);
            if (!featuredImageUrl) {
                window.showCustomAlert('Failed to upload featured image. Please check Supabase RLS policies.', 'error');
                return; // Stop submission if featured image upload fails
            }
        }
        
        const postData = {
            title,
            slug,
            category,
            content_html: contentHtml,
            author_id: authorId,
            published
        };
        
        if (featuredImageUrl) {
            postData.image_url = featuredImageUrl;
        }
        
        let error;
        
        if (postId) {
            // Update existing post
            ({ error } = await supabaseClient
                .from('blog_posts')
                .update({ ...postData, updated_at: new Date() })
                .eq('id', postId));
        } else {
            // Check for existing slug before creating new post
            const { count, error: checkError } = await supabaseClient
                .from('blog_posts')
                .select('id', { count: 'exact' })
                .eq('slug', slug)
                .limit(1)
                .single(); // Use single to ensure we get a single result or null

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
                console.error('Error checking for existing slug:', checkError.message);
                window.showCustomAlert('Error checking for duplicate slug.', 'error');
                return;
            }
            
            if (count > 0) {
                window.showCustomAlert('A post with this slug already exists. Please choose a different title or slug.', 'error');
                return;
            }

            // Create new post
            ({ error } = await supabaseClient
                .from('blog_posts')
                .insert(postData));
        }
        
        if (error) {
            window.showCustomAlert('Error saving post: ' + error.message, 'error');
            return;
        }
        
        window.showCustomAlert('Post saved successfully!', 'success');
        document.getElementById('clear-form').click();
        loadPosts();
    });
}

// Clear form
const clearFormBtn = document.getElementById('clear-form');
if (clearFormBtn) {
    clearFormBtn.addEventListener('click', () => {
        document.getElementById('post-form').reset();
        document.getElementById('post-id').value = '';
        imagePreview.style.display = 'none'; // Hide featured image preview
        quill.setContents([]); // Clear Quill editor content
    });
}

// Load all posts
async function loadPosts() {
    const { data: posts } = await supabaseClient
        .from('blog_posts')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
    
    const tbody = document.querySelector('#posts-table tbody');
    if (tbody && posts) {
        tbody.innerHTML = posts.map(post => `
            <tr>
                <td>${post.title}</td>
                <td>${post.category}</td>
                <td>${post.profiles?.full_name || 'Unknown'}</td>
                <td>${post.published ? 'Yes' : 'No'}</td>
                <td class="action-buttons">
                    <button class="btn btn-primary" onclick="editPost('${post.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deletePost('${post.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

// Edit post
async function editPost(postId) {
    const { data: post } = await supabaseClient
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();
    
    if (post) {
        document.getElementById('post-id').value = post.id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-slug').value = post.slug;
        document.getElementById('post-category').value = post.category;
        quill.root.innerHTML = post.content_html; // Load HTML content into Quill
        document.getElementById('post-author').value = post.author_id;
        document.getElementById('post-published').checked = post.published;
        
        if (post.image_url) {
            imagePreview.src = post.image_url;
            imagePreview.style.display = 'block';
        } else {
            imagePreview.style.display = 'none';
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Delete post
async function deletePost(postId) {
    // Using custom modal for confirmation
    showModal('Confirm Deletion', `
        <p>Are you sure you want to delete this post?</p>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
            <button class="btn btn-danger" id="confirm-delete-btn">Delete</button>
        </div>
    `);

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        hideModal(); // Hide modal immediately after confirmation
        const { error } = await supabaseClient
            .from('blog_posts')
            .delete()
            .eq('id', postId);
        
        if (error) {
            window.showCustomAlert('Error deleting post: ' + error.message, 'error');
            return;
        }
        
        window.showCustomAlert('Post deleted successfully!', 'success');
        loadPosts();
    });
}

// Load writer applications
async function loadApplications() {
    // First, get all applications
    const { data: applications, error } = await supabaseClient
        .from('writer_applications')
        .select('*, profiles(full_name)')
        .order('submitted_at', { ascending: false });

    if (error) {
        console.error('Error loading writer applications:', error.message);
        return;
    }
    
    // Then, get user emails separately from auth.users
    const tbody = document.querySelector('#applications-table tbody');
    if (tbody && applications) {
        // For each application, we need to get the user's email
        const applicationsWithEmails = await Promise.all(
            applications.map(async (app) => {
                // Get email from profiles table if it exists, otherwise from auth
                const { data: profile } = await supabaseClient
                    .from('profiles')
                    .select('id')
                    .eq('id', app.user_id)
                    .single();
                
                // Since we can't directly access auth.users email from client,
                // we'll use the user_id to fetch it if the user is currently logged in
                // For now, we'll just show the profile name
                return {
                    ...app,
                    email: 'N/A' // Email not directly accessible from client-side
                };
            })
        );
        
        tbody.innerHTML = applicationsWithEmails.map(app => `
            <tr>
                <td>${app.profiles?.full_name || 'Unknown'}</td>
                <td>${app.bio_text.substring(0, 100)}...</td>
                <td>${app.status}</td>
                <td>${new Date(app.submitted_at).toLocaleDateString()}</td>
                <td class="action-buttons">
                    ${app.status === 'pending' ? `
                        <button class="btn btn-success" onclick="approveApplication('${app.id}', '${app.user_id}')">Approve</button>
                        <button class="btn btn-danger" onclick="rejectApplication('${app.id}')">Reject</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }
}

// Approve writer application
async function approveApplication(appId, userId) {
    // Update application status
    await supabaseClient
        .from('writer_applications')
        .update({ status: 'approved' })
        .eq('id', appId);
    
    // Update user role to writer
    const { error } = await supabaseClient
        .from('profiles')
        .update({ role: 'writer' })
            .eq('id', userId);
    
    if (error) {
        window.showCustomAlert('Error approving application: ' + error.message, 'error');
        return;
    }
    
    window.showCustomAlert('Application approved! User is now a writer.', 'success');
    loadApplications();
}

// Reject writer application
async function rejectApplication(appId) {
    const { error } = await supabaseClient
        .from('writer_applications')
        .update({ status: 'rejected' })
        .eq('id', appId);
    
    if (error) {
        window.showCustomAlert('Error rejecting application: ' + error.message, 'error');
        return;
    }
    
    window.showCustomAlert('Application rejected.', 'info');
    loadApplications();
}

// Load users
async function loadUsers() {
    // Get all profiles
    const { data: users, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading users:', error.message);
        return;
    }
    
    const tbody = document.querySelector('#users-table tbody');
    if (tbody && users) {
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.full_name || 'N/A'}</td>
                <td>Email not accessible from client</td>
                <td>${user.role}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }
}

// Export users to CSV
const exportUsersBtn = document.getElementById('export-users');
if (exportUsersBtn) {
    exportUsersBtn.addEventListener('click', async () => {
        const { data: users } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (users) {
            const csv = [
                ['Name', 'Role', 'Joined'].join(','),
                ...users.map(user => [
                    user.full_name || 'N/A',
                    user.role,
                    new Date(user.created_at).toLocaleDateString()
                ].join(','))
            ].join('\n');
            
            downloadCSV(csv, 'users.csv');
        }
    });
}

// Load newsletter subscribers
async function loadSubscribers() {
    const { data: subscribers } = await supabaseClient
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });
    
    const tbody = document.querySelector('#subscribers-table tbody');
    if (tbody && subscribers) {
        tbody.innerHTML = subscribers.map(sub => `
            <tr>
                <td>${sub.email}</td>
                <td>${new Date(sub.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }
}

// Export subscribers to CSV
const exportSubscribersBtn = document.getElementById('export-subscribers');
if (exportSubscribersBtn) {
    exportSubscribersBtn.addEventListener('click', async () => {
        const { data: subscribers } = await supabaseClient
            .from('newsletter_subscribers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (subscribers) {
            const csv = [
                ['Email', 'Subscribed'].join(','),
                ...subscribers.map(sub => [
                    sub.email,
                    new Date(sub.created_at).toLocaleDateString()
                ].join(','))
            ].join('\n');
            
            downloadCSV(csv, 'newsletter_subscribers.csv');
        }
    });
}

// Helper function to download CSV
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Initialize admin dashboard
async function initAdmin() {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;
    
    await loadWriters();
    await loadPosts();
    await loadApplications();
    await loadUsers();
    await loadSubscribers();
}

// Make functions globally accessible
window.editPost = editPost;
window.deletePost = deletePost;
window.approveApplication = approveApplication;
window.rejectApplication = rejectApplication;

// Initialize on page load
initAdmin();
