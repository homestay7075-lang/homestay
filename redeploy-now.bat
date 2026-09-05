@echo off
set "PATH=C:\Users\laksh\.gemini\antigravity-ide\scratch\git-portable\cmd;C:\Users\laksh\.gemini\antigravity-ide\scratch\git-portable\mingw64\bin;%PATH%"

echo ================================================================
echo       HOMESTAY - NON-INTERACTIVE AUTO-REDEPLOY
echo ================================================================
echo.

echo [1/3] Staging all changes...
git add -A

echo [2/3] Committing changes...
git commit -m "feat: add password eye toggle to website, direct UPI app payment, and owner receipt verification flow"

echo [3/3] Pushing to GitHub (origin main)...
git push origin main

echo.
echo ================================================================
echo [SUCCESS] Pushed to https://github.com/homestay7075-lang/homestay
echo Vercel is auto-deploying the changes!
echo ================================================================
