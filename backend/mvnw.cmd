@echo off
setlocal

set "BASE_DIR=%~dp0"
set "MAVEN_VERSION=3.9.9"
set "MAVEN_HOME=%BASE_DIR%\.mvn\apache-maven-%MAVEN_VERSION%"
set "MAVEN_BIN=%MAVEN_HOME%\bin\mvn.cmd"
set "MAVEN_ZIP=%BASE_DIR%\.mvn\apache-maven-%MAVEN_VERSION%-bin.zip"
set "MAVEN_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip"

if not exist "%MAVEN_BIN%" (
  echo Maven %MAVEN_VERSION% not found. Downloading...
  if not exist "%BASE_DIR%\.mvn" mkdir "%BASE_DIR%\.mvn"
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ProgressPreference='SilentlyContinue';" ^
    "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;" ^
    "Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_ZIP%';" ^
    "Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%BASE_DIR%\.mvn' -Force"
  if errorlevel 1 (
    echo Failed to download Maven wrapper runtime.
    exit /b 1
  )
)

if "%JAVA_HOME%"=="" (
  echo JAVA_HOME is not set. Please configure JDK 17 in IntelliJ and system environment.
  exit /b 1
)

call "%MAVEN_BIN%" %*
exit /b %ERRORLEVEL%
