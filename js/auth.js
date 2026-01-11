import { supabase } from './config.js';

const form = document.getElementById('auth-form');
const toggleBtn = document.getElementById('toggle-btn');
const signupFields = document.getElementById('signup-fields');
const pfpInput = document.getElementById('pfp-input');
const pfpPreview = document.getElementById('pfp-preview');

let isLogin = false; // Default signup par rakha hai

toggleBtn.onclick = () => {
    isLogin = !isLogin;
    signupFields.classList.toggle('hidden', isLogin);
    document.getElementById('title').innerText = isLogin ? "Welcome Back" : "Create Account";
    document.getElementById('toggle-text').innerText = isLogin ? "Don't have an account?" : "Already have an account?";
    toggleBtn.innerText = isLogin ? "Signup" : "Login";
};

pfpInput.onchange = () => {
    const [file] = pfpInput.files;
    if (file) pfpPreview.src = URL.createObjectURL(file);
};

form.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submit-btn');
    btn.innerText = "PROCESSING...";

    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.href = 'index.html';
        } else {
            // 1. Signup User
            const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) throw authError;

            const user = authData.user;
            let avatarUrl = "";

            // 2. Upload Avatar
            const file = pfpInput.files[0];
            if (file) {
                const path = `avatars/${user.id}`;
                await supabase.storage.from('blog-images').upload(path, file);
                avatarUrl = supabase.storage.from('blog-images').getPublicUrl(path).data.publicUrl;
            }

            // 3. Create Profile Record
            const { error: profileError } = await supabase.from('profiles').insert([{
                id: user.id,
                full_name: document.getElementById('full-name').value,
                username: document.getElementById('username').value,
                avatar_url: avatarUrl
            }]);

            if (profileError) throw profileError;
            alert("Account & Profile Created! Please verify email if required.");
            window.location.href = 'index.html';
        }
    } catch (err) {
        alert(err.message);
        btn.innerText = "CONTINUE →";
    }
};

const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: document.getElementById('full-name').value // Ye naam trigger uthaye ga
      }
    }
  });