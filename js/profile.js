import { supabase } from './config.js';

const form = document.getElementById('profile-form');
const avatarInput = document.getElementById('avatar');
const preview = document.getElementById('preview');

async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return location.href = 'auth.html';

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if(p) {
        document.getElementById('full_name').value = p.full_name || '';
        document.getElementById('username').value = p.username || '';
        document.getElementById('bio').value = p.bio || '';
        if(p.avatar_url) preview.src = p.avatar_url;
    }
}

avatarInput.onchange = () => {
    const [file] = avatarInput.files;
    if (file) preview.src = URL.createObjectURL(file);
};

form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save');
    btn.innerText = "SAVING...";
    
    const { data: { user } } = await supabase.auth.getUser();
    let url = preview.src;

    if(avatarInput.files[0]) {
        const file = avatarInput.files[0];
        const path = `avatars/${user.id}_${Date.now()}`;
        await supabase.storage.from('blog-images').upload(path, file);
        url = supabase.storage.from('blog-images').getPublicUrl(path).data.publicUrl;
    }

    await supabase.from('profiles').upsert({
        id: user.id,
        full_name: document.getElementById('full_name').value,
        username: document.getElementById('username').value,
        bio: document.getElementById('bio').value,
        avatar_url: url
    });

    alert("Profile Updated!");
    btn.innerText = "UPDATE PROFILE";
};
load();