# Rack & Recall

NWL2023 word study with an FSRS cardbox, as a Windows app and an Android app that sync with each other.

The whole app is one page, `web/index.html`. The Windows app (Electron) and the Android app (Capacitor) each wrap that same page, so they always have the same features. GitHub builds both for you.

## 1. Set up sync (Supabase, free)

Do this once. It takes about ten minutes.

1. Go to [supabase.com](https://supabase.com), sign up, and create a **New project**. Any name and region will do. Choose a database password and keep it somewhere safe. The app doesn't use it, but Supabase asks for it.
2. When the project is ready, open **SQL Editor**, then **New query**. Paste the whole of `supabase/setup.sql` and press **Run**. It should say "Success. No rows returned."
3. Optional but easier: go to **Authentication → Sign In / Providers → Email** and turn off **Confirm email**. If you leave it on, you'll click a link in an email after creating your account.
4. Open **Project Settings → API** (or **Data API**) and copy two things:
   - the **Project URL**, which looks like `https://abcdxyz.supabase.co`
   - the **anon public** key, a long string starting with `eyJ`

   The anon key is safe to paste into the app. The table only lets each signed-in person see their own rows.

The free plan pauses a project after a week with no activity. Studying every few days keeps it awake. If it does pause, open the Supabase dashboard and press **Restore**. Nothing is lost, and the apps keep working offline in the meantime.

## 2. Build the apps (GitHub, free)

1. Create a GitHub account if you don't have one, then create a **New repository**. Private is fine.
2. Upload every file in this folder, including the hidden `.github` folder. The easiest way is to drag the folder's contents onto the repository's **Add file → Upload files** page. You can also use GitHub Desktop or git.
3. Open the repository's **Actions** tab. A run called **Build apps** starts by itself. You can also start one with **Run workflow**. It takes about 10–15 minutes.
4. When it shows a green check, open the run and download the two files under **Artifacts**:
   - **windows-installer**: unzip it and run `Rack-and-Recall-Setup-1.0.2.exe`. Windows may say "Windows protected your PC", because the app isn't signed with a paid certificate. Choose **More info → Run anyway**.
   - **windows-portable**: the same app with no installer. Unzip it anywhere, such as Documents, and run `RackAndRecall.exe`.

   If the app won't open after installing ("Windows cannot access the specified device, path, or file"), Windows Security has probably quarantined it. Open **Windows Security → Virus & threat protection → Protection history**, find the Rack & Recall entry, and choose **Actions → Restore** (or **Allow on device**). Then reinstall.
   - **android-apk**: unzip it, copy `Rack-and-Recall.apk` to your phone (by email, Google Drive or USB), and open it. Android will ask you to allow installs from that app. Allow it once, then install.

To publish a numbered release with both files attached, push a tag such as `v1.0.1`. The run then also creates a GitHub Release.

## 3. Turn on sync in each app

Open **Settings → Sync between devices** and paste the Project URL and anon key.

- **First device:** enter your email and a password, then press **Create account**.
- **Every other device:** use the same email and password and press **Sign in**.

The pill at the top of the app shows the sync status. Tap it to sync right away. Otherwise sync runs a few seconds after you study, when you switch away from the app, and every few minutes.

How sync behaves:
- Each device keeps a full copy and works offline.
- When two devices change the same card, the most recent change wins.
- Your review history from all devices is combined, so Statistics and **Fit to my reviews** see everything.
- Flashcard mode is set per device. Everything else is shared.

**Back up progress** still works on both apps. On Android it opens the share sheet, so you can save the file to Drive or Files.

## Updating the app

Replace `web/index.html` with a new version and push it. GitHub builds fresh installers. Your progress lives in each app's storage and in Supabase, so it survives updates.

`tools/` holds what built `index.html`: `template.html` (the app), `build.py` (embeds the word list from a Zyzzyva-style `NWL2023.db`) and `make_icons.py`. To rebuild with a new lexicon file:

```
python3 tools/build.py path/to/NWL2023.db tools/template.html web/index.html
```

## Files

| Path | What it is |
|---|---|
| `web/index.html` | The app, with the NWL2023 word list built in |
| `electron/main.js` | Windows window shell |
| `capacitor.config.json` | Android app settings |
| `build/`, `assets/` | Icons and splash screens |
| `supabase/setup.sql` | Creates the sync table and its privacy rules |
| `.github/workflows/build.yml` | Builds the Windows installer and Android APK |
| `tools/` | Source for rebuilding `index.html` and the icons |
