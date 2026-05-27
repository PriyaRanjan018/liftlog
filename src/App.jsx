import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Today from './pages/Today';
import History from './pages/History';
import Progress from './pages/Progress';
import Stats from './pages/Stats';

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-lg mx-auto relative min-h-screen bg-[#0a0a0a]">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
