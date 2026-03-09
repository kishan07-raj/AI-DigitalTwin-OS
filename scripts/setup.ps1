# AI DigitalTwin OS - Setup Script for Windows

Write-Host "🚀 Setting up AI-DigitalTwin-OS..." -ForegroundColor Green

# Check Node.js
Write-Host "`n📦 Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "`n🐍 Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>$null
if ($pythonVersion) {
    Write-Host "✓ $pythonVersion found" -ForegroundColor Green
} else {
    Write-Host "✗ Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Install Frontend Dependencies
Write-Host "`n📦 Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }
Set-Location ..

# Install Backend Dependencies
Write-Host "`n📦 Installing Backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) { exit 1 }
Set-Location ..

# Setup Python Environment
Write-Host "`n🐍 Setting up Python environment..." -ForegroundColor Yellow
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r ai_engine/requirements.txt

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nTo run the application:" -ForegroundColor Yellow
Write-Host "  1. Start MongoDB" -ForegroundColor Cyan
Write-Host "  2. Run: npm run dev (backend)" -ForegroundColor Cyan
Write-Host "  3. Run: npm run dev (frontend)" -ForegroundColor Cyan

