import { supabase } from './config.js';
import { updateNavbar } from './navbar.js';

let allBlogs = [];

async function loadFeed() {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="col-span-3 text-center py-20 text-gray-400">Loading stories...</div>';

    // Fetch Blogs with Author, Likes Count, and Comments Count
    const { data: blogs, error } = await supabase
        .from('blogs')
        .select(`
            *,
            profiles (full_name, avatar_url),
            likes (count),
            comments (count)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        grid.innerHTML = `<div class="col-span-3 text-center text-red-500">Error: ${error.message}</div>`;
        return;
    }

    allBlogs = blogs;
    renderBlogs(blogs);
    renderCategories(blogs);
}

function renderBlogs(blogs) {
    const grid = document.getElementById('blog-grid');
    grid.innerHTML = blogs.map(b => `
        <div class="card cursor-pointer group" onclick="location.href='blog-detail.html?id=${b.id}'">
            <div class="h-64 overflow-hidden bg-gray-50">
                <img src="${b.image_url}" class="w-full h-full object-cover transition duration-700 group-hover:scale-105">
            </div>
            <div class="p-8">
                <div class="flex items-center gap-3 mb-6">
                    <img src="${b.profiles?.avatar_url || 'https://via.placeholder.com/40'}" class="w-8 h-8 rounded-full border object-cover">
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">${b.profiles?.full_name || 'Anonymous'}</span>
                </div>
                <h3 class="text-2xl font-black mb-4 leading-tight group-hover:text-blue-600 transition">${b.title}</h3>
                <div class="flex items-center gap-6 mt-6 pt-4 border-t text-[11px] font-bold text-gray-400">
                    <span class="flex items-center gap-1.5"><span class="text-rose-500">♥</span> ${b.likes[0]?.count || 0}</span>
                    <span class="flex items-center gap-1.5">💬 ${b.comments[0]?.count || 0}</span>
                    <span class="ml-auto badge">${b.category}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCategories(blogs) {
    const list = document.getElementById('category-list');
    const categories = ['All', ...new Set(blogs.map(b => b.category))];
    list.innerHTML = categories.map(cat => `
        <button onclick="filterBy('${cat}')" class="px-6 py-2 rounded-full border border-gray-100 text-gray-500 font-bold text-[10px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition">
            ${cat}
        </button>
    `).join('');
}

window.filterBy = (cat) => {
    if (cat === 'All') renderBlogs(allBlogs);
    else renderBlogs(allBlogs.filter(b => b.category === cat));
};

// Start
updateNavbar();
loadFeed();