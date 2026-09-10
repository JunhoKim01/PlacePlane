import React, { useState, useRef, useEffect } from 'react';
import { Plus, RotateCw, Trash2, Upload, Move, Info, Copy, Download, UploadCloud, Share2, X, Crosshair, Camera, Save } from 'lucide-react';

export default function App() {
  const [bgImage, setBgImage] = useState(null);
  const [realWidthMm, setRealWidthMm] = useState(12000); // 전체 이미지 너비 (mm)
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', w: 2000, h: 1500 });
  const [draggingItem, setDraggingItem] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [unit, setUnit] = useState('cm'); 
  const [systemMessage, setSystemMessage] = useState(null);
  const [shareCode, setShareCode] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // 캡처(스크린샷) 전용 상태
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [captureDataUrl, setCaptureDataUrl] = useState(null);
  const [captureFilename, setCaptureFilename] = useState('');

  // 프리셋 시스템 전용 상태 (최대 3개 슬롯)
  const [presets, setPresets] = useState({ 1: null, 2: null, 3: null });

  // 캘리브레이션(비율 보정) 전용 상태
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibPoints, setCalibPoints] = useState([]); // [{x, y}] % 기반 저장
  const [calibInput, setCalibInput] = useState('');

  const containerRef = useRef(null);

  // 로컬 스토리지 데이터 로드 (마운트 시 현재 세션 및 프리셋 모두 로드)
  useEffect(() => {
    const savedItems = localStorage.getItem('furniture-sim-items');
    const savedWidth = localStorage.getItem('furniture-sim-width');
    const savedUnit = localStorage.getItem('furniture-sim-unit');
    const savedPresets = localStorage.getItem('furniture-sim-presets');

    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedWidth) setRealWidthMm(Number(savedWidth));
    if (savedUnit) setUnit(savedUnit);
    if (savedPresets) setPresets(JSON.parse(savedPresets));
  }, []);

  // 가구 항목 및 환경 변수 동기화 저장
  useEffect(() => {
    localStorage.setItem('furniture-sim-items', JSON.stringify(items));
    localStorage.setItem('furniture-sim-width', realWidthMm.toString());
    localStorage.setItem('furniture-sim-unit', unit);
  }, [items, realWidthMm, unit]);

  // 프리셋 상태 변경 시 동기화 저장
  useEffect(() => {
    localStorage.setItem('furniture-sim-presets', JSON.stringify(presets));
  }, [presets]);

  // 반응형 컨테이너 크기 추적 (창 크기 조절 시 스케일 동적 업데이트용)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [bgImage]);

  // 전역 드래그 핸들러
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!draggingItem || !containerRef.current || isCalibrating) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      let newX = ((e.clientX - rect.left) / rect.width) * 100;
      let newY = ((e.clientY - rect.top) / rect.height) * 100;
      
      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      setItems(prev => prev.map(item => 
        item.id === draggingItem ? { ...item, x: newX, y: newY } : item
      ));
    };

    const handlePointerUp = () => setDraggingItem(null);

    if (draggingItem) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingItem, isCalibrating]);

  // 키보드 미세 조정(Micro-adjustment) 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 선택된 가구가 없거나, 캘리브레이션 중이거나, 입력창(Input)에서 타이핑 중일 경우 이벤트 무시 (충돌 방지)
      if (!selectedItem || isCalibrating || e.target.tagName.toLowerCase() === 'input') return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // 브라우저 스크롤 방지

        // 기본 0.1% 단위 미세 조정, Shift 키 누를 경우 1% 단위(10배속) 이동
        const step = e.shiftKey ? 1 : 0.1; 

        setItems(prevItems => prevItems.map(item => {
          if (item.id !== selectedItem) return item;
          
          let newX = item.x;
          let newY = item.y;
          
          if (e.key === 'ArrowUp') newY -= step;
          if (e.key === 'ArrowDown') newY += step;
          if (e.key === 'ArrowLeft') newX -= step;
          if (e.key === 'ArrowRight') newX += step;
          
          // 도면 밖으로 나가지 않도록 경계 검사 유지
          return {
            ...item,
            x: Math.max(0, Math.min(100, newX)),
            y: Math.max(0, Math.min(100, newY))
          };
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, isCalibrating]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (bgImage) URL.revokeObjectURL(bgImage);
    const imageUrl = URL.createObjectURL(file);
    setBgImage(imageUrl);
    // 새 도면 업로드 시 스케일 오차 방지를 위해 캘리브레이션 유도 알림
    showSystemMessage('success', '도면이 업로드되었습니다. 좌측의 [정밀 캘리브레이션]을 실행해 비율을 맞추세요.');
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name.trim() || newItem.w <= 0 || newItem.h <= 0) return;

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const randomColor = colors[items.length % colors.length];

    setItems([...items, {
      id: Date.now().toString(),
      name: newItem.name,
      w: Number(newItem.w),
      h: Number(newItem.h),
      x: 50, y: 50, rotation: 0, color: randomColor
    }]);
    setNewItem({ name: '', w: 2000, h: 1500 });
  };

  const rotateItem = (id, e) => {
    e.stopPropagation();
    setItems(items.map(item => item.id === id ? { ...item, rotation: (item.rotation + 45) % 360 } : item));
  };

  const deleteItem = (id, e) => {
    e.stopPropagation();
    setItems(items.filter(item => item.id !== id));
    if (selectedItem === id) setSelectedItem(null);
  };

  const changeItemColor = (id, color) => {
    setItems(items.map(item => item.id === id ? { ...item, color } : item));
  };

  const resetAllData = () => {
    if (bgImage) URL.revokeObjectURL(bgImage);
    setBgImage(null);
    setItems([]);
    setRealWidthMm(12000);
    setShareCode('');
    setUnit('cm');
    cancelCalibration();
    // 프리셋 데이터는 유지하고, 현재 세션 데이터만 삭제 (설계 의도)
    localStorage.removeItem('furniture-sim-items');
    localStorage.removeItem('furniture-sim-width');
    localStorage.removeItem('furniture-sim-unit');
    showSystemMessage('success', '현재 캔버스가 초기화되었습니다. (저장된 프리셋은 유지됩니다)');
  };

  // --- 프리셋 매니지먼트 핵심 로직 ---
  const handleSavePreset = (slot) => {
    if (items.length === 0) {
      showSystemMessage('error', '배치된 가구가 없어 저장할 수 없습니다.');
      return;
    }
    setPresets(prev => ({
      ...prev,
      [slot]: {
        name: prev[slot]?.name || `프리셋 ${slot}`,
        items: items,
        realWidthMm: realWidthMm,
        unit: unit
      }
    }));
    showSystemMessage('success', `현재 배치를 슬롯 ${slot}에 저장했습니다.`);
  };

  const handleLoadPreset = (slot) => {
    const p = presets[slot];
    if (!p) return;
    setItems(p.items || []);
    setRealWidthMm(p.realWidthMm || 12000);
    setUnit(p.unit || 'cm');
    showSystemMessage('success', `[${p.name}] 프리셋을 불러왔습니다.`);
  };

  const handleRenamePreset = (slot, newName) => {
    setPresets(prev => ({
      ...prev,
      [slot]: { ...prev[slot], name: newName }
    }));
  };

  const handleClearPreset = (slot) => {
    if(window.confirm('해당 프리셋을 삭제하시겠습니까?')) {
      setPresets(prev => ({ ...prev, [slot]: null }));
    }
  };

  // --- 캘리브레이션 핵심 로직 ---
  const handleCanvasClick = (e) => {
    if (!isCalibrating || calibPoints.length >= 2) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCalibPoints([...calibPoints, {x, y}]);
  };

  const applyCalibration = () => {
    const val = Number(calibInput);
    if (val <= 0) { showSystemMessage('error', '올바른 길이를 입력하세요.'); return; }

    const valMm = unit === 'cm' ? val * 10 : val;
    const rect = containerRef.current.getBoundingClientRect();
    const p1 = calibPoints[0];
    const p2 = calibPoints[1];

    // 두 점 사이의 픽셀 거리 계산 (피타고라스 정리)
    const dx = ((p2.x - p1.x) / 100) * rect.width;
    const dy = ((p2.y - p1.y) / 100) * rect.height;
    const pxDist = Math.sqrt(dx * dx + dy * dy);

    if (pxDist === 0) {
      showSystemMessage('error', '측정 거리가 0입니다. 다시 지정해주세요.');
      cancelCalibration();
      return;
    }

    // 수학적 역산: 선분 픽셀 길이 기반 전체 캔버스 너비(mm) 추론
    // TotalMm : TotalPx = 선분Mm : 선분Px
    const newTotalWidthMm = (rect.width / pxDist) * valMm;
    setRealWidthMm(Math.round(newTotalWidthMm));
    showSystemMessage('success', '도면의 실제 스케일이 완벽하게 동기화되었습니다.');
    cancelCalibration();
  };

  const cancelCalibration = () => {
    setIsCalibrating(false);
    setCalibPoints([]);
    setCalibInput('');
  };

  const generateShareCode = () => {
    // (기존 공유 코드 동일)
    if (items.length === 0) { showSystemMessage('error', '공유할 데이터가 없습니다.'); return; }
    try {
      const packedData = items.map(i => [i.name, i.w, i.h, Math.round(i.x * 10) / 10, Math.round(i.y * 10) / 10, i.rotation, i.color]);
      const encoded = btoa(encodeURIComponent(JSON.stringify(packedData)));
      const finalCode = `FURN-${encoded}`;
      setShareCode(finalCode);
      const textArea = document.createElement("textarea");
      textArea.value = finalCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSystemMessage('success', '공유 코드가 클립보드에 복사되었습니다.');
    } catch (e) { showSystemMessage('error', '코드 생성 중 오류가 발생했습니다.'); }
  };

  const loadShareCode = () => {
    // (기존 로드 코드 동일)
    if (!shareCode.trim()) { showSystemMessage('error', '코드를 입력해주세요.'); return; }
    try {
      if (!shareCode.startsWith('FURN-')) throw new Error("유효하지 않은 코드입니다.");
      const encoded = shareCode.replace('FURN-', '');
      const decodedJson = decodeURIComponent(atob(encoded));
      const unpackedData = JSON.parse(decodedJson);
      if (!Array.isArray(unpackedData)) throw new Error("잘못된 구조입니다.");
      const restoredItems = unpackedData.map(t => {
        if (t.length !== 7) throw new Error("데이터 규격 오류");
        return { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), name: t[0], w: t[1], h: t[2], x: t[3], y: t[4], rotation: t[5], color: t[6] };
      });
      setItems(restoredItems);
      showSystemMessage('success', '배치를 불러왔습니다.');
      setShareCode(''); setIsShareModalOpen(false);
    } catch (e) { showSystemMessage('error', '코드 손상: ' + e.message); }
  };

  const showSystemMessage = (type, text) => {
    setSystemMessage({ type, text });
    setTimeout(() => setSystemMessage(null), 3000);
  };

  // --- 고해상도 캔버스 렌더링 및 캡처 로직 (DOM 캡처의 한계 극복) ---
  const openCaptureModal = async () => {
    if (!bgImage) { showSystemMessage('error', '도면을 먼저 업로드하세요.'); return; }
    if (items.length === 0) { showSystemMessage('error', '배치된 가구가 없습니다.'); return; }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setCaptureFilename(`가구배치_${dateStr}`);
    setCaptureDataUrl(null);
    setIsCaptureModalOpen(true);

    try {
      // 1. 원본 해상도 이미지 메모리 로드 (교착 상태 방지 및 예외 처리 강화)
      const img = new Image();
      img.src = bgImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("이미지 로드 실패"));
        // 캐시된 이미지의 경우 onload가 즉시 실행되지 않을 수 있으므로 강제 통과
        if (img.complete) resolve(); 
      });

      // 2. 가상 캔버스 생성 (원본 해상도와 1:1 매칭)
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // 3. 배경 도면 렌더링
      ctx.drawImage(img, 0, 0);

      // 4. 스케일 변환 계수 계산 (브라우저 창 크기가 아닌 원본 이미지 픽셀 기준)
      const localScale = img.width / realWidthMm;
      const renderRatio = img.width / (containerWidth || 800); // 폰트 스케일 보정용

      // 5. 배치된 가구 수학적 렌더링
      items.forEach(item => {
        const x = (item.x / 100) * img.width;
        const y = (item.y / 100) * img.height;
        const w = item.w * localScale;
        const h = item.h * localScale;

        ctx.save();
        ctx.translate(x, y);
        
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.fillStyle = item.color + 'cc';
        ctx.fillRect(-w / 2, -h / 2, w, h);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2 * renderRatio;
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        ctx.rotate((-item.rotation * Math.PI) / 180);

        const fontSize = 12 * renderRatio;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 4 * renderRatio;
        ctx.shadowOffsetX = 1 * renderRatio;
        ctx.shadowOffsetY = 1 * renderRatio;

        ctx.fillText(item.name, 0, 0);
        ctx.restore();
      });

      // 6. DataURL 변환 및 상태 업데이트
      setCaptureDataUrl(canvas.toDataURL('image/png'));
    } catch (error) {
      showSystemMessage('error', '캡처 이미지를 생성하는 데 실패했습니다.');
      setIsCaptureModalOpen(false);
    }
  };

  const scaleMultiplier = containerWidth > 0 ? containerWidth / realWidthMm : 0;

  return (
    <div className="flex flex-col h-screen bg-neutral-100 font-sans relative overflow-hidden">
      {/* Toast 시스템 알림 */}
      {systemMessage && (
        <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-2 rounded shadow-lg text-sm font-medium transition-all ${systemMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-white'}`}>
          {systemMessage.text}
        </div>
      )}

      {/* 캘리브레이션 진행 안내 오버레이 UI */}
      {isCalibrating && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[150] bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 pointer-events-none">
          <Crosshair className="w-5 h-5 animate-pulse" />
          <span className="font-bold">
            {calibPoints.length === 0 ? "도면에서 길이를 아는 선분의 '시작점'을 클릭하세요." : 
             calibPoints.length === 1 ? "선분의 '끝점'을 클릭하세요." : "실제 길이를 입력하세요."}
          </span>
        </div>
      )}

      {/* 캘리브레이션 길이 입력 모달 */}
      {calibPoints.length === 2 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-80">
            <h3 className="text-lg font-bold text-neutral-800 mb-2">지정한 선분의 실제 길이</h3>
            <p className="text-xs text-neutral-500 mb-4 leading-tight">두 점 사이의 실제 거리를 {unit} 단위로 입력하면 나머지 도면 스케일이 수학적으로 자동 계산됩니다.</p>
            <div className="flex items-center space-x-2 mb-4">
              <input 
                type="number" 
                value={calibInput}
                onChange={e => setCalibInput(e.target.value)}
                placeholder={`예: ${unit === 'cm' ? '360' : '3600'}`}
                className="flex-1 border border-neutral-300 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                autoFocus
              />
              <span className="font-bold text-neutral-600">{unit}</span>
            </div>
            <div className="flex space-x-2">
              <button onClick={cancelCalibration} className="flex-1 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded font-medium transition-colors">취소</button>
              <button onClick={applyCalibration} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors">비율 적용</button>
            </div>
          </div>
        </div>
      )}

      {/* 캡처(스크린샷) 모달 */}
      {isCaptureModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-neutral-100 bg-neutral-50/50 flex-shrink-0">
              <h2 className="text-base font-bold text-neutral-800 flex items-center">
                <Camera className="w-4 h-4 mr-2 text-indigo-600" />
                고해상도 이미지 저장
              </h2>
              <button onClick={() => setIsCaptureModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto flex flex-col space-y-4">
              <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-2 flex items-center justify-center min-h-[200px] relative">
                {!captureDataUrl ? (
                  <div className="flex flex-col items-center justify-center text-neutral-400">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                    <span className="text-sm font-medium">고해상도 렌더링 중...</span>
                  </div>
                ) : (
                  <img 
                    src={captureDataUrl} 
                    alt="Layout Preview" 
                    className="max-h-[50vh] object-contain shadow-sm bg-white"
                    onContextMenu={(e) => e.stopPropagation()}
                  />
                )}
              </div>
              <p className="text-xs text-neutral-500 text-center flex items-center justify-center">
                <Info className="w-3.5 h-3.5 mr-1" />
                위 이미지를 <strong>우클릭하여 '이미지 복사'</strong>를 할 수 있습니다.
              </p>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-neutral-500 mb-1">저장될 파일명</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={captureFilename}
                    onChange={(e) => setCaptureFilename(e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="파일명을 입력하세요"
                  />
                  <a
                    href={captureDataUrl}
                    download={`${captureFilename || 'furniture_layout'}.png`}
                    className={`px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors whitespace-nowrap flex items-center ${captureDataUrl ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-neutral-400 pointer-events-none'}`}
                  >
                    <Download className="w-4 h-4 mr-1.5" /> PC에 저장
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 공유 모달 (완전 복구됨) */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-4 border-b border-neutral-100 bg-neutral-50/50">
              <h2 className="text-base font-bold text-neutral-800 flex items-center">
                <Share2 className="w-4 h-4 mr-2 text-blue-600" /> 배치 데이터 공유 / 불러오기
              </h2>
              <button onClick={() => setIsShareModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">현재 배치 코드 복사</label>
                <button onClick={generateShareCode} className="w-full flex items-center justify-center py-2 px-4 border border-neutral-300 rounded-lg shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none transition-colors">
                  <Copy className="w-4 h-4 mr-2 text-neutral-500" /> 코드로 변환하여 복사
                </button>
              </div>
              <div className="pt-4 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">저장된 코드 불러오기</label>
                <div className="flex space-x-2">
                  <input type="text" placeholder="'FURN-' 으로 시작하는 코드 붙여넣기" value={shareCode} onChange={(e) => setShareCode(e.target.value)} className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                  <button onClick={loadShareCode} className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors whitespace-nowrap">불러오기</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상단 통합 헤더 (Top Bar) : 레이아웃 확장 및 프리셋 관리 영역 */}
      <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 z-20 flex-shrink-0 shadow-sm">
        <h1 className="text-xl font-black text-neutral-800 tracking-tight flex items-center">
          <Move className="w-5 h-5 mr-2 text-blue-600" />
          가구 배치 시뮬레이터
        </h1>

        {/* 프리셋 컨트롤 패널 */}
        <div className="flex items-center space-x-3 bg-neutral-50 p-1.5 rounded-lg border border-neutral-200">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-2 pr-1">Presets</span>
          <div className="flex space-x-2">
            {[1, 2, 3].map(slot => (
              <div key={slot} className="flex items-center bg-white border border-neutral-200 rounded shadow-sm h-8">
                {presets[slot] ? (
                  <>
                    {/* 프리셋 이름 인라인 에디터 */}
                    <input
                      type="text"
                      value={presets[slot].name}
                      onChange={(e) => handleRenamePreset(slot, e.target.value)}
                      disabled={isCalibrating}
                      className="w-24 px-2 py-1 text-xs font-semibold text-neutral-700 bg-transparent border-none focus:ring-0 outline-none transition-colors truncate"
                      title="클릭하여 이름 변경"
                    />
                    <div className="flex space-x-0 border-l border-neutral-100">
                      <button onClick={() => handleLoadPreset(slot)} disabled={isCalibrating} title="이 프리셋 불러오기" className="p-1.5 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleSavePreset(slot)} disabled={isCalibrating} title="현재 캔버스 상태로 덮어쓰기" className="p-1.5 text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-30">
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleClearPreset(slot)} disabled={isCalibrating} title="프리셋 비우기" className="p-1.5 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 rounded-r">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="w-24 px-2 py-1 text-xs text-neutral-400 italic flex items-center justify-center pointer-events-none">Empty ({slot})</span>
                    <div className="flex border-l border-neutral-100 h-full">
                      <button onClick={() => handleSavePreset(slot)} disabled={isCalibrating} className="px-3 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30 flex items-center rounded-r">
                        <Save className="w-3 h-3 mr-1" /> 저장
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* 하단 메인 작업 영역 (좌측 사이드바 + 우측 캔버스) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 왼쪽 사이드바 */}
        <div className="w-80 bg-white border-r border-neutral-200 p-4 flex flex-col shadow-sm z-10 overflow-hidden relative">
          {/* 캘리브레이션 활성화 시 사이드바 차단 오버레이 */}
          {isCalibrating && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto"><p className="text-sm font-bold text-neutral-600">캘리브레이션 진행 중...</p></div>}
          
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-sm font-bold text-neutral-700">도구 모음</h2>
            <button onClick={resetAllData} className="text-[10px] text-neutral-400 hover:text-red-500 underline underline-offset-2 transition-colors">캔버스 비우기</button>
          </div>

          {/* 1. 컴팩트 설정 영역 */}
          <div className="mb-5 bg-neutral-50 rounded-lg border border-neutral-200 p-3 flex-shrink-0 space-y-3">
            <h2 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">도면 기본 설정</h2>
            <div className="flex space-x-2">
              <div className="flex bg-neutral-200/50 p-0.5 rounded-md flex-1">
                <button onClick={() => setUnit('cm')} className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${unit === 'cm' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}>cm</button>
                <button onClick={() => setUnit('mm')} className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${unit === 'mm' ? 'bg-white shadow-sm text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}>mm</button>
              </div>
              <label className="flex-1 flex items-center justify-center bg-white border border-neutral-300 rounded-md cursor-pointer hover:bg-neutral-50 transition-colors px-2">
                <Upload className="w-3.5 h-3.5 text-neutral-500 mr-1.5" />
                <span className="text-xs text-neutral-600 font-medium">도면 변경</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            
            {/* 전체 수동 너비 박스 */}
            <div className="flex items-center space-x-2 bg-white border border-neutral-300 rounded-md px-2 py-1 opacity-70 hover:opacity-100 transition-opacity">
              <span className="text-xs text-neutral-500 font-medium whitespace-nowrap">전체 이미지 길이:</span>
              <input type="number" value={unit === 'cm' ? realWidthMm / 10 : realWidthMm} onChange={(e) => { const val = Number(e.target.value); setRealWidthMm(unit === 'cm' ? Math.round(val * 10) : val); }} className="w-full text-xs outline-none bg-transparent text-right font-mono" />
              <span className="text-xs text-neutral-400 font-mono">{unit}</span>
            </div>

            {/* 캘리브레이션 툴 트리거 버튼 */}
            <button 
              onClick={() => { if(bgImage) setIsCalibrating(true); else showSystemMessage('error', '도면을 먼저 업로드하세요.'); }}
              className="w-full flex items-center justify-center py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5 mr-1" />
              정밀 캘리브레이션 (비율 맞추기)
            </button>
          </div>

          {/* 2. 가구/가전 추가 */}
          <div className="mb-5 flex-shrink-0">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">가구 / 가전 추가</label>
            <form onSubmit={handleAddItem} className="space-y-2">
              <input type="text" placeholder="항목 이름 (예: 퀸 침대)" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
              <div className="flex space-x-2">
                <input type="number" step="any" placeholder={`가로 (${unit})`} value={newItem.w === 0 ? '' : (unit === 'cm' ? newItem.w / 10 : newItem.w)} onChange={(e) => { const val = Number(e.target.value); setNewItem({...newItem, w: unit === 'cm' ? Math.round(val * 10) : val}); }} className="w-1/2 px-3 py-2 border border-neutral-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
                <input type="number" step="any" placeholder={`세로 (${unit})`} value={newItem.h === 0 ? '' : (unit === 'cm' ? newItem.h / 10 : newItem.h)} onChange={(e) => { const val = Number(e.target.value); setNewItem({...newItem, h: unit === 'cm' ? Math.round(val * 10) : val}); }} className="w-1/2 px-3 py-2 border border-neutral-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <button type="submit" className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-neutral-800 hover:bg-neutral-900 transition-colors"><Plus className="w-4 h-4 mr-1" /> 추가하기</button>
            </form>
          </div>

          {/* 3. 배치된 가구 목록 */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-100 pt-4">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <label className="block text-sm font-semibold text-neutral-700">배치된 항목 ({items.length})</label>
              <div className="flex space-x-1">
                <button onClick={() => setIsShareModalOpen(true)} className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-2 py-1.5 rounded transition-colors">
                  <Share2 className="w-3 h-3 mr-1" /> 공유
                </button>
                <button onClick={openCaptureModal} className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-2 py-1.5 rounded transition-colors">
                  <Camera className="w-3 h-3 mr-1" /> 저장
                </button>
              </div>
            </div>
            <ul className="space-y-2 overflow-y-auto pr-1">
              {items.map(item => (
                <li key={item.id} onClick={() => setSelectedItem(item.id)} className={`flex items-center justify-between p-2 cursor-pointer border rounded-md transition-colors ${selectedItem === item.id ? 'bg-blue-50 border-blue-300' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}>
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <input type="color" value={item.color} onChange={(e) => changeItemColor(item.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="w-6 h-6 p-0 border-0 rounded cursor-pointer flex-shrink-0 bg-transparent" title="색상 변경" />
                    <div className="flex flex-col truncate">
                      <span className="text-sm text-neutral-700 font-medium truncate">{item.name}</span>
                      <span className="text-xs text-neutral-500 font-mono">{unit === 'cm' ? item.w / 10 : item.w} × {unit === 'cm' ? item.h / 10 : item.h} {unit}</span>
                    </div>
                  </div>
                  <button onClick={(e) => deleteItem(item.id, e)} className="text-neutral-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
              {items.length === 0 && <p className="text-xs text-neutral-400 text-center py-4">배치된 가구가 없습니다.</p>}
            </ul>
          </div>
        </div>

        {/* 오른쪽 메인: 도면 및 시뮬레이션 영역 */}
        <div className="flex-1 overflow-hidden relative flex items-center justify-center p-8 bg-neutral-200/50">
          {!bgImage ? (
            <div className="text-center text-neutral-400 flex flex-col items-center">
              <Move className="w-16 h-16 mb-4 text-neutral-300" />
              <p className="text-lg font-medium">좌측 패널에서 도면 이미지를 업로드해주세요.</p>
              <p className="text-sm mt-2">첨부하신 '3717.jpg' 파일을 선택하시면 됩니다.</p>
            </div>
          ) : (
            <div 
              ref={containerRef} 
              onClick={handleCanvasClick}
              className={`relative shadow-2xl border border-neutral-300 max-w-full max-h-full transition-colors ${isCalibrating ? 'cursor-crosshair bg-neutral-900 ring-4 ring-blue-500' : 'bg-white'}`}
              style={{ display: 'inline-block' }}
            >
              <img 
                src={bgImage} 
                alt="Floor Plan" 
                className={`max-w-full max-h-[85vh] object-contain block select-none pointer-events-none transition-opacity ${isCalibrating ? 'opacity-80' : 'opacity-100'}`} 
              />

              {/* 캘리브레이션 렌더링 (SVG 레이어 추가) */}
              {isCalibrating && calibPoints.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-40 drop-shadow-md">
                  {calibPoints.map((p, i) => (
                    <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r="5" fill="#2563eb" stroke="white" strokeWidth="2" />
                  ))}
                  {calibPoints.length === 2 && (
                    <line 
                      x1={`${calibPoints[0].x}%`} y1={`${calibPoints[0].y}%`} 
                      x2={`${calibPoints[1].x}%`} y2={`${calibPoints[1].y}%`} 
                      stroke="#2563eb" strokeWidth="3" strokeDasharray="6 4" 
                    />
                  )}
                </svg>
              )}
              
              {/* 가구 아이템 렌더링 */}
              {items.map(item => {
                const isSelected = selectedItem === item.id;
                const widthPx = item.w * scaleMultiplier;
                const heightPx = item.h * scaleMultiplier;

                // AABB (Axis-Aligned Bounding Box) 계산: 회전 시 컨트롤 위치 절대 고정용
                const rad = (item.rotation * Math.PI) / 180;
                const aabbW = Math.abs(widthPx * Math.cos(rad)) + Math.abs(heightPx * Math.sin(rad));
                const aabbH = Math.abs(widthPx * Math.sin(rad)) + Math.abs(heightPx * Math.cos(rad));

                return (
                  <div
                    key={item.id}
                    className={`absolute flex items-center justify-center ${isSelected && !isCalibrating ? 'z-50' : 'z-30'}`}
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: 0,
                      height: 0,
                    }}
                  >
                    {/* 1. 가구 본체 (회전이 적용되는 유일한 레이어) */}
                    <div
                      onPointerDown={(e) => {
                        if (isCalibrating) { e.preventDefault(); return; }
                        setDraggingItem(item.id);
                        setSelectedItem(item.id);
                      }}
                      className={`absolute shadow-md transition-shadow ${isCalibrating ? 'pointer-events-none opacity-40 grayscale' : 'cursor-move'} ${isSelected && !isCalibrating ? 'ring-2 ring-blue-500 ring-offset-1' : 'hover:ring-2 hover:ring-neutral-400'}`}
                      style={{
                        left: 0,
                        top: 0,
                        width: `${widthPx}px`,
                        height: `${heightPx}px`,
                        backgroundColor: `${item.color}cc`,
                        transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                        touchAction: 'none'
                      }}
                    />

                    {/* 2. 텍스트 레이어 (회전 영향 없음, 항상 수평 유지) */}
                    <div 
                      className="absolute pointer-events-none flex flex-col items-center justify-center w-max z-10"
                      style={{
                        left: 0,
                        top: 0,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <span className="text-white font-bold text-xs truncate px-1 drop-shadow-md">{item.name}</span>
                      {isSelected && !isCalibrating && (
                        <span className="text-white font-medium text-[10px] truncate px-1 bg-black/40 rounded mt-0.5 backdrop-blur-sm">
                          {unit === 'cm' ? item.w / 10 : item.w}×{unit === 'cm' ? item.h / 10 : item.h}
                        </span>
                      )}
                    </div>

                    {/* 3. 컨트롤 버튼 레이어 (회전 각도에 관계없이 AABB 기반 우측 상단/하단 절대 고정) */}
                    {isSelected && !isCalibrating && (
                      <>
                        <button
                          onPointerDown={(e) => rotateItem(item.id, e)}
                          className="absolute bg-white text-blue-600 rounded-full p-1 shadow-md border border-neutral-200 hover:bg-blue-50 z-20"
                          style={{
                            left: `${aabbW / 2}px`,
                            top: `${-aabbH / 2}px`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          title="회전"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <button
                          onPointerDown={(e) => deleteItem(item.id, e)}
                          className="absolute bg-white text-red-600 rounded-full p-1 shadow-md border border-neutral-200 hover:bg-red-50 z-20"
                          style={{
                            left: `${aabbW / 2}px`,
                            top: `${aabbH / 2}px`,
                            transform: 'translate(-50%, -50%)'
                          }}
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}