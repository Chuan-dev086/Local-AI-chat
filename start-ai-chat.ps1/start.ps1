$projectRoot = "C:\Users\User\Desktop\js-study\Own Project\AI_chat"
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

Start-Process powershell.exe `
  -ArgumentList "-NoExit", "-Command", "ollama serve" `
  -WorkingDirectory "$projectRoot"

Start-Process powershell.exe `
  -ArgumentList "-NoExit", "-Command", "npm start" `
  -WorkingDirectory "$backendPath"

Start-Process powershell.exe `
  -ArgumentList "-NoExit", "-Command", "npm run dev" `
  -WorkingDirectory "$frontendPath"

Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"