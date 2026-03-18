# 犬・猫画像判定＆履歴表示アプリ

## アプリ概要
このアプリは、アップロードされた犬・猫の画像を分類し、分類結果と棒グラフを表示するのと同じく分類履歴を表示できるWebアプリケーションです。  

---

### 2. 仮想環境の作成とライブラリインストール

# 仮想環境の作成
python -m venv venv

# 仮想環境をアクティベート
.\venv\Scripts\activate   # Windowsの場合

# Linux/macOSの場合
source venv/bin/activate

# ライブラリのインストール
pip install -r requirements.txt

### 3. APIサーバーの起動方法

uvicorn main:app --reload

起動後、以下のURLでAPIにアクセスできます：

http://127.0.0.1:8000