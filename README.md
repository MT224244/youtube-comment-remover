# YouTube Comment Remover

YouTubeのコメント欄にいる変な奴を消し飛ばす

![image](https://github.com/user-attachments/assets/5d53027b-0e94-4b22-bfc9-6c120eeecaed)

## セットアップ

DriveにGoogleAppsScriptを作成して、スクリプトIDを控える。

```
$ bun i
$ bun run clasp:login
$ bun run clasp:clone {控えたスクリプトID}
$ bun run build
$ bun run deploy
```

初回のみ、スクリプトのページでmanual系の関数を実行して認証を通す必要がある。

---

自分用に作ったものであるため、動作は保証しないし、サポートもしない。  
利用はあくまで自己責任で。
