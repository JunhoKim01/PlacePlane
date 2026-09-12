const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;

/** Validate before replacing the current plan; callers own the returned blob URL. */
export async function prepareFloorPlan(blob: Blob): Promise<string> {
  if (!blob.type.startsWith('image/')) {
    throw new Error('이미지를 복사하거나 PNG, JPG, WebP 이미지 파일을 선택해주세요.');
  }
  if (blob.size === 0 || blob.size > MAX_IMAGE_BYTES) {
    throw new Error('도면 이미지는 20MB 이하의 비어 있지 않은 파일이어야 합니다.');
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight ||
        image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
      throw new Error('도면 이미지가 너무 큽니다. 4천만 픽셀 이하로 줄여주세요.');
    }
    return url;
  } catch (error) {
    URL.revokeObjectURL(url);
    throw new Error(error instanceof Error && error.message.includes('픽셀')
      ? error.message : '이미지를 읽을 수 없습니다. PNG 또는 JPG 이미지로 다시 시도해주세요.');
  }
}
