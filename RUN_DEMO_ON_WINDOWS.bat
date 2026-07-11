@echo off
cd /d "%~dp0Web"
start "" http://localhost:3000
python scripts\demo_server.py
pause
