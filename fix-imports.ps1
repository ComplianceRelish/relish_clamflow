# fix-imports.ps1
# Batch fix all UI component imports with correct casing

Write-Host "🔍 Searching for files to fix..." -ForegroundColor Green

$files = Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse

$replacements = @(
    @{ From = "from '@/components/ui/badge'"; To = "from '@/components/ui/Badge'" },
    @{ From = "from '@/components/ui/button'"; To = "from '@/components/ui/Button'" },
    @{ From = "from '@/components/ui/card'"; To = "from '@/components/ui/Card'" },
    @{ From = "from '@/components/ui/input'"; To = "from '@/components/ui/Input'" },
    @{ From = "from '@/components/ui/label'"; To = "from '@/components/ui/Label'" },
    @{ From = "from '@/components/ui/select'"; To = "from '@/components/ui/Select'" },
    @{ From = "from '@/components/ui/switch'"; To = "from '@/components/ui/Switch'" },
    @{ From = "from '@/components/ui/alert'"; To = "from '@/components/ui/Alert'" },
    @{ From = "from '@/components/ui/formfield'"; To = "from '@/components/ui/FormField'" },
    @{ From = "from '@/components/ui/formselect'"; To = "from '@/components/ui/FormSelect'" },
    @{ From = "from '@/components/ui/progress'"; To = "from '@/components/ui/Progress'" },
    @{ From = "from '@/components/ui/dialog'"; To = "from '@/components/ui/Dialog'" },
    @{ From = "from '@/components/ui/modal'"; To = "from '@/components/ui/Modal'" },
    @{ From = "from '@/components/ui/tabs'"; To = "from '@/components/ui/Tabs'" },
    @{ From = "from '@/components/ui/separator'"; To = "from '@/components/ui/Separator'" }
)

$fixedCount = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        $original = $content

        foreach ($r in $replacements) {
            $content = $content -replace [regex]::Escape($r.From), $r.To
        }

        if ($original -ne $content) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8
            Write-Host "✅ Fixed imports in $($file.Name)" -ForegroundColor Cyan
            $fixedCount++
        }
    }
    catch {
        Write-Host "❌ Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Done! Fixed $fixedCount files." -ForegroundColor Green