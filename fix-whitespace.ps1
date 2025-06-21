#!/usr/bin/env pwsh

# Fix Trailing Whitespace Script for GenCare Project
# Usage: .\fix-whitespace.ps1

Write-Host "🧹 Fixing trailing whitespace in GenCare project..." -ForegroundColor Green

# Define file extensions to process
$extensions = @('*.ts', '*.tsx', '*.js', '*.jsx', '*.json', '*.md', '*.css', '*.scss')

# Define directories to process
$directories = @('frontend/src', 'backend/src')

$totalFilesProcessed = 0
$totalFilesFixed = 0

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "📁 Processing directory: $dir" -ForegroundColor Cyan
        
        foreach ($ext in $extensions) {
            $files = Get-ChildItem -Path $dir -Recurse -Include $ext
            
            foreach ($file in $files) {
                $totalFilesProcessed++
                $content = Get-Content -Path $file.FullName -Raw
                
                if ($content) {
                    # Remove trailing whitespace from each line
                    $newContent = $content -replace '\s+\r?\n', "`n"
                    # Remove trailing whitespace at end of file
                    $newContent = $newContent.TrimEnd()
                    
                    if ($content -ne $newContent) {
                        Set-Content -Path $file.FullName -Value $newContent -NoNewline
                        Write-Host "  ✅ Fixed: $($file.Name)" -ForegroundColor Yellow
                        $totalFilesFixed++
                    }
                }
            }
        }
    } else {
        Write-Host "⚠️  Directory not found: $dir" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Green
Write-Host "  • Total files processed: $totalFilesProcessed" -ForegroundColor White
Write-Host "  • Files fixed: $totalFilesFixed" -ForegroundColor Green

if ($totalFilesFixed -gt 0) {
    Write-Host ""
    Write-Host "🎯 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review changes: git diff" -ForegroundColor White
    Write-Host "  2. Stage changes: git add -A" -ForegroundColor White
    Write-Host "  3. Commit: git commit -m 'fix: remove trailing whitespace'" -ForegroundColor White
} else {
    Write-Host "✨ No trailing whitespace found!" -ForegroundColor Green
} 