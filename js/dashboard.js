import { supabase } from './config.js';
import { initNavbar } from './navbar.js';

const modal = document.getElementById('post-modal');
const openBtn = document.getElementById('open-modal');
const closeBtn = document.getElementById('close-modal');
const grid = document.getElementById('my-grid');
const postForm = document.getElementById('post-form');

// --- 1. Modal Logic ---
if (openBtn) openBtn.onclick = () => modal.classList.add('active');
if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
window.onclick = (e) => { if (e.target == modal) modal.classList.remove('active'); }

// --- 2. Load My Stories ---
async function loadMyStories() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return location.href = 'auth.html';

    const { data: blogs, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    grid.innerHTML = blogs.map(b => `
        <div class="card bg-white p-5 shadow-sm border border-gray-100 rounded-[32px]">
            <div class="h-44 overflow-hidden rounded-2xl mb-4">
                <img src="${b.image_url}" class="w-full h-full object-cover">
            </div>
            <span class="badge mb-2 inline-block">${b.category}</span>
            <h3 class="font-bold text-lg mb-4 line-clamp-1">${b.title}</h3>
            <div class="flex justify-between items-center pt-4 border-t">
                <button onclick="deletePost('${b.id}')" class="text-red-500 font-bold text-xs uppercase hover:bg-red-50 px-2 py-1 rounded">Delete</button>
                <a href="blog-detail.html?id=${b.id}" class="text-blue-600 font-bold text-xs uppercase hover:underline">View Story →</a>
            </div>
        </div>
    `).join('');
}

// Comment Submit Logic in js/detail.js
document.getElementById('comment-form').onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('comment-input');
    const content = input.value.trim();

    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return alert("Login to comment!");
    if(!content) return;

    // IMPORTANT: blogId ko Number mein convert karein (BigInt compatibility)
    const { error } = await supabase.from('comments').insert([{ 
        user_id: user.id, 
        blog_id: Number(blogId), 
        content: content 
    }]);

    if (error) {
        console.error("Comment Error:", error);
        alert("Could not post comment: " + error.message);
    } else {
        input.value = '';
        loadSocialStats(); // Reload comments list
    }
};

// --- 3. Create Post Logic ---
postForm.onsubmit = async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('submit-btn');
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').value;
    const file = document.getElementById('image').files[0];

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please login again!");

    if (!file) return alert("Please select a cover image!");

    btn.innerText = "UPLOADING...";
    btn.disabled = true;

    try {
        // A. Image Upload to Storage
        const fileName = `blogs/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // B. Get Public URL
        const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);
        
        const imageUrl = urlData.publicUrl;

        // C. Insert into Database
        const { error: dbError } = await supabase.from('blogs').insert([{
            title: title,
            category: category,
            content: content,
            image_url: imageUrl,
            user_id: user.id
        }]);

        if (dbError) throw dbError;

        alert("Story Published Successfully!");
        location.reload(); // Page reload to show new card

    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
        btn.innerText = "PUBLISH";
        btn.disabled = false;
    }
};

// --- 4. Delete Post Logic ---
window.deletePost = async (id) => {
    if (confirm("Are you sure you want to delete this story?")) {
        const { error } = await supabase.from('blogs').delete().eq('id', id);
        if (error) alert(error.message);
        else location.reload();
    }
}

// Initialize
initNavbar();
loadMyStories();