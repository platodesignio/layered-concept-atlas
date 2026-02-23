export default function VerifyPage() {
  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-xl font-bold mb-2">メールを確認してください</h1>
      <p className="text-sm text-gray-500">
        メールアドレスにマジックリンクを送信しました。リンクをクリックしてログインを完了してください。
        リンクは10分間有効です。
      </p>
    </div>
  );
}
