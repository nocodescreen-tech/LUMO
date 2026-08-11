@echo off
REM ============================================
REM LUMO Desktop - Build script (Windows)
REM Charge MSVC + Windows SDK + Node, puis build Tauri
REM ============================================
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1
set PATH=C:\Program Files\nodejs;%PATH%
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
cd /d C:\Users\rene\Desktop\hubcommerce-project\client
echo ===== ENVIRONNEMENT CHARGE =====
where link
where npm
echo ===== LANCEMENT BUILD TAURI =====
call npm run tauri:build
echo ===== EXIT CODE: %ERRORLEVEL% =====
exit /b %ERRORLEVEL%
