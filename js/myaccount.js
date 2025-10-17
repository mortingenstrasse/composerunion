document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = 'signup.html'; // Redirect to login if not authenticated
        return;
    }

    const welcomeMessage = document.getElementById('welcome-message');
    const userEmailSpan = document.getElementById('user-email');
    const userFullNameSpan = document.getElementById('user-full-name');
    const userRoleSpan = document.getElementById('user-role');
    const becomeWriterButton = document.getElementById('become-writer-button');
    const adminPanelButton = document.getElementById('admin-panel-button');
    const logoutButton = document.getElementById('logout-button');
    const writerBioSection = document.getElementById('writer-bio-section');
    const writerBioTextarea = document.getElementById('writer-bio');
    const submitWriterApplicationButton = document.getElementById('submit-writer-application');

    // Fetch user metadata
    const { data: userProfile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('full_name, role') // Removed writer_application_status
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Error fetching user profile:', profileError.message);
        window.showCustomAlert('Error loading user data.', 'error');
        return;
    }

    // Display user information
    userEmailSpan.textContent = user.email;
    userFullNameSpan.textContent = userProfile.full_name || 'N/A';
    userRoleSpan.textContent = userProfile.role || 'User';
    welcomeMessage.textContent = `Welcome, ${userProfile.full_name || 'User'}!`;

    // Handle "Become a Writer" button
    // NOTE: The 'writer_application_status' column is missing from the 'profiles' table.
    // For full functionality, please add a 'writer_application_status' column (type TEXT, default 'none')
    // and a 'writer_bio' column (type TEXT) to your Supabase 'profiles' table.
    if (userProfile.role === 'User') { // Simplified condition due to missing column
        becomeWriterButton.style.display = 'block';
        becomeWriterButton.addEventListener('click', () => {
            writerBioSection.style.display = 'block';
            becomeWriterButton.style.display = 'none';
        });

        submitWriterApplicationButton.addEventListener('click', async () => {
            const bio = writerBioTextarea.value.trim();
            if (bio.length < 50) {
                window.showCustomAlert('Please provide a more detailed bio (minimum 50 words).', 'warning');
                return;
            }

            // This update will fail if 'writer_application_status' and 'writer_bio' columns are not present.
            // Informing the user about this.
            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update({ writer_application_status: 'pending', writer_bio: bio }) // These columns need to exist
                .eq('id', user.id);

            if (updateError) {
                console.error('Error submitting writer application:', updateError.message);
                window.showCustomAlert('Error submitting application. Please ensure "writer_application_status" and "writer_bio" columns exist in your profiles table.', 'error');
            } else {
                window.showCustomAlert('Writer application submitted successfully! We will review it shortly.', 'success');
                writerBioSection.style.display = 'none';
                userRoleSpan.textContent = 'User (Application Pending)';
            }
        });
    }

    // Handle "Admin Panel" button
    if (userProfile.role === 'admin') { // Changed to lowercase 'admin'
        adminPanelButton.style.display = 'block';
        adminPanelButton.addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
    }

    // Handle "Log Out" button
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
            window.showCustomAlert('Error logging out.', 'error');
        } else {
            window.location.href = 'index.html'; // Redirect to home page after logout
        }
    });
});
