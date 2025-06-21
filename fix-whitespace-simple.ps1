Write-Host "Fixing trailing whitespace..." -ForegroundColor Green

$extensions = @('*.ts', '*.tsx', '*.js', '*.jsx', '*.json', '*.md')
$directories = @('frontend/src', 'backend/src')

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "Processing: $dir" -ForegroundColor Cyan
        foreach ($ext in $extensions) {
            Get-ChildItem -Path $dir -Recurse -Include $ext | ForEach-Object {
                $content = Get-Content $_.FullName -Raw
                if ($content) {
                    $newContent = $content -replace '\s+$', ''
                    if ($content -ne $newContent) {
                        Set-Content $_.FullName $newContent -NoNewline
                        Write-Host "Fixed: $($_.Name)" -ForegroundColor Yellow
                    }
                }
            }
        }
    }
}

Write-Host "Done!" -ForegroundColor Green 