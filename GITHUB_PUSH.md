# Push Frontend to GitHub

## Steps to Push Frontend to GitHub

### 1. Create a GitHub Repository
1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., "tracker-frontend" or "my-app-frontend")
5. Choose Public or Private
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### 2. Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these commands in the frontend directory:

```bash
cd frontend
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` with your GitHub username
- `YOUR_REPO_NAME` with the repository name you created

### 3. Alternative: Using SSH (if you have SSH keys set up)

```bash
cd frontend
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 4. Authentication

When you push, GitHub will ask for authentication:
- **Personal Access Token**: If using HTTPS, you'll need a personal access token
- **SSH Key**: If using SSH, make sure your SSH key is added to GitHub

### To Create a Personal Access Token:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name and select scopes: `repo` (full control)
4. Copy the token and use it as your password when pushing

## Quick Commands Summary

```bash
# Navigate to frontend directory
cd frontend

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

## Future Updates

After the initial push, to update your GitHub repository:

```bash
cd frontend
git add .
git commit -m "Your commit message"
git push
```
