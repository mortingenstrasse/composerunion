// ComposerUnion.com - Blog Functionality

// Fetch and display blog posts
async function loadBlogPosts(category = 'all') {
    let query = supabaseClient
        .from('blog_posts')
        .select('*, profiles(full_name)')
        .eq('published', true)
        .order('created_at', { ascending: false });
    
    if (category !== 'all') {
        query = query.eq('category', category);
    }
    
    const { data: posts, error } = await query;
    
    if (error) {
        console.error('Error loading posts:', error);
        return;
    }
    
    const container = document.getElementById('posts-container') || document.getElementById('featured-posts');
    if (!container) return;
    
    container.innerHTML = '';
    
    posts.forEach((post, index) => {
        const postCard = document.createElement('div');
        postCard.className = 'notion-post-card';
        postCard.innerHTML = `
            <a href="post.html?slug=${post.slug}" class="notion-post-link">
                ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="notion-post-image">` : ''}
                <div class="notion-post-content">
                    <span class="notion-post-category">${post.category}</span>
                    <h3 class="notion-post-title">${post.title}</h3>
                    <p class="notion-post-description">${post.content_html.substring(0, 150).replace(/<[^>]*>/g, '')}...</p>
                    <div class="notion-post-author">
                        <div class="author-info">
                            <span class="notion-author-name">Admin</span>
                        </div>
                    </div>
                </div>
            </a>
        `;
        container.appendChild(postCard);
        
        // Insert ad after every 3rd post
        if ((index + 1) % 3 === 0 && document.getElementById('posts-container')) {
            const adDiv = document.createElement('div');
            adDiv.className = 'ad-container';
            adDiv.innerHTML = `
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-format="fluid"
                     data-ad-layout-key="-6t+ed+2i-1n-4w"
                     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                     data-ad-slot="1234567890"></ins>
                <script>
                     (adsbygoogle = window.adsbygoogle || []).push({});
                </script>
            `;
            container.appendChild(adDiv);
        }
    });
}

// Category filtering
const categoryFilter = document.getElementById('category-filter');
if (categoryFilter) {
    categoryFilter.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const category = e.target.dataset.category;
            loadBlogPosts(category);
        }
    });
}

// Load single post
async function loadSinglePost() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) return;
    
    const { data: post, error } = await supabaseClient
        .from('blog_posts')
        .select('*, profiles(full_name)')
        .eq('slug', slug)
        .single();
    
    if (error) {
        console.error('Error loading post:', error);
        return;
    }
    
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-description').content = post.content_html.substring(0, 160).replace(/<[^>]*>/g, '');
    document.getElementById('article-title').textContent = post.title;
    document.getElementById('post-author').textContent = 'Admin';
    document.getElementById('post-date').textContent = new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); // Notion-style date
    document.getElementById('post-category').textContent = post.category;
    
    if (post.image_url) {
        document.getElementById('post-image').src = post.image_url;
    }
    
    document.getElementById('article-content').innerHTML = post.content_html;
    
    // Load related posts
    loadRelatedPosts(post.category, post.id);
}

// Load related posts
async function loadRelatedPosts(category, currentPostId) {
    const { data: posts, error } = await supabaseClient
        .from('blog_posts')
        .select('title, slug')
        .eq('category', category)
        .eq('published', true)
        .neq('id', currentPostId)
        .limit(5);
    
    if (error) return;
    
    const container = document.getElementById('related-posts');
    if (!container) return;
    
    container.innerHTML = posts.map(post => 
        `<a href="post.html?slug=${post.slug}">${post.title}</a>`
    ).join('<br>');
}

// Initialize based on current page
// Initialize based on current page
if (window.location.pathname.includes('blog.html') || window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    loadBlogPosts();
} else if (window.location.pathname.includes('post.html')) {
    loadSinglePost();
}
