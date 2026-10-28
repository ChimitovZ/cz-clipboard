Add-Type -AssemblyName System.Drawing
$bmp = New-Object Drawing.Bitmap 256, 256
$g = [Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.Clear([Drawing.Color]::FromArgb(18, 23, 31))
$brush = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(61, 154, 143))
$g.FillEllipse($brush, 16, 16, 224, 224)
$w = New-Object Drawing.SolidBrush ([Drawing.Color]::White)
$g.FillRectangle($w, 86, 58, 84, 12)
$g.FillRectangle($w, 78, 70, 100, 128)
$ink = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(18, 23, 31))
$g.FillRectangle($ink, 96, 92, 64, 8)
$g.FillRectangle($ink, 96, 112, 64, 8)
$g.FillRectangle($ink, 96, 132, 48, 8)
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$png = Join-Path $dir 'icon.png'
$bmp.Save($png, [Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output $png
