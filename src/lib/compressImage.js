// src/lib/compressImage.js
//
// Compresse/redimensionne une image côté navigateur AVANT l'upload vers
// Supabase Storage. Objectif : éviter que des photos de plusieurs Mo
// (uploadées telles quelles depuis un téléphone) plombent le LCP des
// visiteurs qui chargent un profil ou un événement.
//
// Installation : npm install browser-image-compression

import imageCompression from 'browser-image-compression';

/**
 * @param {File} file - fichier image sélectionné par l'utilisateur
 * @param {object} [options]
 * @param {number} [options.maxSizeMB=0.4] - taille cible max (Mo)
 * @param {number} [options.maxWidthOrHeight=1280] - dimension max en pixels
 * @returns {Promise<File>} fichier compressé, prêt pour .storage.upload()
 */
export async function compressImage(file, options = {}) {
  if (!file || !file.type?.startsWith('image/')) return file;

  // Les GIF animés perdent leur animation si on les repasse par le canvas —
  // on les laisse passer tels quels (à limiter par MAX_SIZE_KB comme avant).
  if (file.type === 'image/gif') return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB ?? 0.4,
      maxWidthOrHeight: options.maxWidthOrHeight ?? 1280,
      useWebWorker: true,
      initialQuality: 0.8,
    });

    // Conserve le nom d'origine (l'extension sert à générer le nom de
    // fichier Storage dans le code existant : file.name.split('.').pop())
    return new File([compressed], file.name, { type: compressed.type });
  } catch (err) {
    // En cas d'échec de compression, on repart sur le fichier original
    // plutôt que de bloquer l'upload de l'utilisateur.
    console.warn('Compression image échouée, upload du fichier original :', err);
    return file;
  }
}