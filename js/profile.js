import { supabase } from './config.js';
import { updateNavbar } from './navbar.js'; // Navbar icon update karne ke liye
import { showToast } from './toast.js';

const form = document.getElementById('profile-form');
const avatarInput = document.getElementById('avatar');
const preview = document.getElementById('preview');

async function load() {
    // Navbar update karein taake profile icon dikhe
    updateNavbar();

    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return location.href = 'auth.html';

    // Profiles table se data uthayein
    const { data: p, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (user.email) {
        const emailField = document.getElementById('email');
        if (emailField) emailField.value = user.email;
    }

    if (error) {
        console.log("No profile found yet, please fill the details.");
        return;
    }

    if(p) {
        document.getElementById('full_name').value = p.full_name || '';
        document.getElementById('username').value = p.username || '';
        document.getElementById('bio').value = p.bio || '';
        if(p.avatar_url) {
            preview.src = p.avatar_url;
        } else {
            preview.src = "https://via.placeholder.com/150";
        }
    }
}

// Live preview when selecting new image
avatarInput.onchange = () => {
    const [file] = avatarInput.files;
    if (file) preview.src = URL.createObjectURL(file);
};

form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save');
    const originalText = btn.innerText;
    btn.innerText = "SAVING...";
    btn.disabled = true;
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        let finalImageUrl = preview.src;

        // Agar user ne nayi image select ki hai toh upload karein
        if(avatarInput.files[0]) {
            const file = avatarInput.files[0];
            const path = `avatars/${user.id}_${Date.now()}`;
            const { error: uploadError } = await supabase.storage.from('blog-images').upload(path, file);
            
            if (uploadError) throw uploadError;
            
            finalImageUrl = supabase.storage.from('blog-images').getPublicUrl(path).data.publicUrl;
        }

        // Upsert: Agar hai toh update, warna insert
        const { error: upsertError } = await supabase.from('profiles').upsert({
            id: user.id,
            full_name: document.getElementById('full_name').value,
            username: document.getElementById('username').value,
            bio: document.getElementById('bio').value,
            avatar_url: finalImageUrl,
            updated_at: new Date()
        });

        if (upsertError) throw upsertError;

        showToast("Profile Updated Successfully!", "success");
        setTimeout(() => location.reload(), 1500); // Refresh to update navbar and icons

    } catch (err) {
        showToast("Error: " + err.message, "error");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

load();