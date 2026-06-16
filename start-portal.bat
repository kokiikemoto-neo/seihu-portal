@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   Seihu Portal 開発サーバ起動
echo ========================================
echo.

REM 依存が未インストールなら自動インストール
if not exist node_modules (
  echo [初回セットアップ] 依存パッケージをインストール中... 少々お待ちください
  call npm install
  echo.
)

echo ブラウザを自動で開きます（表示されない場合は手動で http://localhost:3000/ ）
echo 終了するにはこのウィンドウで Ctrl + C を押してください
echo.

REM サーバ起動直後にブラウザを開く（まだ起動中なら数秒後に再読み込みしてください）
start "" http://localhost:3000/

call npm run dev
