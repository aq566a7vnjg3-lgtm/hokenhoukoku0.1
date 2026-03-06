保険報告アイコンセット

収録ファイル
- favicon.ico
- icon-16.png ～ icon-1024.png
- site.webmanifest

Apps Script / Webアプリでの実装例（Index.html の <head> 内）

<link rel="icon" type="image/x-icon" href="YOUR_ICON_BASE_URL/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="YOUR_ICON_BASE_URL/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="YOUR_ICON_BASE_URL/icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="YOUR_ICON_BASE_URL/icon-180.png">
<link rel="manifest" href="YOUR_ICON_BASE_URL/site.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="保険報告">
<meta name="theme-color" content="#1f6feb">

おすすめ
- iPhone / iPad のホーム画面ショートカット: icon-180.png
- Android / PWA: icon-192.png, icon-512.png
- 通常のブラウザタブ: favicon.ico または icon-32.png

注意
- YOUR_ICON_BASE_URL は HTTPS で外部公開されたURLに置き換えてください。
- Apps Script 内に画像ファイルを直接置くのではなく、GitHub Pages などに配置して参照するのが安定します。
