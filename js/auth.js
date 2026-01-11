import { supabase } from './config.js';
import { showToast } from './toast.js';

const form = document.getElementById('auth-form');
const pfpInput = document.getElementById('pfp-input');
const pfpPreview = document.getElementById('pfp-preview');
const toggleBtn = document.getElementById('toggle-btn');
const submitBtn = document.getElementById('submit-btn');

// Aik pakka variable state track karne ke liye
let isLoginMode = true; 

// Toggle Function
toggleBtn.onclick = () => {
    isLoginMode = !isLoginMode; // Mode badlein
    
    // UI Updates
    document.getElementById('signup-fields').classList.toggle('hidden', isLoginMode);
    document.getElementById('title').innerText = isLoginMode ? "Welcome Back" : "Create Account";
    submitBtn.innerText = isLoginMode ? "SIGN IN →" : "CREATE ACCOUNT →";
    document.getElementById('toggle-text').innerText = isLoginMode ? "Don't have an account?" : "Already have an account?";
    toggleBtn.innerText = isLoginMode ? "Signup" : "Login";
};

// Image Preview
if(pfpInput) {
    pfpInput.onchange = () => {
        const [file] = pfpInput.files;
        if (file) pfpPreview.src = URL.createObjectURL(file);
    };
}

form.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    submitBtn.innerText = "PROCESSING...";
    submitBtn.disabled = true;

    try {
        if (isLoginMode) {
            // --- LOGIN LOGIC ---
            const { data, error } = await supabase.auth.signInWithPassword({ 
                email: email, 
                password: password 
            });

            if (error) {
                // Agar email confirm nahi kiya toh Supabase login nahi karne deta
                if (error.message.includes("Email not confirmed")) {
                    throw new Error("Please check your email and confirm your account first!");
                }
                throw error;
            }

            console.log("Login Success");
            showToast("Login Successful! Redirecting...", "success");
            setTimeout(() => window.location.href = 'index.html', 1500);

        } else {
            // --- SIGNUP LOGIC ---
            const fullName = document.getElementById('full-name').value;
            const username = document.getElementById('username').value;
            const file = pfpInput.files[0];

            if (!file) throw new Error("Please upload a profile picture first.");

            // 1. Create Auth Account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: fullName } }
            });

            if (authError) throw authError;
            const user = authData.user;

            if (user) {
                // 2. Upload Avatar
                // Sanitize filename: Use generic name to avoid special char issues in URLs
                const fileExt = file.name.split('.').pop();
                const fileName = `avatars/${user.id}_${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('blog-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(fileName);
                const avatarUrl = urlData.publicUrl;

                // 3. Create Profile Entry
                // Use upsert instead of insert to prevent "duplicate key" error if profile already exists
                const { error: profileError } = await supabase.from('profiles').upsert([{
                    id: user.id,
                    full_name: fullName,
                    username: username,
                    avatar_url: avatarUrl
                }]);

                if (profileError) throw profileError;

                showToast("Signup successful! Please check your email.", "success");
                setTimeout(() => window.location.reload(), 2000); // Refresh to go back to Login mode
            }
        }
    } catch (err) {
        showToast(err.message, "error");
        submitBtn.innerText = isLoginMode ? "SIGN IN →" : "CREATE ACCOUNT →";
        submitBtn.disabled = false;
    }
};