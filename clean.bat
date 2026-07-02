@echo off
echo Cleaning project...

if exist .next rmdir /s /q .next
if exist node_modules rmdir /s /q node_modules

echo.
echo Done!
pause