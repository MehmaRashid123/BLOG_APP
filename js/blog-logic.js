import { supabase } from './config.js';
import { showToast } from './toast.js';

const blogForm = document.getElementById('blog-form');
const myBlogsContainer = document.getElementById('my-blogs');

// 1. Check if user is logged in
async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }
    loadMyBlogs(user.id);
}

// 2. Load ONLY Current User's Blogs
async function loadMyBlogs(userId) {
    const { data: blogs } = await supabase
        .from('blogs')
        .select('*')
        .eq('user_id', userId) // Ownership check
        .order('created_at', { ascending: false });

    myBlogsContainer.innerHTML = blogs.map(blog => `
        <div class="bg-white p-6 rounded-2xl flex gap-6 items-center shadow-sm">
            <img src="${blog.image_url}" class="w-24 h-24 rounded-xl object-cover">
            <div class="flex-1">
                <h3 class="font-bold text-lg">${blog.title}</h3>
                <p class="text-gray-400 text-sm">${blog.category}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="deleteBlog('${blog.id}')" class="text-red-500 font-bold p-2">Delete</button>
            </div>
        </div>
    `).join('');
}

// 3. Handle Form Submit (Create)
if(blogForm){
    blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = (await supabase.auth.getUser()).data.user;
        const file = document.getElementById('image-input').files[0];
        const btn = document.getElementById('save-btn');

        if(!file) return showToast("Please select an image", "warning");
        btn.innerText = "UPLOADING...";

        // Upload Image
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData } = await supabase.storage.from('blog-images').upload(fileName, file);
        const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(fileName);

        // Save to DB
        const { error } = await supabase.from('blogs').insert([{
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
            category: document.getElementById('category').value,
            image_url: urlData.publicUrl,
            user_id: user.id
        }]);

        if(error) showToast(error.message, "error");
        else location.reload();
    });
}

// 4. Delete Function
window.deleteBlog = async (id) => {
    if(confirm("Are you sure?")) {
        const { error } = await supabase.from('blogs').delete().eq('id', id);
        if(!error) location.reload();
        else showToast(error.message, "error");
    }
}

init();