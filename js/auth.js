// ComposerUnion.com - Authentication Logic

// Check authentication state and update UI
async function checkAuth() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const headerAuthButton = document.getElementById('header-auth-button');
    
    if (user) {
        headerAuthButton.textContent = 'My Account';
        headerAuthButton.href = 'myaccount.html';
    } else {
        headerAuthButton.textContent = 'Log In / Sign Up';
        headerAuthButton.href = 'signup.html';
    }
}

// Logout function
async function logout(e) {
    e.preventDefault();
    await supabaseClient.auth.signOut();
    window.showCustomAlert('You have been logged out.', 'info');
    window.location.href = 'index.html'; // Redirect to index after logout
}

// Email signup
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('full-name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        
        if (error) {
            if (error.message.includes('already registered')) { // Supabase specific error for duplicate email
                window.showCustomAlert('This email is already registered. Please log in or use a different email.', 'error');
            } else {
                window.showCustomAlert('Error: ' + error.message, 'error');
            }
            return;
        }
        
        // Update profile with full name
        await supabaseClient
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);
        
        window.showCustomAlert('Signup successful! Please check your email for verification.', 'success');
        window.location.href = 'index.html';
    });
}

// Email login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            window.showCustomAlert('Login Error: ' + error.message, 'error');
            return;
        }
        
        window.showCustomAlert('Logged in successfully!', 'success');
        window.location.href = 'index.html';
    });
}

// Google OAuth
const googleLoginBtn = document.getElementById('google-login');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google'
        });
        
        if (error) {
            window.showCustomAlert('Google Login Error: ' + error.message, 'error');
        }
    });
}

const googleLoginBtn2 = document.getElementById('google-login-2');
if (googleLoginBtn2) {
    googleLoginBtn2.addEventListener('click', async () => {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google'
        });
        
        if (error) {
            window.showCustomAlert('Google Login Error: ' + error.message, 'error');
        }
    });
}

// Toggle between signup and login forms
const toggleLogin = document.getElementById('toggle-login');
const signupBox = document.querySelector('.auth-box'); // Assuming signup form is in the first .auth-box
const loginBox = document.getElementById('login-box');

if (toggleLogin) {
    toggleLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (signupBox) signupBox.style.display = 'none';
        if (loginBox) loginBox.style.display = 'block';
    });
}

const toggleSignup = document.getElementById('toggle-signup');
if (toggleSignup) {
    toggleSignup.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginBox) loginBox.style.display = 'none';
        if (signupBox) signupBox.style.display = 'block';
    });
}


// Newsletter signup
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('newsletter-email').value;
        
        const { error } = await supabaseClient
            .from('newsletter_subscribers')
            .insert({ email: email });
        
        if (error) {
            window.showCustomAlert('Error subscribing: ' + error.message, 'error');
            return;
        }
        
        window.showCustomAlert('Thank you for subscribing!', 'success');
        document.getElementById('newsletter-email').value = '';
    });
}

// Initialize auth check on page load
checkAuth();
