import { supabase } from './config.js';

export async function updateNavbar() {
    const navActions = document.getElementById('nav-actions');
    if (!navActions) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // User login hai -> Profile pic, Dashboard aur Logout dikhao
        const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
        const avatar = profile?.avatar_url || 'https://via.placeholder.com/40';

        navActions.innerHTML = `
            <div class="flex items-center gap-6">
                <a href="dashboard.html" class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition">Dashboard</a>
                <a href="profile.html" class="relative group">
                    <img src="${avatar}" class="w-10 h-10 rounded-full object-cover border-2 border-blue-50 hover:border-blue-600 transition shadow-sm">
                    <span class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </a>
                <button id="logout-btn" class="bg-red-50 text-red-600 px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition">
                    Logout
                </button>
            </div>
        `;

        document.getElementById('logout-btn').onclick = async () => {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        };
    } else {
        // User login nahi hai -> Get Started dikhao
        navActions.innerHTML = `
            <a href="auth.html" class="btn-primary">
                GET STARTED →
            </a>
        `;
    }
}