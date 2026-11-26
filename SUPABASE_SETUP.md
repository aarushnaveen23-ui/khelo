# KHELO Email + Password Setup

KHELO signs users in with an email address and a KHELO account password. The app does not ask for an email OTP or send a passwordless sign-in link.

## 1. Supabase project values

1. Open https://supabase.com/dashboard and select your KHELO project.
2. In Project Settings → API, copy the Project URL.
3. Copy the public anon key or publishable key.
4. Never use a `service_role` or secret key in the desktop app.

## 2. Enable email/password sign-in without email verification

For the no-OTP/no-confirmation flow requested for this build:

1. Open Authentication → Sign In / Providers → Email.
2. Make sure the Email provider is enabled.
3. Turn **OFF** `Confirm email`.
4. Save the provider settings.

Important: with Confirm email turned off, Supabase accepts a newly entered email without proving that the user owns that inbox. Use this for a private test project only. For a public release, email verification should be enabled and a proper desktop confirmation-link flow should be implemented instead.

## 3. Configure KHELO

1. Run `SETUP_EMAIL_LOGIN.bat`.
2. Notepad opens the `.env` file.
3. Add the URL and public key from the same Supabase project:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
   ```

4. Save `.env` and close Notepad.

These two values are public client configuration. Never put a service-role key, secret key, database password, or your KHELO account password in `.env`.

## 4. Create your KHELO account

1. Run KHELO.
2. Enter your email address and choose a KHELO password of at least 8 characters.
3. Click **Create account**.
4. Once the account is created, KHELO opens the chess player setup.
5. Next time, enter the same email and password and click **Sign in**.

Your KHELO password is separate from your Gmail password. Do not share it with anyone.

## 5. If you used the old OTP version before

The old OTP-only flow may already have created a Supabase user that has no password. If KHELO says the user is already registered or the password is invalid:

1. Open Supabase → Authentication → Users.
2. Find only the test account you created for KHELO.
3. Delete that old test user.
4. Open the new KHELO build and click **Create account** with your email and a new KHELO password.

Only remove your own KHELO test account. Do not delete any other users.

## 6. Build a fresh Windows installer

After updating the source code and saving `.env`, run:

- `INSTALL_DEPENDENCIES.bat` (only if dependencies are not installed yet)
- `BUILD_KHELO_EXE.bat`

The Windows installer is written to the `release` folder.

## 7. GitHub Actions

For a build through GitHub Actions, add these repository Actions variables under Settings → Secrets and variables → Actions → Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never add a service-role or secret key as a client-side variable.
