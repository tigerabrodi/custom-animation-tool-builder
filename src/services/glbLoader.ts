// GLB magic bytes: "glTF" in ASCII
const GLB_MAGIC = 0x46546c67;

interface GLBLoadResult {
  url: string;
  cleanup: () => void;
}

/**
 * Validates that the file is a GLB by checking magic bytes
 */
async function validateGLB(file: File): Promise<boolean> {
  // First check extension
  if (!file.name.toLowerCase().endsWith('.glb')) {
    return false;
  }

  // Then check magic bytes
  const buffer = await file.slice(0, 4).arrayBuffer();
  const view = new DataView(buffer);
  const magic = view.getUint32(0, true);

  return magic === GLB_MAGIC;
}

/**
 * Loads a GLB file and returns an object URL
 * @param file - The File object to load
 * @returns Object URL and cleanup function, or null if invalid
 */
export async function loadGLBFile(file: File): Promise<GLBLoadResult | null> {
  const isValid = await validateGLB(file);

  if (!isValid) {
    console.error('Invalid GLB file:', file.name);
    return null;
  }

  const url = URL.createObjectURL(file);

  return {
    url,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

/**
 * Revokes an object URL to free memory
 */
export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}
