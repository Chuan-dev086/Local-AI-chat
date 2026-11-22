// frontend/src/utils/imageFile.js

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Process a single image file, validate its format (PNG/JPEG) and size (<= 5MB),
 * and read it as base64 for chat attachment.
 */
export function processImageFile(file, onAttachFile, onError) {
  if (!file) return;

  const isImage =
    /^image\/(png|jpeg)$/i.test(file.type) ||
    /\.(png|jpe?g)$/i.test(file.name);

  if (!isImage) {
    onError?.("仅支持上传 PNG 或 JPEG 格式的图片。");
    return;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    onError?.("图片大小不能超过 5MB。");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUrl = String(event.target?.result || "");
    onAttachFile({
      name: file.name,
      imageBase64: dataUrl.split(",")[1],
      mimeType:
        file.type ||
        (/\.png$/i.test(file.name) ? "image/png" : "image/jpeg"),
    });
  };
  reader.readAsDataURL(file);
}
