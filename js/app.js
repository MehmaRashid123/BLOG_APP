import { supabase } from './config.js';
import { updateNavbar } from './navbar.js';

let allBlogs = [];

async function loadFeed() {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="col-span-3 text-center py-20 text-gray-400 font-medium tracking-widest">LOADING STORIES...</div>';

    // Fetch Blogs with Author, Likes Count, and Comments Count
    // profiles:user_id ensure karta hai ke relationship sahi se map ho
    const { data: blogs, error } = await supabase
        .from('blogs')
        .select(`
            *,
            profiles:user_id (full_name, avatar_url),
            likes(count),
            comments(count)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Feed Error:", error);
        grid.innerHTML = `<div class="col-span-3 text-center text-red-500 bg-red-50 p-10 rounded-3xl">Error: ${error.message}</div>`;
        return;
    }

    allBlogs = blogs;
    renderBlogs(blogs);
    renderCategories(blogs);
}

function renderBlogs(blogs) {
    const grid = document.getElementById('blog-grid');
    if (blogs.length === 0) {
        grid.innerHTML = '<div class="col-span-3 text-center py-20 text-gray-400">No stories found in this category.</div>';
        return;
    }

    grid.innerHTML = blogs.map(b => {
        // Supabase select(count) usually returns an array like [{count: 5}]
        const likeCount = b.likes ? (b.likes[0]?.count || 0) : 0;
        const commentCount = b.comments ? (b.comments[0]?.count || 0) : 0;

        return `
        <div class="card cursor-pointer group" onclick="location.href='blog-detail.html?id=${b.id}'">
            <div class="h-64 overflow-hidden bg-gray-50">
                <img src="${b.image_url}" class="w-full h-full object-cover transition duration-700 group-hover:scale-105" onerror="this.src='https://via.placeholder.com/600x400'">
            </div>
            <div class="p-8">
                <div class="flex items-center gap-3 mb-6">
                    <img src="${b.profiles?.avatar_url || 'https://via.placeholder.com/40'}" class="w-9 h-9 rounded-full border border-gray-100 object-cover">
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">${b.profiles?.full_name || 'Anonymous'}</span>
                </div>
                <h3 class="text-2xl font-black mb-4 leading-tight group-hover:text-blue-600 transition">${b.title}</h3>
                <div class="flex items-center gap-6 mt-6 pt-4 border-t text-[11px] font-bold text-gray-400">
                    <span class="flex items-center gap-1.5"><span class="text-rose-500">♥</span> ${likeCount}</span>
                    <span class="flex items-center gap-1.5">💬 ${commentCount}</span>
                    <span class="ml-auto badge">${b.category}</span>
                </div>
            </div>
        </div>
    `}).join('');
}

function renderCategories(blogs) {
    const list = document.getElementById('category-list');
    if (!list) return;
    
    // Unique categories nikalna
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