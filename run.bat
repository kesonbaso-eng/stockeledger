@echo off
echo Demarrage StockLedger Backend...
cd /d "%~dp0backend"
python manage.py runserver
pause
