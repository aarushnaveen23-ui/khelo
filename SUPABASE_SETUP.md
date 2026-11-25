# KHELO Email OTP Setup

KHELO uses Supabase Auth to send a real one-time code to the email address entered on the sign-in screen. The app does not generate, display, or guess OTP codes.

## 1. Create a Supabase project

1. Open https://supabase.com/dashboard and create a project.
2. In Project Settings → API, copy the Project URL.
3. Copy the public anon key (or publishable key).
4. Do not use the service_role key. Never put a service_role or secret key in a desktop app.

## 2. Make Supabase send a six-digit code

Supabase email sign-in can send a magic link or an OTP. To send a numeric code:

1. Open Authentication → Email Templates.
2. Open the Magic Link template.
3. Change the email body to include the token variable, for example:

   <h2>Your KHELO sign-in code</h2>
   <p>Enter this one-time code in KHELO:</p>
   <h1>{{ .Token }}</h1>
   <p>If you did not request this code, you can ignore this email.</p>

4. Save the template.
5. In Authentication → Sign In / Providers → Email, make sure Email provider is enabled.

The template must contain {{ .Token }} to send a numeric OTP instead of a confirmation link.

## 3. Add the project settings to KHELO

1. Run SETUP_EMAIL_LOGIN.bat.
2. Notepad opens the .env file.
3. Replace the two example values:

   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY

4. Save and close Notepad.

These are public client configuration values. Never paste a service_role key or database password.

## 4. Email delivery

For reliable public delivery, configure a verified SMTP provider in Supabase. Check the provider's current sending limits and anti-abuse settings. Supabase also applies OTP rate limits; KHELO disables its resend button for one minute after a successful resend.

## 5. Build after configuration

Run INSTALL_DEPENDENCIES.bat, then BUILD_KHELO_EXE.bat. The installer appears in the release folder.

## 6. Build through GitHub Actions

Add repository Actions variables under Settings → Secrets and variables → Actions → Variables:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

The workflow checks that both are present before creating the Windows installer.
