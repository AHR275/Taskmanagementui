export default function LoadingScreen({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
        <p className="text-sm text-gray-700">Loading...</p>
      </div>
    </div>
  );
}
