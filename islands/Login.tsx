// islands/Login.tsx
export function Login() {
  const handleGoogleLogin = () => {
    globalThis.location.href = "/api/auth/login";
  };

  return (
    <div class="mt-60 text-center">
      <button
        class="p-4 border border-gray-100 rounded-md bg-blue-500 text-white hover:bg-blue-600 shadow font-bold"
        onClick={handleGoogleLogin}
      >
        Googleでログイン
      </button>
    </div>
  );
}
