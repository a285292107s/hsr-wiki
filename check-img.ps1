Invoke-WebRequest -Uri 'https://static.nanoka.cc/assets/hsr/avatardrawcard/1005.webp' -OutFile "$env:TEMP\test_drawcard.webp"
$bytes = [System.IO.File]::ReadAllBytes("$env:TEMP\test_drawcard.webp")
Write-Output "File size: $($bytes.Length) bytes"
$hex = ($bytes[0..39] | ForEach-Object { $_.ToString('X2') }) -join ' '
Write-Output "Header hex: $hex"
$fourcc = [System.Text.Encoding]::ASCII.GetString($bytes, 12, 4)
Write-Output "FourCC: $fourcc"
if ($fourcc -eq 'VP8 ') {
  $w = [BitConverter]::ToUInt16($bytes, 26) -band 0x3FFF
  $h = [BitConverter]::ToUInt16($bytes, 28) -band 0x3FFF
} elseif ($fourcc -eq 'VP8L') {
  $b0 = $bytes[21]; $b1 = $bytes[22]; $b2 = $bytes[23]; $b3 = $bytes[24]
  $w = (($b1 -band 0x3F) -shl 8 -bor $b0) + 1
  $h = (($b3 -band 0xF) -shl 10 -bor ($b2 -shl 2) -bor (($b1 -shr 6) -band 0x3)) + 1
} elseif ($fourcc -eq 'VP8X') {
  $w = ($bytes[24] -bor ($bytes[25] -shl 8) -bor ($bytes[26] -shl 16)) + 1
  $h = ($bytes[27] -bor ($bytes[28] -shl 8) -bor ($bytes[29] -shl 16)) + 1
}
Write-Output "${w} x ${h}"
