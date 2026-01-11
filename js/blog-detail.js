import { supabase } from './config.js';

async function load() {
    const id = new URLSearchParams(window.location.search).get('id');
    const { data: b } = await supabase
        .from('blogs')
        .select('*, profiles(*)')
        .eq('id', id)
        .single();

    document.getElementById('render').innerHTML = `
        <header class="mb-12">
            <span class="badge">${b.category}</span>
            <h1 class="text-5xl md:text-7xl font-black mt-6 mb-8 tracking-tighter">${b.title}</h1>
            <div class="flex items-center gap-4">
                <img src="${b.profiles?.avatar_url}" class="w-12 h-12 rounded-full border">
                <div>
                    <p class="font-bold text-gray-900">${b.profiles?.full_name}</p>
                    <p class="text-xs text-gray-400">Published on ${new Date(b.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        </header>
        <img src="${b.image_url}" class="w-full rounded-[40px] shadow-2xl mb-16">
        <div class="prose prose-xl max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-xl">
            ${b.content}
        </div>
    `;
}
load();