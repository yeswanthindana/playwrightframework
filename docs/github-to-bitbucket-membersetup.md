# GitHub → Bitbucket Migration Guide (VS Code)

This document explains how to migrate a repository from **GitHub** to **Bitbucket**  for smooth Git operations using **SSH (recommended)** or **HTTPS** authentication.

---

## Prerequisites

- Git installed
- Bitbucket account with repository access
- Existing local Git repository

---

## Step 1: Create Repository in Bitbucket

1. Log in to Bitbucket.
2. Create a new repository under your workspace.
3. Example repository URL:
   https://bitbucket.org/aether_technologies/quality-engineering.git

---

## Step 2: Sign Out from GitHub in VS Code (Recommended)

1. Open VS Code
2. Press Ctrl + Shift + P
3. Select:
   GitHub: Sign out

### Remove Stored GitHub Credentials

Linux:
rm ~/.git-credentials

Mac:
Open Keychain Access and delete entries related to github.com

Windows:
Open Credential Manager and remove GitHub / Git credentials

---

## Step 3: Update Git Remote to Bitbucket

Check existing remotes:
git remote -v

Update remote (SSH recommended):
git remote set-url origin git@bitbucket.org:workspace/repo.git

Or using HTTPS:
git remote set-url origin https://membername@bitbucket.org/workspace/repo.git

Verify:
git remote -v

---

## Step 4: Configure SSH Authentication (Recommended)

Generate SSH key:
ssh-keygen -t ed25519 -C "your_email@example.com"

Press Enter to accept default path:
~/.ssh/id_ed25519

Add SSH key to agent:
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519 
If asked for passphrase, click enter - not required

---

## Step 5: Add SSH Key to Bitbucket

Copy public key:
cat ~/.ssh/id_ed25519.pub

Go to:
Bitbucket → Personal Settings → SSH Keys → Add Key

Paste the key and save.

---

## Step 6: Test SSH Connection

ssh -T git@bitbucket.org

Expected output:
authenticated via ssh key.

---

## Step 7: Verify Push & Pull

1. git pull origin main 
2. git push origin main

---

## Result

GitHub repository successfully migrated to Bitbucket.
SSH authentication enabled.