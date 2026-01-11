import { supabase } from './config.js';
import { updateNavbar } from './navbar.js';

const modal = document.getElementById('post-modal');
const openBtn = document.getElementById('open-modal');
const closeBtn = document.getElementById('close-modal');
const postForm = document.getElementById('post-form');
const grid = document.getElementById('my-grid');

let isEditMode = false;
let currentEditId = null;

// --- 1. Modal Logic ---
openBtn.onclick = () => {
    isEditMode = false;
    currentEditId = null;
    postForm.reset();
    document.getElementById('modal-title').innerText = "New Story";
    document.getElementById('submit-btn').innerText = "PUBLISH STORY";
    document.getElementById('image-hint').classList.add('hidden');
    modal.classList.remove('hidden');
};

closeBtn.onclick = () => modal.classList.add('hidden');
window.onclick = (e) => { if (e.target == modal) modal.classList.add('hidden'); }

// --- 2. Load User's Own Stories ---
async function loadMyStories() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return location.href = 'auth.html';

    const { data: blogs, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return console.error(error);

    if (blogs.length === 0) {
        grid.innerHTML = `<div class="col-span-3 text-center py-20 bg-white rounded-[40px] border border-dashed text-gray-400 font-bold uppercase tracking-widest text-xs">You haven't published any stories yet.</div>`;
        return;
    }

    grid.innerHTML = blogs.map(b => `
        <div class="card bg-white p-6 shadow-sm border border-gray-50 flex flex-col">
            <div class="h-48 overflow-hidden rounded-[24px] mb-5">
                <img src="${b.image_url}" class="w-full h-full object-cover">
            </div>
            <span class="badge self-start mb-3">${b.category}</span>
            <h3 class="font-extrabold text-xl mb-6 line-clamp-1 text-gray-900">${b.title}</h3>
            
            <div class="mt-auto pt-5 border-t flex justify-between items-center">
                <div class="flex gap-4">
                    <button onclick="openEditModal('${b.id}')" class="text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline">Edit</button>
                    <button onclick="deletePost('${b.id}')" class="text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline">Delete</button>
                </div>
                <a href="blog-detail.html?id=${b.id}" class="text-gray-400 hover:text-blue-600 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        </div>
    `).join('');
}

// --- 3. Create / Update Logic ---
postForm.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const { data: { user } } = await supabase.auth.getUser();

    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const content = document.getElementById('content').value;
    const file = document.getElementById('image-file').files[0];

    btn.innerText = "PROCESSING...";
    btn.disabled = true;

    try {
        let imageUrl = null;

        // Agar file select ki hai toh upload karein
        if (file) {
            const fileName = `blogs/${Date.now()}_${file.name}`;
            await supabase.storage.from('blog-images').upload(fileName, file);
            imageUrl = supabase.storage.from('blog-images').getPublicUrl(fileName).data.publicUrl;
        }

        const blogData = { title, category, content, user_id: user.id };
        if (imageUrl) blogData.image_url = imageUrl;

        if (isEditMode) {
            // Update Existing
            const { error } = await supabase.from('blogs').update(blogData).eq('id', currentEditId);
            if (error) throw error;
            alert("Story Updated!");
        } else {
            // Insert New
            if (!imageUrl) throw new Error("Please select a cover image!");
            const { error } = await supabase.from('blogs').insert([blogData]);
            if (error) throw error;
            alert("Story Published!");
        }

        location.reload();
    } catch (err) {
        alert(err.message);
        btn.innerText = isEditMode ? "UPDATE STORY" : "PUBLISH STORY";
        btn.disabled = false;
    }
};

// --- 4. Edit Function ---
window.openEditModal = async (id) => {
    isEditMode = true;
    currentEditId = id;
    
    const { data: blog } = await supabase.from('blogs').select('*').eq('id', id).single();
    
    document.getElementById('title').value = blog.title;
    document.getElementById('category').value = blog.category;
    document.getElementById('content').value = blog.content;
    
    document.getElementById('modal-title').innerText = "Edit Story";
    document.getElementById('submit-btn').innerText = "UPDATE STORY";
    document.getElementById('image-hint').classList.remove('hidden');
    
    modal.classList.remove('hidden');
};

// --- 5. Delete Function ---
window.deletePost = async (id) => {
    if (confirm("Permanently delete this story? This will also remove its likes and comments.")) {
        const { error } = await supabase.from('blogs').delete().eq('id', id);
        if (error) alert(error.message);
        else location.reload();
    }
};

// Initialize
updateNavbar();
loadMyStories();