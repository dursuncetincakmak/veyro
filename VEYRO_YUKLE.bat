@echo off
chcp 65001 > nul
title Veyro - GitHub Pages Otomatik Yükleme
color 0A
echo ======================================================================
echo   VEYRO SPOR PLATFORMU - GITHUB PAGES YUKLEYICI
echo ======================================================================
echo.
echo Depo: https://github.com/dursuncetincakmak/veyro.git
echo.
echo Kodlar GitHub'a gonderiliyor...
echo Tarayicida bir GitHub onay penceresi acilirsa "Authorize" butonuna basin.
echo.
cd /d "C:\Users\fmkit017\.gemini\antigravity-ide\scratch\veyro"
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ======================================================================
    echo   BASARILI! TUM DOSYALAR GITHUB'A YUKLENDI!
    echo   Sayfaniz https://dursuncetincakmak.github.io/veyro/
    echo   adresinde yayina girecektir.
    echo ======================================================================
) else (
    echo ======================================================================
    echo   Bir hata olustu. Lutfen ekrandaki mesaji kontrol edin.
    echo ======================================================================
)
echo.
pause
