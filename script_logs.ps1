# Récupérer les logs en temps réel depuis adb logcat
$logs = adb logcat -t 5000 | Out-String 

# Diviser les logs en lignes
$lines = $logs -split "`n"

# Extraire les logs entre les mots "Début" et "Fin"
$inside = $false
$filteredLogs = @()

foreach ($line in $lines) {
    if ($line -match "Button clicked") { $inside = $true }  # Commence la capture
    if ($inside) { $filteredLogs += $line }       # Ajoute les lignes
    if ($line -match "Finished button") { $inside = $false }  # Arrête la capture
}

# Afficher les logs filtrés
$filteredLogs | Out-File "filtered_logs.txt"