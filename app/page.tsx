'use client';

import { useState, useEffect } from 'react';

type Level = 'serious' | 'normal' | 'light' | 'joke';

interface Zone {
  id: string;
  name: string;
  color: string;
  weight: number;
  gradient: string;
  level?: Level;
}

interface HistoryItem {
  id: string;
  scenarioId: number;
  scenarioText: string;
  level: Level;
  excuse: string;
  timestamp: number;
  aiComment?: string;
  zone?: string;
}

export default function Home() {
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [generatedExcuse, setGeneratedExcuse] = useState<string>('');
  const [aiComment, setAiComment] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const scenarios = [
    {
      category: '学校',
      emoji: '🏫',
      color: 'bg-pink-100 hover:bg-pink-200',
      items: [
        { id: 1, text: '遅刻した - 先生に何て言おう...' },
        { id: 2, text: '宿題やってない - 明日提出なのに...' },
        { id: 3, text: '授業サボった - 欠席連絡が必要...' },
      ],
    },
    {
      category: '友達',
      emoji: '👥',
      color: 'bg-blue-100 hover:bg-blue-200',
      items: [
        { id: 4, text: '遊びの誘い断りたい - でも角立てたくない...' },
        { id: 5, text: 'LINE返信遅れた - 既読ついてるのに...' },
        { id: 6, text: '約束ドタキャン - 今から行けない...' },
      ],
    },
    {
      category: '恋愛',
      emoji: '💕',
      color: 'bg-rose-100 hover:bg-rose-200',
      items: [
        { id: 7, text: 'デート断りたい - でも嫌われたくない...' },
        { id: 8, text: '告白の返事保留 - もう少し考えたい...' },
      ],
    },
    {
      category: 'バイト',
      emoji: '💼',
      color: 'bg-yellow-100 hover:bg-yellow-200',
      items: [
        { id: 9, text: 'バイト辞めたい - 店長に伝えなきゃ...' },
        { id: 10, text: '急に休みたい - 当日だけど無理...' },
      ],
    },
  ];

  const zones: Zone[] = [
    {
      id: 'serious',
      name: '真面目ゾーン',
      color: '#10b981',
      weight: 25,
      gradient: 'from-green-400 to-green-600',
      level: 'serious',
    },
    {
      id: 'normal',
      name: '普通ゾーン',
      color: '#3b82f6',
      weight: 25,
      gradient: 'from-blue-400 to-blue-600',
      level: 'normal',
    },
    {
      id: 'light',
      name: 'ちょいふざけゾーン',
      color: '#f97316',
      weight: 25,
      gradient: 'from-orange-400 to-orange-600',
      level: 'light',
    },
    {
      id: 'joke',
      name: '完全ネタゾーン',
      color: '#ef4444',
      weight: 25,
      gradient: 'from-red-400 to-red-600',
      level: 'joke',
    },
    {
      id: 'ultra-serious',
      name: '超真面目ゾーン',
      color: '#fbbf24',
      weight: 2,
      gradient: 'from-yellow-300 to-yellow-500',
      level: 'serious',
    },
    {
      id: 'legendary',
      name: '伝説ゾーン',
      color: '#a855f7',
      weight: 3,
      gradient: 'from-purple-400 via-pink-400 to-purple-600',
      level: 'joke',
    },
  ];

  // ローカルストレージから履歴を読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem('excuseHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // 履歴をローカルストレージに保存
  const saveHistory = (newItem: HistoryItem) => {
    const updatedHistory = [newItem, ...history].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem('excuseHistory', JSON.stringify(updatedHistory));
  };

  // ルーレット: 重み付きランダム抽選
  const selectZoneByWeight = (): Zone => {
    const totalWeight = zones.reduce((sum, zone) => sum + zone.weight, 0);
    let random = Math.random() * totalWeight;

    for (const zone of zones) {
      random -= zone.weight;
      if (random <= 0) {
        return zone;
      }
    }
    return zones[0]; // フォールバック
  };

  // ルーレットを回す
  const spinRoulette = async (scenarioId: number) => {
    console.log('spinRoulette called with scenarioId:', scenarioId);
    if (isSpinning) {
      console.log('Already spinning, returning');
      return;
    }

    console.log('Starting roulette spin');
    setIsSpinning(true);
    setSelectedScenario(scenarioId);
    setGeneratedExcuse('');
    setAiComment('');

    // ゾーンを抽選
    const zone = selectZoneByWeight();
    console.log('Selected zone:', zone);
    setSelectedZone(zone);

    // 選択されたゾーンの角度範囲を計算
    const totalWeight = zones.reduce((sum, z) => sum + z.weight, 0);
    const zoneIndex = zones.findIndex((z) => z.id === zone.id);

    // 選択されたゾーンの開始角度と範囲を計算
    const startAngle = zones
      .slice(0, zoneIndex)
      .reduce((sum, z) => sum + (z.weight / totalWeight) * 360, 0);
    const sweepAngle = (zone.weight / totalWeight) * 360;

    // ゾーンの中央角度
    const zoneMidAngle = startAngle + sweepAngle / 2;

    console.log('=== ROULETTE DEBUG ===');
    console.log('Selected Zone:', zone.name, 'ID:', zone.id, 'Index:', zoneIndex);
    console.log('Start angle:', startAngle, 'Sweep:', sweepAngle, 'Mid:', zoneMidAngle);

    // 回転をリセットしてから新しい回転を開始
    setRotation(0);

    // 少し待ってからアニメーション開始（状態が確実に更新されるように）
    await new Promise((resolve) => setTimeout(resolve, 50));

    // rotation = 0 のとき、最初のゾーンの開始位置が12時（針の位置）にある
    // 選択されたゾーンの中央を12時に持ってくるには、-zoneMidAngle度回転

    const baseSpins = Math.floor(5 + Math.random() * 4); // 5, 6, 7, 8回転（整数）

    // 少しランダム性を加えて、ゾーンの中央ではなく範囲内のランダムな位置に止める
    const randomOffset = (Math.random() - 0.5) * sweepAngle * 0.6; // ゾーンの幅の±30%以内
    const targetAngle = zoneMidAngle + randomOffset;
    const finalRotation = baseSpins * 360 - targetAngle;

    console.log('=== FINAL CALCULATION ===');
    console.log('Base spins:', baseSpins, 'Target angle:', targetAngle.toFixed(2));
    console.log('Final rotation:', finalRotation.toFixed(2));
    console.log('Zone range:', startAngle.toFixed(2), '~', (startAngle + sweepAngle).toFixed(2));

    const needleAngle = (360 - (finalRotation % 360) + 360) % 360;
    console.log('Needle points to angle:', needleAngle.toFixed(2));
    console.log('Is in zone?', needleAngle >= startAngle && needleAngle <= startAngle + sweepAngle);

    setRotation(finalRotation);

    // アニメーション終了を待つ
    console.log('Waiting for animation to complete...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 言い訳を生成
    console.log('Generating excuse with roulette');
    await generateExcuseWithRoulette(scenarioId, zone);

    console.log('Roulette spin complete');
    setIsSpinning(false);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // ルーレットモード用の言い訳生成
  const generateExcuseWithRoulette = async (scenarioId: number, zone: Zone) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioId,
          level: zone.level,
          rouletteMode: true,
          zoneId: zone.id,
          zoneName: zone.name,
        }),
      });

      if (!response.ok) {
        throw new Error('生成に失敗しました');
      }

      const data = await response.json();
      setGeneratedExcuse(data.excuse);
      setAiComment(data.comment || '');

      // 履歴に追加
      const scenarioText = scenarios
        .flatMap((s) => s.items)
        .find((item) => item.id === scenarioId)?.text || '';

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        scenarioId,
        scenarioText,
        level: zone.level || 'normal',
        excuse: data.excuse,
        timestamp: Date.now(),
        aiComment: data.comment,
        zone: zone.name,
      };
      saveHistory(historyItem);
    } catch (error) {
      console.error('Error:', error);
      showToastMessage('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedExcuse) {
      navigator.clipboard.writeText(generatedExcuse);
      showToastMessage('コピーしました!');
    }
  };

  const handleRegenerate = () => {
    if (selectedScenario) {
      spinRoulette(selectedScenario);
    }
  };

  const handleReset = () => {
    setSelectedScenario(null);
    setGeneratedExcuse('');
    setAiComment('');
    setSelectedZone(null);
    setRotation(0);
  };

  const handleShareResult = () => {
    const url = window.location.href;
    const zoneName = selectedZone ? `【${selectedZone.name}】` : '';
    const text = `${zoneName}\n${generatedExcuse}\n\n🎰言い訳ルーレットで生成しました!\n${url}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleShareTool = () => {
    const url = window.location.href;
    const text = `🎰言い訳ルーレット使ってみた!\nルーレットを回して言い訳生成！AIツッコミ付き!\n${url}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank');
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setSelectedScenario(item.scenarioId);
    setSelectedLevel(item.level);
    setGeneratedExcuse(item.excuse);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎰 言い訳ルーレット
          </h1>
          <p className="text-lg text-gray-600">ルーレットで言い訳を決めよう！</p>
        </div>

        {!generatedExcuse ? (
          <>
            {/* ルーレット説明 */}
            <div className="mb-8 bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-700 mb-3">
                  ゾーン一覧
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  シチュエーションを選ぶとルーレットが回転！AIが毎回違う切れ味のツッコミを入れてくれます。
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <span className="font-bold">🟢 真面目</span>
                    <span className="text-gray-600"> (25%)</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <span className="font-bold">🔵 普通</span>
                    <span className="text-gray-600"> (25%)</span>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                    <span className="font-bold">🟠 ちょいふざけ</span>
                    <span className="text-gray-600"> (25%)</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <span className="font-bold">🔴 完全ネタ</span>
                    <span className="text-gray-600"> (25%)</span>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2">
                    <span className="font-bold">⭐ 超真面目</span>
                    <span className="text-gray-600"> (2%)</span>
                  </div>
                  <div className="bg-purple-50 border border-purple-300 rounded-lg p-2">
                    <span className="font-bold">💎 伝説</span>
                    <span className="text-gray-600"> (3%)</span>
                  </div>
                </div>
              </div>

            {/* シチュエーション選択セクション */}
            <div className="space-y-8">
              {scenarios.map((scenario) => (
                <div key={scenario.category} className="space-y-3">
                  <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                    <span className="text-2xl">{scenario.emoji}</span>
                    <span>{scenario.category}</span>
                  </h2>
                  <div className="space-y-2">
                    {scenario.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => spinRoulette(item.id)}
                        disabled={isLoading || isSpinning}
                        className={`w-full ${scenario.color} border-2 border-transparent hover:border-gray-300 transition-all duration-200 rounded-xl p-4 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">
                            {item.text}
                          </span>
                          <span className="text-2xl">🎲</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* 生成結果 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              {/* ルーレット結果ヘッダー */}
              {selectedZone && (
                <div
                  className={`mb-6 p-4 rounded-xl text-white text-center ${
                    selectedZone.id === 'ultra-serious' || selectedZone.id === 'legendary'
                      ? 'animate-pulse'
                      : ''
                  }`}
                  style={{
                    backgroundColor: selectedZone.color,
                  }}
                >
                  <div className="text-2xl font-bold mb-1">
                    {selectedZone.id === 'ultra-serious' && '✨✨ '}
                    {selectedZone.id === 'legendary' && '🎊 '}
                    {selectedZone.name}
                    {selectedZone.id === 'ultra-serious' && ' ✨✨'}
                    {selectedZone.id === 'legendary' && ' 🎊'}
                  </div>
                  {(selectedZone.id === 'ultra-serious' || selectedZone.id === 'legendary') && (
                    <div className="text-sm font-medium">
                      {selectedZone.id === 'ultra-serious' && '大当たり! 成功率99%の伝説級!'}
                      {selectedZone.id === 'legendary' && '伝説降臨! 歴史に残るレベル!'}
                    </div>
                  )}
                </div>
              )}

              <h2 className="text-xl font-bold text-gray-800 mb-4">
                生成された言い訳
              </h2>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {generatedExcuse}
                </p>
              </div>

              {/* AIツッコミ */}
              {aiComment && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 mb-6 border-2 border-blue-200">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">💬</span>
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-1">AIツッコミ:</p>
                      <p className="text-gray-800 leading-relaxed">{aiComment}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  <span>📋</span>
                  <span>コピー</span>
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  <span>🔄</span>
                  <span>再生成</span>
                </button>
              </div>

              {/* シェアボタン */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">シェア</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleShareResult}
                    className="bg-sky-400 hover:bg-sky-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    結果をシェア
                  </button>
                  <button
                    onClick={handleShareTool}
                    className="bg-purple-400 hover:bg-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    ツールを紹介
                  </button>
                </div>
              </div>

              {/* 戻るボタン */}
              <button
                onClick={handleReset}
                className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                別の言い訳を作る
              </button>
            </div>
          </div>
        )}

        {/* 生成履歴 */}
        {history.length > 0 && !generatedExcuse && (
          <div className="mt-10 bg-white rounded-2xl p-6 shadow-md">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-lg font-bold text-gray-700">
                過去の生成履歴 ({history.length}件)
              </h3>
              <span className="text-gray-500">
                {showHistory ? '▲' : '▼'}
              </span>
            </button>

            {showHistory && (
              <div className="mt-4 space-y-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors"
                  >
                    <p className="text-sm text-gray-600 mb-1">
                      {item.scenarioText}
                    </p>
                    <p className="text-gray-800 text-sm line-clamp-2">
                      {item.excuse}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* フッター */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>困った時の救世主</p>
        </div>

        {/* トースト通知 */}
        {showToast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg animate-fade-in-up">
            {toastMessage}
          </div>
        )}

        {/* ローディング中 / ルーレット回転中 */}
        {(isLoading || isSpinning) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center max-w-md">
              {isSpinning && !isLoading ? (
                <>
                  {/* ルーレット回転アニメーション */}
                  <div className="relative w-64 h-64 mb-6">
                    {/* ルーレット本体 */}
                    <svg
                      width="256"
                      height="256"
                      viewBox="0 0 256 256"
                      className="drop-shadow-2xl"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
                      }}
                    >
                      {zones.map((zone, index) => {
                        const totalWeight = zones.reduce((sum, z) => sum + z.weight, 0);
                        const startAngle = zones
                          .slice(0, index)
                          .reduce((sum, z) => sum + (z.weight / totalWeight) * 360, 0);
                        const sweepAngle = (zone.weight / totalWeight) * 360;

                        const startRad = (startAngle - 90) * (Math.PI / 180);
                        const endRad = (startAngle + sweepAngle - 90) * (Math.PI / 180);

                        const x1 = 128 + 128 * Math.cos(startRad);
                        const y1 = 128 + 128 * Math.sin(startRad);
                        const x2 = 128 + 128 * Math.cos(endRad);
                        const y2 = 128 + 128 * Math.sin(endRad);

                        const largeArcFlag = sweepAngle > 180 ? 1 : 0;

                        // テキストラベルの位置（各ゾーンの中央）
                        const midAngle = startAngle + sweepAngle / 2 - 90;
                        const midRad = midAngle * (Math.PI / 180);
                        const textRadius = 80; // テキストを配置する半径
                        const textX = 128 + textRadius * Math.cos(midRad);
                        const textY = 128 + textRadius * Math.sin(midRad);

                        return (
                          <g key={zone.id}>
                            {/* ゾーンのパス */}
                            <path
                              d={`M 128 128 L ${x1} ${y1} A 128 128 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                              fill={zone.color}
                              stroke="white"
                              strokeWidth="2"
                            />
                            {/* ゾーン名のテキスト */}
                            <text
                              x={textX}
                              y={textY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize={zone.id === 'ultra-serious' || zone.id === 'legendary' ? '10' : '12'}
                              fontWeight="bold"
                              style={{
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                paintOrder: 'stroke fill',
                                stroke: 'rgba(0,0,0,0.3)',
                                strokeWidth: '0.5px',
                              }}
                              transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                            >
                              {zone.name.replace('ゾーン', '')}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* 中央の固定された針（上向き） */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                      {/* 針の影 */}
                      <div className="relative">
                        {/* 三角形の針 */}
                        <div
                          className="w-0 h-0 relative"
                          style={{
                            borderLeft: '20px solid transparent',
                            borderRight: '20px solid transparent',
                            borderTop: '60px solid #dc2626',
                            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
                          }}
                        >
                          {/* 針の先端の円 */}
                          <div
                            className="absolute bg-red-600 rounded-full"
                            style={{
                              width: '16px',
                              height: '16px',
                              top: '-68px',
                              left: '-8px',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 中央の円（ルーレットの軸） */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                      <div className="w-8 h-8 bg-white rounded-full shadow-lg border-4 border-gray-300" />
                    </div>
                  </div>
                  <p className="text-gray-700 font-bold text-xl mb-2">🎰 回転中... 🎰</p>
                  <p className="text-gray-500 text-sm">どのゾーンに止まるかな?</p>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                  <p className="text-gray-700 font-medium">言い訳を生成中...</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
