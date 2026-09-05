@echo off
set "PATH=C:\Users\laksh\.gemini\antigravity-ide\scratch\git-portable\cmd;C:\Users\laksh\.gemini\antigravity-ide\scratch\git-portable\mingw64\bin;%PATH%"

echo ================================================================
echo       HOMESTAY - NON-INTERACTIVE AUTO-REDEPLOY
echo ================================================================
echo.

echo [1/3] Staging all changes...
git add -A

echo [2/3] Committing changes...
git commit -m "feat(nav): replace rooms module with expenses in mobile app bottom navigation"

echo [3/3] Pushing to GitHub (origin main)...
git push origin main

echo.
echo ================================================================
echo [SUCCESS] Pushed to https://github.com/homestay7075-lang/homestay
echo Vercel is auto-deploying the changes!
echo ================================================================
