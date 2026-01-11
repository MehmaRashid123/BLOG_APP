import { supabase } from './config.js';

const params = new URLSearchParams(window.location.search);
const blogId = params.get('id');

async function init() {
    loadBlogContent();
    loadComments();
    loadLikes();
    updateMyAvatar();
}

// 1. Load Blog Content
async function loadBlogContent() {
    const { data: blog } = await supabase.from('blogs').select('*, profiles(*)').eq('id', blogId).single();
    if (!blog) return;

    document.getElementById('story-render').innerHTML = `
        <span class="badge mb-4 inline-block">${blog.category}</span>
        <h1 class="text-5xl font-black mb-8 tracking-tighter leading-tight">${blog.title}</h1>
        <div class="flex items-center gap-3 mb-10">
            <img src="${blog.profiles?.avatar_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full object-cover">
            <div>
                <p class="text-sm font-bold text-gray-900">${blog.profiles?.full_name || 'Anonymous'}</p>
                <p class="text-[10px] text-gray-400 uppercase font-bold tracking-widest">${new Date(blog.created_at).toDateString()}</p>
            </div>
        </div>
        <img src="${blog.image_url}" class="w-full h-[450px] object-cover rounded-[40px] mb-12 shadow-xl">
        <div class="text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">${blog.content}</div>
    `;
}

// 2. Load Comments with Author Name and Image
async function loadComments() {
    const { data: comments, error } = await supabase
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            profiles (
                full_name,
                avatar_url
            )
        `)
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    document.getElementById('comment-count').innerText = comments.length;
    
    const list = document.getElementById('comment-list');
    if (comments.length === 0) {
        list.innerHTML = `<p class="text-gray-400 italic text-center py-10">No comments yet. Start the discussion!</p>`;
        return;
    }

    list.innerHTML = comments.map(c => `
        <div class="flex gap-4 group">
            <img src="${c.profiles?.avatar_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm">
            <div class="flex-1 bg-gray-50 p-5 rounded-3xl group-hover:bg-gray-100 transition">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-sm font-black text-gray-900">${c.profiles?.full_name || 'Reader'}</h4>
                    <span class="text-[10px] text-gray-400 font-bold">${new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p class="text-gray-600 text-sm leading-relaxed">${c.content}</p>
            </div>
        </div>
    `).join('');
}

// 3. Handle Comment Submission
document.getElementById('comment-form').onsubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please Login to comment!");

    const input = document.getElementById('comment-input');
    const content = input.value.trim();

    if (!content) return;

    const { error } = await supabase.from('comments').insert([{
        user_id: user.id,
        blog_id: parseInt(blogId),
        content: content
    }]);

    if (error) {
        alert("Error posting comment: " + error.message);
    } else {
        input.value = '';
        loadComments(); // Refresh list
    }
};

// 4. Update Current User Avatar in Form
async function updateMyAvatar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        if (profile?.avatar_url) document.getElementById('my-avatar').src = profile.avatar_url;
    }
}

// Helper: Load Likes (Simple)
async function loadLikes() {
    const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('blog_id', blogId);
    document.getElementById('like-count').innerText = count || 0;
}

init();