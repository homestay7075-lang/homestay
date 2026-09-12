@echo off
set "PATH=C:\Users\laksh\.gemini\antigravity-ide\scratch\git-portable\cmd;C:\Users\laksh\.gemini\antigravity-ide\scratch\git-portable\mingw64\bin;%PATH%"

echo ================================================================
echo       HOMESTAY - NON-INTERACTIVE AUTO-REDEPLOY
echo ================================================================
echo.

echo [1/3] Staging all changes...
git add -A

echo [2/3] Committing changes...
git commit -m "fix: adjust mobile action controls (view, delete, select, edit, collect payment) for owner, staff, and student logins"

echo [3/3] Pushing to GitHub (origin main)...
git push origin main

echo.
echo ================================================================
echo [SUCCESS] Pushed to https://github.com/homestay7075-lang/homestay
echo Vercel is auto-deploying the changes!
echo ================================================================
