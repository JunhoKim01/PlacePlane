import { useEffect, useRef, useState } from 'react';
import { X, Link, Loader2 } from 'lucide-react';
import { prepareFloorPlan } from './floorPlanImage';

type Props = { onClose: () => void; onApply: (image: Blob) => Promise<void> };

export default function FloorPlanUrlDialog({ onClose, onApply }: Props) {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<{ blob: Blob; url: string; source: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const request = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => { dialog.current?.showModal(); return () => { request.current?.abort(); }; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  const load = async (event: React.FormEvent) => {
    event.preventDefault();
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setPreview(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}api/floor-plan/image?url=${encodeURIComponent(url.trim())}`, { signal: controller.signal });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? '도면을 가져오지 못했습니다.');
      }
      const blob = await response.blob();
      const imageUrl = await prepareFloorPlan(blob);
      if (controller.signal.aborted) { URL.revokeObjectURL(imageUrl); return; }
      setPreview({ blob, url: imageUrl, source: url.trim() });
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : '도면을 가져오지 못했습니다.');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  };

  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); if (!applying) onClose(); }} onPaste={event => event.stopPropagation()}
    aria-labelledby="floor-plan-url-title" className="w-[620px] max-w-[90vw] rounded-xl p-0 shadow-2xl backdrop:bg-black/60">
    <div className="p-5 flex justify-between items-center border-b">
      <h2 id="floor-plan-url-title" className="font-bold flex items-center gap-2"><Link size={18} /> 네이버 도면 URL로 가져오기</h2>
      <button onClick={onClose} disabled={applying} aria-label="닫기" className="p-1 rounded hover:bg-neutral-100"><X size={20} /></button>
    </div>
    <div className="p-5 space-y-4">
      <p className="text-sm text-neutral-600">네이버 부동산에서 평면도를 열고 ‘이미지 주소 복사’를 선택한 뒤 붙여넣어주세요.</p>
      <form onSubmit={load} className="flex gap-2">
        <input autoFocus aria-label="도면 이미지 URL" type="url" required value={url} onChange={event => {
          request.current?.abort(); setBusy(false); setPreview(null); setError(''); setUrl(event.target.value);
        }} disabled={applying} placeholder="https://landthumb-phinf.pstatic.net/..." className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" />
        <button disabled={busy || applying || !url.trim()} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-40">
          {busy ? <Loader2 size={18} className="animate-spin" aria-label="불러오는 중" /> : '미리보기'}
        </button>
      </form>
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {preview && <>
        <img src={preview.url} alt="가져온 도면 미리보기" className="w-full max-h-[45vh] object-contain rounded border bg-neutral-50" />
        <div className="flex items-center justify-between gap-4">
          <a href={preview.source} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">출처: 네이버 부동산 이미지</a>
          <button disabled={applying} onClick={async () => { setApplying(true); try { await onApply(preview.blob); onClose(); } finally { setApplying(false); } }}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{applying ? '적용 중...' : '이 도면 사용'}</button>
        </div>
        <p className="text-xs text-neutral-500">단지·타입이 맞는지 확인하세요. 적용 후 정밀 캘리브레이션으로 실제 길이를 맞춰주세요.</p>
      </>}
      <p className="text-xs text-neutral-500">파일 저장 없이 도면을 적용합니다. 이미지를 복사한 경우에는 창을 닫고 Ctrl+V로 붙여넣을 수 있습니다.</p>
    </div>
  </dialog>;
}
