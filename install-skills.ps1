# APEX Skills Installer — Extracts .zip skills into .agent/skills/
# Run from: c:\Users\sinyo\doorstep-autorepai\autorep-ai-console
# Usage: powershell -ExecutionPolicy Bypass -File install-skills.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$skillsDir = Join-Path $root ".agent\skills"
$stagingDir = Join-Path $root "_skill_staging"

Write-Host "=== APEX Skills Installer ===" -ForegroundColor Cyan
Write-Host "Root: $root"
Write-Host "Skills dir: $skillsDir"
Write-Host ""

# Create staging directory
if (-not (Test-Path $stagingDir)) {
    New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null
}

# Define zip-to-skill mappings
$zipSkills = @(
    @{ Zip = "apex-frontend.zip";              SkillName = "apex-frontend" },
    @{ Zip = "apex-master-debug-claude.zip";   SkillName = "apex-master-debug-claude" },
    @{ Zip = "apex-memory.zip";                SkillName = "apex-memory" },
    @{ Zip = "apex-seo-claude-edition.zip";    SkillName = "apex-seo-claude-edition" },
    @{ Zip = "apexomni-test-claude-native.zip"; SkillName = "apexomni-test-claude-native" },
    @{ Zip = "omnidev-v2.zip";                 SkillName = "omnidev-v2" },
    @{ Zip = "one-pass-debug.zip";             SkillName = "one-pass-debug" }
)

foreach ($skill in $zipSkills) {
    $zipPath = Join-Path $root $skill.Zip
    $extractTo = Join-Path $stagingDir $skill.SkillName
    $targetSkillDir = Join-Path $skillsDir $skill.SkillName

    if (-not (Test-Path $zipPath)) {
        Write-Host "[SKIP] $($skill.Zip) not found" -ForegroundColor Yellow
        continue
    }

    Write-Host "[EXTRACT] $($skill.Zip)..." -ForegroundColor Green

    # Clean and extract
    if (Test-Path $extractTo) { Remove-Item $extractTo -Recurse -Force }
    Expand-Archive -Path $zipPath -DestinationPath $extractTo -Force

    # Find SKILL.md or the main .md file in the extracted content
    $skillMd = Get-ChildItem -Path $extractTo -Recurse -Filter "SKILL.md" | Select-Object -First 1

    if (-not $skillMd) {
        # Look for any .md file that could be the main skill file
        $mdFiles = Get-ChildItem -Path $extractTo -Recurse -Filter "*.md" | Where-Object { $_.Name -ne "README.md" }
        if ($mdFiles.Count -eq 1) {
            $skillMd = $mdFiles[0]
        } elseif ($mdFiles.Count -gt 1) {
            # Take the largest .md file as the main skill
            $skillMd = $mdFiles | Sort-Object Length -Descending | Select-Object -First 1
        }
    }

    # Create target skill directory
    if (-not (Test-Path $targetSkillDir)) {
        New-Item -ItemType Directory -Path $targetSkillDir -Force | Out-Null
    }

    if ($skillMd) {
        # Copy the main skill file as SKILL.md
        Copy-Item -Path $skillMd.FullName -Destination (Join-Path $targetSkillDir "SKILL.md") -Force
        Write-Host "  -> Installed SKILL.md from $($skillMd.Name)" -ForegroundColor Green

        # Copy any sibling directories (scripts, examples, resources, etc.)
        $skillMdParent = $skillMd.Directory
        $siblingDirs = Get-ChildItem -Path $skillMdParent.FullName -Directory
        foreach ($dir in $siblingDirs) {
            $targetSubDir = Join-Path $targetSkillDir $dir.Name
            Copy-Item -Path $dir.FullName -Destination $targetSubDir -Recurse -Force
            Write-Host "  -> Copied directory: $($dir.Name)/" -ForegroundColor DarkGreen
        }

        # Copy any sibling non-.md files (scripts, configs, etc.)
        $siblingFiles = Get-ChildItem -Path $skillMdParent.FullName -File | Where-Object { $_.Name -ne $skillMd.Name }
        foreach ($file in $siblingFiles) {
            Copy-Item -Path $file.FullName -Destination (Join-Path $targetSkillDir $file.Name) -Force
            Write-Host "  -> Copied file: $($file.Name)" -ForegroundColor DarkGreen
        }
    } else {
        # No .md found — copy entire extracted content
        Get-ChildItem -Path $extractTo | Copy-Item -Destination $targetSkillDir -Recurse -Force
        Write-Host "  -> Copied entire archive contents (no SKILL.md found)" -ForegroundColor Yellow
    }

    Write-Host "  [OK] $($skill.SkillName) installed" -ForegroundColor Green
    Write-Host ""
}

# Final summary
Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Cyan
Write-Host "Installed skills:" -ForegroundColor Cyan
Get-ChildItem -Path $skillsDir -Directory | ForEach-Object {
    $hasSKILL = Test-Path (Join-Path $_.FullName "SKILL.md")
    $status = if ($hasSKILL) { "[OK]" } else { "[WARN: no SKILL.md]" }
    Write-Host "  $status $($_.Name)" -ForegroundColor $(if ($hasSKILL) { "Green" } else { "Yellow" })
}

# Cleanup staging
Write-Host ""
Write-Host "Cleaning up staging directory..." -ForegroundColor DarkGray
Remove-Item $stagingDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Done! All skills are in: $skillsDir" -ForegroundColor Cyan
