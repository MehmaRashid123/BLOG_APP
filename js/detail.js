import { supabase } from './config.js';
import { updateNavbar } from './navbar.js';
import { showToast } from './toast.js';

const params = new URLSearchParams(window.location.search);
const blogId = params.get('id');

async function init() {
    if (!blogId) return window.location.href = 'index.html';
    
    updateNavbar(); // Navbar update karein
    await loadBlogContent();
    await loadComments();
    await loadLikes();
    await updateMyAvatar();
    await checkLikeStatus(); // Check karein ke user ne pehle like kiya hai ya nahi
}

// 1. Load Blog Content
async function loadBlogContent() {
    const { data: blog, error } = await supabase
        .from('blogs')
        .select('*, profiles:user_id(*)')
        .eq('id', blogId)
        .single();
    
    if (error || !blog) return;

    document.getElementById('story-render').innerHTML = `
        <span class="badge mb-4 inline-block">${blog.category}</span>
        <h1 class="text-5xl font-black mb-8 tracking-tighter leading-tight text-gray-900">${blog.title}</h1>
        <div class="flex items-center gap-3 mb-10 border-b pb-8">
            <img src="${blog.profiles?.avatar_url || 'https://via.placeholder.com/40'}" class="w-12 h-12 rounded-full object-cover border">
            <div>
                <p class="text-sm font-black text-gray-900 uppercase tracking-widest">${blog.profiles?.full_name || 'Anonymous'}</p>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">${new Date(blog.created_at).toDateString()}</p>
            </div>
        </div>
        <img src="${blog.image_url}" class="w-full h-auto max-h-[600px] object-cover rounded-[40px] mb-12 shadow-2xl">
        <div class="text-xl text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
            ${blog.content}
        </div>
    `;
}

// 2. Load Comments
async function loadComments() {
    const { data: comments, error } = await supabase
        .from('comments')
        .select('id, content, created_at, profiles:user_id(full_name, avatar_url)')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    const countLabel = document.getElementById('comment-count');
    if(countLabel) countLabel.innerText = comments.length;
    
    const list = document.getElementById('comment-list');
    if (comments.length === 0) {
        list.innerHTML = `<p class="text-gray-400 italic text-center py-10 bg-gray-50 rounded-3xl">No comments yet. Start the discussion!</p>`;
        return;
    }

    list.innerHTML = comments.map(c => `
        <div class="flex gap-4 group items-start">
            <img src="${c.profiles?.avatar_url || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm">
            <div class="flex-1 bg-gray-50 p-6 rounded-[28px] group-hover:bg-gray-100 transition">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-xs font-black text-gray-900 uppercase tracking-widest">${c.profiles?.full_name || 'Reader'}</h4>
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
    if (!user) return showToast("Please Login to comment!", "warning");

    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    if (!content) return;

    const { error } = await supabase.from('comments').insert([{
        user_id: user.id,
        blog_id: parseInt(blogId),
        content: content
    }]);

    if (error) showToast("Error: " + error.message, "error");
    else {
        input.value = '';
        await loadComments();
        showToast("Comment posted!", "success");
    }
};

// 4. Like/Unlike Toggle Logic
document.getElementById('like-btn').onclick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showToast("Please Login to like!", "warning");

    const bId = parseInt(blogId);

    // Pehle check karein ke kya like pehle se hai
    const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .match({ user_id: user.id, blog_id: bId })
        .single();

    if (existingLike) {
        // Unlike karein
        await supabase.from('likes').delete().match({ user_id: user.id, blog_id: bId });
        document.getElementById('heart-icon').innerText = '♡';
        document.getElementById('heart-icon').classList.remove('text-rose-500');
    } else {
        // Like karein
        await supabase.from('likes').insert([{ user_id: user.id, blog_id: bId }]);
        document.getElementById('heart-icon').innerText = '♥';
        document.getElementById('heart-icon').classList.add('text-rose-500');
        showToast("Liked!", "success");
    }
    loadLikes();
};

async function checkLikeStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
        .from('likes')
        .select('*')
        .match({ user_id: user.id, blog_id: parseInt(blogId) })
        .single();

    if (data) {
        document.getElementById('heart-icon').innerText = '♥';
        document.getElementById('heart-icon').classList.add('text-rose-500');
    }
}

async function loadLikes() {
    const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('blog_id', blogId);
    document.getElementById('like-count').innerText = count || 0;
}

async function updateMyAvatar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        const myAv = document.getElementById('my-avatar');
        if (myAv && profile?.avatar_url) myAv.src = profile.avatar_url;
    }
}

init();