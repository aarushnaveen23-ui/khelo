# KHELO Email OTP Setup

KHELO uses Supabase Auth email OTP. The app asks for a six-digit code and verifies it inside the desktop window; users should not need to click a confirmation link that redirects to a localhost website.

## 1. Create a Supabase project

1. Open https://supabase.com/dashboard and create a project.
2. In Project Settings → API, copy the Project URL.
3. Copy the public anon key (or publishable key).
4. Do not use the service_role key. Never put a service_role or secret key in a desktop app.

## 2. Configure BOTH email templates to send a six-digit code

This is important because Supabase has separate templates for new sign-ups and later sign-ins.

1. Open Authentication → Email Templates.
2. Open **Confirm sign up**.
3. Replace its subject with: `Your KHELO verification code`
4. Replace its body with:

   ```html
   <h2>Your KHELO verification code</h2>
   <p>Enter this six-digit code in the KHELO desktop app:</p>
   <h1>{{ .Token }}</h1>
   <p>If you did not request this code, you can ignore this email.</p>
   ```

5. Save the template.
6. Open **Magic Link** (sometimes labelled **Magic Link or OTP**).
7. Set the same subject and body shown above, using `{{ .Token }}`, then save.
8. Open Authentication → Sign In / Providers → Email and make sure the Email provider is enabled.

Do not leave a `{{ .ConfirmationURL }}` sign-in link in either of these templates when using KHELO's six-digit OTP screen. Supabase uses `{{ .Token }}` to send a numeric OTP instead of a link.

## 3. Add the project settings to KHELO

1. Run SETUP_EMAIL_LOGIN.bat.
2. Notepad opens the `.env` file.
3. Set these values using the same Supabase project:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
   ```

4. Save `.env` and close Notepad.

These are public client configuration values. Never paste a service_role key, secret key, or database password.

## 4. Email delivery

For reliable public delivery, configure a verified SMTP provider in Supabase. Check the provider's current sending limits and anti-abuse settings. Supabase also applies OTP rate limits; KHELO disables its resend button for one minute after a successful resend.

## 5. Build after configuration

Run INSTALL_DEPENDENCIES.bat, then BUILD_KHELO_EXE.bat. The installer appears in the release folder.

## 6. Build through GitHub Actions

Add repository Actions variables under Settings → Secrets and variables → Actions → Variables:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

The workflow checks that both are present before creating the Windows installer.
