/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dice5, Trophy, Timer, AlertCircle, CheckCircle2, PartyPopper, RefreshCw, Users, Flag, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';

type RoundStatus = 1 | 2 | 3 | 'finished';

interface GroupState {
  id: number;
  name: string;
  round: RoundStatus;
  inputValue: string;
  feedback: { type: 'success' | 'error' | null, message: string };
  isShaking: boolean;
  finishTime?: number;
  color: string;
}

const SOUNDS = {
  start: 'https://assets.mixkit.co/active_storage/sfx/1003/1003-preview.mp3',
  correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2959/2959-preview.mp3',
  victory: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
};

export default function App() {
  const [groups, setGroups] = useState<GroupState[]>([
    { id: 1, name: "Nhóm 1", round: 1, inputValue: '', feedback: { type: null, message: '' }, isShaking: false, color: '#FF4500' },
    { id: 2, name: "Nhóm 2", round: 1, inputValue: '', feedback: { type: null, message: '' }, isShaking: false, color: '#1E90FF' },
    { id: 3, name: "Nhóm 3", round: 1, inputValue: '', feedback: { type: null, message: '' }, isShaking: false, color: '#32CD32' },
    { id: 4, name: "Nhóm 4", round: 1, inputValue: '', feedback: { type: null, message: '' }, isShaking: false, color: '#FFD700' },
  ]);

  const [timeLeft, setTimeLeft] = useState(180);
  const [isStarted, setIsStarted] = useState(false);
  const [winners, setWinners] = useState<GroupState[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const playSound = (soundKey: keyof typeof SOUNDS) => {
    if (isMuted) return;
    const audio = new Audio(SOUNDS[soundKey]);
    audio.play().catch(e => console.log("Audio play blocked", e));
  };

  const rounds = {
    1: { question: "Tổng số chấm bằng 4?", answer: "3", successMsg: "Lên trình! 🔥" },
    2: { question: "Tổng số chấm bằng 13?", answer: "0", successMsg: "Biến cố không thể! 😹" },
    3: { question: "Hơn kém nhau 3 chấm?", answer: "6", successMsg: "PHÁ ĐẢO! 🌟" }
  };

  useEffect(() => {
    if (isStarted && timeLeft > 0 && winners.length < 4) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 || winners.length === 4) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (winners.length === 4) playSound('victory');
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isStarted, timeLeft, winners]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsStarted(true);
    playSound('start');
  };

  const handleAnswer = (groupId: number, e: React.FormEvent) => {
    e.preventDefault();
    const group = groups.find(g => g.id === groupId);
    if (!group || group.round === 'finished') return;

    const currentRoundData = rounds[group.round as 1 | 2 | 3];
    const input = group.inputValue.trim().toLowerCase();
    
    const isCorrect = group.round === 2 
      ? (input === "0" || input === "không thể")
      : input === currentRoundData.answer;

    if (isCorrect) {
      playSound('correct');
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { x: groupId * 0.2, y: 0.7 },
        colors: [group.color]
      });

      const nextRound = group.round === 3 ? 'finished' : (group.round + 1) as RoundStatus;
      
      setGroups(prev => prev.map(g => {
        if (g.id === groupId) {
          const updated = { 
            ...g, 
            round: nextRound, 
            inputValue: '', 
            feedback: { type: 'success' as const, message: currentRoundData.successMsg } 
          };
          if (nextRound === 'finished') {
            updated.finishTime = 180 - timeLeft;
            setWinners(prevW => [...prevW, updated]);
          }
          return updated;
        }
        return g;
      }));

      setTimeout(() => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, feedback: { type: null, message: '' } } : g));
      }, 2000);
    } else {
      playSound('error');
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isShaking: true, feedback: { type: 'error', message: "Sai rồi!" } } : g));
      setTimeout(() => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isShaking: false } : g));
      }, 500);
    }
  };

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-orange-400 to-purple-600">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white p-10 rounded-3xl pixel-border text-center max-w-lg">
          <Users className="w-20 h-20 text-blue-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4 text-blue-600">ĐẠI CHIẾN 4 NHÓM 🎲</h1>
          <p className="text-gray-600 mb-8 text-lg">Chia lớp thành 4 nhóm. Nhóm nào giải xong 3 bài toán xác suất nhanh nhất sẽ giành Cúp Vàng!</p>
          <button onClick={handleStart} className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-2xl pixel-border hover:scale-105 transition-transform">
            BẮT ĐẦU CUỘC ĐUA!
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col gap-4">
      {/* Race Track Visualization */}
      <div className="bg-white/90 p-4 rounded-2xl pixel-border shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          <Flag className="text-red-500" />
          <div className="flex-grow h-2 bg-gray-200 rounded-full relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center pixel-border">🏁</div>
            {groups.map((g) => (
              <motion.div
                key={g.id}
                className="absolute top-1/2 -translate-y-1/2 text-3xl"
                animate={{ 
                  left: g.round === 'finished' ? '95%' : `${((g.round as number - 1) / 3) * 95}%` 
                }}
                transition={{ type: 'spring', stiffness: 50 }}
              >
                <div style={{ color: g.color }} className="filter drop-shadow-md">🎲</div>
                <div className="text-[10px] font-bold text-center uppercase" style={{ color: g.color }}>{g.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-blue-600">
              <Timer className={timeLeft < 30 ? 'animate-pulse text-red-500' : ''} />
              <span className={timeLeft < 30 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              {isMuted ? <VolumeX className="text-gray-400" /> : <Volume2 className="text-blue-500" />}
            </button>
          </div>
          <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Đường đua xác suất</div>
        </div>
      </div>

      {/* 4 Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
        {groups.map((group) => (
          <motion.div
            key={group.id}
            className={`bg-white p-4 rounded-2xl pixel-border flex flex-col relative overflow-hidden ${
              group.round === 'finished' ? 'opacity-75 grayscale-[0.5]' : ''
            }`}
          >
            {group.round === 'finished' && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-10">
                <div className="bg-white p-4 rounded-2xl pixel-border rotate-12">
                  <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
                  <div className="font-bold text-xl">HẠNG {winners.findIndex(w => w.id === group.id) + 1}</div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold" style={{ color: group.color }}>{group.name}</h3>
              <div className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">VÒNG {group.round === 'finished' ? 3 : group.round}/3</div>
            </div>

            {group.round !== 'finished' ? (
              <>
                <div className="bg-blue-50 p-3 rounded-xl mb-4 min-h-[80px] flex items-center justify-center text-center">
                  <p className="text-lg font-medium text-gray-700">{rounds[group.round as 1 | 2 | 3].question}</p>
                </div>

                <form onSubmit={(e) => handleAnswer(group.id, e)} className="mt-auto">
                  <input
                    type="text"
                    value={group.inputValue}
                    onChange={(e) => setGroups(prev => prev.map(g => g.id === group.id ? { ...g, inputValue: e.target.value } : g))}
                    placeholder="Số?"
                    className={`w-full text-center text-2xl font-bold py-2 rounded-xl border-2 mb-2 focus:outline-none ${
                      group.isShaking ? 'border-red-500 shake' : 'border-gray-200 focus:border-blue-400'
                    }`}
                  />
                  <button 
                    type="submit"
                    className="w-full py-2 rounded-xl font-bold text-white pixel-border transition-transform active:scale-95"
                    style={{ backgroundColor: group.color }}
                  >
                    GỬI 🎲
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-2" />
                <p className="font-bold text-green-600">HOÀN THÀNH!</p>
                <p className="text-sm text-gray-500">Thời gian: {group.finishTime}s</p>
              </div>
            )}

            {group.feedback.type && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`absolute bottom-2 left-2 right-2 p-2 rounded-lg text-xs text-center font-bold ${
                  group.feedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {group.feedback.message}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Final Results Overlay */}
      {winners.length === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl pixel-border max-w-md w-full text-center">
            <PartyPopper className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-6">KẾT QUẢ CHUNG CUỘC</h2>
            <div className="space-y-4 mb-8">
              {winners.map((w, i) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border-2" style={{ borderColor: w.color }}>
                  <span className="text-2xl font-bold">#{i + 1}</span>
                  <span className="font-bold text-xl" style={{ color: w.color }}>{w.name}</span>
                  <span className="text-gray-500 font-mono">{w.finishTime}s</span>
                </div>
              ))}
            </div>
            <button onClick={() => location.reload()} className="w-full bg-blue-500 text-white font-bold py-4 rounded-xl pixel-border">
              CHƠI VÁN MỚI
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
