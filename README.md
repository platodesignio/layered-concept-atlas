# Plato Network

STPF CYCLE（Structure Analysis → Theory Node → Paper → Field Implementation）が因果リンクで接続された自走型研究ネットワーク。

## 依存バージョン固定の理由

| パッケージ | バージョン | 理由 |
|---|---|---|
| next | 14.2.4 | App Router 安定版。15系はまだ unstable warnings あり |
| next-auth | 5.0.0-beta.19 | Auth.js v5。Prisma Adapter と beta.19 以降が安定 |
| prisma / @prisma/client | 5.14.0 | 最新安定版。Unsupported("tsvector") サポート確認済み |
| wagmi | 2.10.5 | Viem v2 対応の安定版 |
| siwe | 2.3.2 | EIP-4361 実装。viem/siwe と組み合わせて使用 |
| pdf-lib | 1.17.1 | 純粋 JS 実装。Vercel サーバーレス環境で動作確認済み |
| ably | 2.1.0 | Pusher の代替 Realtime プロバイダー |
| pusher | 5.2.0 | 安定版。Vercel サーバーレス動作確認済み |
| stripe | 15.12.0 | apiVersion 2024-06-20 対応 |

## セットアップ

```bash
# 1. 依存インストール
npm install --legacy-peer-deps

# 2. 環境変数設定
cp .env.example .env.local
# .env.local を編集して全必須値を設定

# 3. Prisma クライアント生成
npx prisma generate

# 4. DB マイグレーション（本番 Postgres を対象にして実行）
npx prisma migrate deploy

# 5. シード（任意 — 管理者ユーザーを作成）
npx tsx prisma/seed.ts

# 6. 開発サーバー起動
npm run dev
```

## 環境変数

