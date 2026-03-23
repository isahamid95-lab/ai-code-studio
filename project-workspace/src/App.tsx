import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
        <header className="flex flex-col items-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
            Modern Web Sitesi
          </h1>
          <p className="text-lg text-gray-600 max-w-md text-center">
            TailwindCSS ve React ile oluşturulmuş modern, duyarlı tasarım
          </p>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Responsive Tasarım</h2>
            <p className="text-gray-600">
              Tüm cihaz boyutlarında mükemmel görünümlü ve çalışır.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Modern Arayüz</h2>
            <p className="text-gray-600">
              Glassmorphism efektleri ve yumuşak gölgelerle şık bir tasarım.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Performanslı</h2>
            <p className="text-gray-600">
              Hızlı yükleme ve sorunsuz kullanıcı deneyimi.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Kolay Kullanım</h2>
            <p className="text-gray-600">
              Basit arayüz ile kolay navigasyon ve kullanım.
            </p>
          </div>
        </main>

        <div className="text-center">
          <div className="inline-flex items-center gap-4 bg-gray-100 px-6 py-3 rounded-full">
            <span className="text-gray-700">Buton Sayacı:</span>
            <button
              onClick={() => setCount((count) => count + 1)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-2 rounded-full hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              {count}
            </button>
          </div>
        </div>
      </div>
      
      <footer className="mt-12 text-center text-gray-500">
        <p>© 2025 Modern Web Sitesi. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}

export default App;