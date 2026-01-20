
/**
 * Encripta una cadena usando SHA-256 para almacenamiento seguro.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Genera un nickname basado en el nombre completo.
 * Raúl Ríos Trujillo -> rriostrujillo
 */
export const generateNickname = (fullName: string): string => {
  return fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z\s]/g, "") // Quitar caracteres especiales
    .split(/\s+/)
    .map((word, index) => index === 0 ? word.charAt(0) : word)
    .join('');
};

export const DEFAULT_PASSWORD = "Sitra@2025!"; // Contraseña segura por defecto
