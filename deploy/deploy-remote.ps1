param(
  [Parameter(Mandatory=$true)][string]$SshHost,
  [Parameter(Mandatory=$true)][string]$ApiDomain,
  [string]$FrontendOrigins = 'http://127.0.0.1:3001,http://localhost:3001'
)
$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSVersion.Major -lt 7) { throw '请使用 PowerShell 7 执行部署脚本。' }
if ($SshHost -notmatch '^[A-Za-z0-9_.@-]+$') { throw '请使用 SSH 主机别名或 user@hostname。端口和密钥请写入 SSH config。' }
if ($ApiDomain -notmatch '^[A-Za-z0-9][A-Za-z0-9.-]+[A-Za-z0-9]$') { throw '请填写已解析到服务器的后端域名，不包含协议、端口或路径。' }
foreach ($origin in ($FrontendOrigins -split ',')) {
  $parsed = [Uri]$origin
  if ($parsed.Scheme -notin @('https','http') -or $parsed.UserInfo -or $parsed.Query -or $parsed.Fragment -or $parsed.AbsolutePath -ne '/' -or $origin -match '[\r\n]' -or $origin.TrimEnd('/') -ne $parsed.GetLeftPart([UriPartial]::Authority)) { throw '前端来源必须是明确的 http(s) origin。' }
}
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$privateFolder = Join-Path $projectRoot 'local-private'
$artifactFolder = Join-Path $projectRoot 'artifacts'
New-Item -ItemType Directory -Path $privateFolder,$artifactFolder -Force | Out-Null
$configFile = Join-Path $privateFolder 'remote-rule-tests.env'
$keyFile = Join-Path $privateFolder 'remote-rule-tests-key.txt'
if (Test-Path -LiteralPath $configFile) {
  $previous = Get-Content -LiteralPath $configFile
  if ($previous -notcontains "API_DOMAIN=$ApiDomain") { throw '已有另一台测试服务器的配置。请先保存旧配置，再为新服务器准备独立配置文件。' }
  $testKey = (($previous | Where-Object { $_ -like 'TEST_API_KEY=*' }) -split '=',2)[1]
  if (!$testKey -or $testKey.Length -lt 32) { throw '已有配置缺少有效测试密钥。请检查本机配置文件。' }
  ($previous | ForEach-Object { if ($_ -like 'FRONTEND_ORIGINS=*') { "FRONTEND_ORIGINS=$FrontendOrigins" } else { $_ } }) | Set-Content -LiteralPath $configFile -Encoding utf8
} else {
  $databasePassword = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
  $testKey = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
  @("API_DOMAIN=$ApiDomain", "FRONTEND_ORIGINS=$FrontendOrigins", "POSTGRES_PASSWORD=$databasePassword", "TEST_API_KEY=$testKey") | Set-Content -LiteralPath $configFile -Encoding utf8
}
$testKey | Set-Content -LiteralPath $keyFile -Encoding utf8
$currentConfig = Get-Content -LiteralPath $configFile
if (!($currentConfig | Where-Object { $_ -like 'GAME_ADMIN_KEY=*' })) {
  $gameKey = [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
  "GAME_ADMIN_KEY=$gameKey" | Add-Content -LiteralPath $configFile -Encoding utf8
}
if (!($currentConfig | Where-Object { $_ -like 'TEST_API_ENABLED=*' })) { 'TEST_API_ENABLED=false' | Add-Content -LiteralPath $configFile -Encoding utf8 }
& ssh -o BatchMode=yes $SshHost 'docker compose version'
if ($LASTEXITCODE -ne 0) { throw 'SSH 登录或 Docker Compose 检查失败。请先配置 SSH 和服务器 Docker；脚本不会跳过主机指纹验证。' }
$archive = Join-Path $artifactFolder 'hrgos-test-backend.tar.gz'
& tar -czf $archive --exclude=deploy/.env -C $projectRoot server deploy src public package.json package-lock.json index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts
if ($LASTEXITCODE -ne 0) { throw '后端打包失败。' }
& ssh -o BatchMode=yes $SshHost 'mkdir -p "$HOME/hrgos-test-backend/deploy"'
if ($LASTEXITCODE -ne 0) { throw '服务器目录创建失败。' }
& scp $archive "${SshHost}:hrgos-test-backend/hrgos-test-backend.tar.gz"
if ($LASTEXITCODE -ne 0) { throw '后端包上传失败。' }
& scp $configFile "${SshHost}:hrgos-test-backend/deploy/.env"
if ($LASTEXITCODE -ne 0) { throw '服务器配置上传失败。' }
& ssh -o BatchMode=yes $SshHost 'cd "$HOME/hrgos-test-backend" && tar -xzf hrgos-test-backend.tar.gz && chmod 600 deploy/.env && docker compose --env-file deploy/.env -f deploy/compose.yml up -d --build --wait'
if ($LASTEXITCODE -ne 0) { throw '服务器启动失败。配置和数据库卷已保留，修复后可重试。' }
Write-Output "后端部署地址：https://$ApiDomain"
Write-Output "测试访问密钥已保存在本机：$keyFile"
Write-Output '数据库没有开放公网端口。请在测试页面填写后端地址和密钥，再执行一键联调。'
