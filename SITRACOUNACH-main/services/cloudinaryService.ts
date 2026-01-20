
const CLOUDINARY_API_KEY = "673114884998683";
const CLOUDINARY_API_SECRET = "Eq3L7TyT6DLRBNp-ZVSdpNIAuLU";
const CLOUDINARY_CLOUD_NAME = "rriostrujillo"; // NOMBRE ACTUALIZADO
const UPLOAD_PRESET = "ml_default"; 

/**
 * Redimensiona y comprime una imagen utilizando Canvas para reducir el tamaño del archivo.
 */
async function resizeAndCompress(file: string | Blob, maxWidth = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof file === 'string' ? file : URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("No se pudo obtener el contexto del canvas"));

      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Error al comprimir la imagen"));
        }
        if (typeof file !== 'string') URL.revokeObjectURL(url);
      }, 'image/jpeg', quality);
    };

    img.onerror = () => reject(new Error("Error al cargar la imagen para compresión"));
    img.src = url;
  });
}

/**
 * Genera una firma SHA-1 para subidas firmadas en Cloudinary.
 */
async function generateSignature(params: Record<string, any>, secret: string): Promise<string> {
  const sortedKeys = Object.keys(params).sort();
  const signatureString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&') + secret;

  const encoder = new TextEncoder();
  const data = encoder.encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sube una imagen (base64 o blob) a Cloudinary utilizando una solicitud FIRMADA.
 * Incluye compresión automática si el archivo es pesado.
 */
export const uploadToCloudinary = async (file: string | Blob, folder: string = "sitracounach"): Promise<string | null> => {
  try {
    let fileToUpload: Blob | string = file;
    
    // Optimización automática de archivos pesados
    const isLargeBlob = file instanceof Blob && file.size > 1024 * 1024;
    const isBase64 = typeof file === 'string' && file.startsWith('data:image');
    
    if (isLargeBlob || isBase64) {
      try {
        fileToUpload = await resizeAndCompress(file);
      } catch (err) {
        console.warn("No se pudo comprimir, intentando original");
      }
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      folder: folder,
      timestamp: timestamp,
      upload_preset: UPLOAD_PRESET
    };

    const signature = await generateSignature(paramsToSign, CLOUDINARY_API_SECRET);

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    
    if (response.ok && data.secure_url) {
      return data.secure_url;
    }

    return null;
  } catch (error) {
    console.error("Cloudinary error:", error);
    return null;
  }
};

/**
 * Genera un QR a partir de texto y lo sube a Cloudinary
 */
export const generateAndUploadQR = async (text: string): Promise<string | null> => {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(qrApiUrl);
    if (!response.ok) throw new Error("No se pudo obtener el QR");
    const blob = await response.blob();
    return await uploadToCloudinary(blob, "qrcodes");
  } catch (error) {
    return null;
  }
};