| 変数名 | 説明 | 必須 |
|---|---|---|
| DATABASE_URL | PostgreSQL 接続文字列 | ✓ |
| AUTH_SECRET | NextAuth 署名鍵 (openssl rand -base64 32) | ✓ |
| AUTH_URL | アプリURL (本番: https://...) | ✓ |
| RESEND_API_KEY | Resend API キー | ✓ |
| EMAIL_FROM | 送信元メールアドレス | ✓ |
| STRIPE_SECRET_KEY | Stripe 秘密鍵 | ✓ |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook 署名シークレット | ✓ |
| STRIPE_PRICE_ID_MEMBERSHIP | ネットワーク会費の Price ID | ✓ |
| NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID | WalletConnect Project ID | ✓ |
| NEXT_PUBLIC_DEFAULT_CHAIN_ID | 8453 (Base mainnet 固定) | ✓ |
| NEXT_PUBLIC_APP_NAME | アプリ表示名 | ✓ |
| NEXT_PUBLIC_APP_DOMAIN | SIWE ドメイン検証用 | ✓ |
| ADMIN_EMAIL_BOOTSTRAP | 初回 NETWORK_ADMIN メール | ✓ |
| DM_ENCRYPTION_KEY | DM 暗号化鍵 (base64 32bytes) | ✓ |
| REALTIME_PROVIDER | pusher / ably / (未設定=SSE) | - |
| REALTIME_APP_ID | Pusher App ID | Pusher使用時 |
| REALTIME_KEY | Pusher/Ably キー | Realtime使用時 |
| REALTIME_SECRET | Pusher Secret / Ably API Key | Realtime使用時 |
| REALTIME_CLUSTER | Pusher クラスター (例: ap3) | Pusher使用時 |
| NEXT_PUBLIC_REALTIME_KEY | クライアント側リアルタイムキー | Realtime使用時 |

## DM 暗号化鍵の生成とローテーション

```bash
# 鍵生成
openssl rand -base64 32
```

**ローテーション方針:**
1. 新旧両鍵を ENV に保持（DM_ENCRYPTION_KEY_OLD / DM_ENCRYPTION_KEY）
2. `scripts/rotate-dm-key.ts` を実行して全 DM を再暗号化
3. 完了後に OLD キーを ENV から削除
4. E2EE は初期リリース非対象。後日クライアント鍵交換方式へ移行予定

## Stripe 設定

1. Stripe ダッシュボードでサブスクリプション商品を作成
2. Price ID を `STRIPE_PRICE_ID_MEMBERSHIP` に設定
3. Webhook エンドポイント `POST /api/stripe/webhook` を登録
4. ローカルテスト: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Resend 設定

1. Resend でドメイン検証を実施
2. API キーを発行して `RESEND_API_KEY` に設定
3. `EMAIL_FROM` に検証済みドメインのアドレスを設定

## WalletConnect 設定

1. https://cloud.walletconnect.com でプロジェクト作成
2. Project ID を `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` に設定
3. 本番 URL をプロジェクトの許可オリジンに追加

## Realtime 設定

**Pusher の場合:**
- https://pusher.com でアカウント作成
- Channels App を作成し、App ID / Key / Secret / Cluster を取得
- `REALTIME_PROVIDER=pusher` を設定

**Ably の場合:**
- https://ably.com でアカウント作成
- API キーを取得して `REALTIME_SECRET` に設定
- `NEXT_PUBLIC_REALTIME_KEY` にパブリックキーを設定
- `REALTIME_PROVIDER=ably` を設定

**障害時 fallback:**
- REALTIME_PROVIDER 未設定の場合、SSE (`/api/realtime/sse`) が自動的に有効化される
- SSE は 15 秒間隔のポーリングで未読数のみ更新する。メッセージのリアルタイム配信は Pusher/Ably を要する

## Vercel デプロイ手順

```bash
# 1. Vercel CLI インストール
npm i -g vercel

# 2. プロジェクト接続
vercel link

# 3. ENV 設定 (Vercel ダッシュボードまたは CLI)
vercel env add DATABASE_URL

# 4. デプロイ
vercel --prod

# 5. Stripe Webhook URL 更新
# https://your-domain.vercel.app/api/stripe/webhook
```

## マイグレーション

```bash
# ローカル開発用 (migration ファイルを生成)
npx prisma migrate dev --name "init"

# 本番デプロイ時 (生成済みマイグレーションを適用)
npx prisma migrate deploy
```

## テスト実行

```bash
npm test
```

**失敗ケースと対処:**
- `DM_ENCRYPTION_KEY is not set` — jest.setup に環境変数を追加するか、テスト内で直接設定する
- Prisma client not found — `npx prisma generate` を先に実行する
- TypeScript error in tests — `tsconfig.test.json` の `module: "commonjs"` を確認する

## 運用手順

- 監査ログは追記専用。DB 直接 DELETE は禁止（アプリ層での削除 API は存在しない）
- NETWORK_ADMIN は `ADMIN_EMAIL_BOOTSTRAP` 経由で初回サインイン時に自動昇格
- 凍結操作は `/admin/users` から実施し、理由入力が必須
- DM 通報処理時の閲覧は `/admin/flags/[id]/dm` から実施し、閲覧理由が監査ログに記録される

## 障害時対処

| 障害 | 対処 |
|---|---|
| Stripe Webhook 未受信 | `stripe listen --forward-to ...` でローカル検証。BillingEvent テーブルで処理状況確認 |
| SIWE 検証失敗 | ドメイン・chainId・ノンス期限を確認。SiweNonce テーブルのステータス確認 |
| DM 復号エラー | DM_ENCRYPTION_KEY が変更されていないか確認。ローテーション手順を実施 |
| Realtime 接続失敗 | SSE fallback が自動起動。REALTIME_PROVIDER を未設定にすれば SSE 専用モードで動作 |
| DB 接続エラー | DATABASE_URL のSSL設定確認。Vercel Postgres では `?sslmode=require` が必要 |
