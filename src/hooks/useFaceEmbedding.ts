/**
 * useFaceEmbedding — Client-side 512-d face embedding extraction.
 *
 * Uses @vladmandic/face-api with the ArcFace recognition model, which produces
 * 512-dimensional descriptors matching the backend's pgvector(512) column.
 *
 * Model files required in /public/models/:
 *   ssd_mobilenetv1_model-weights_manifest.json  + shard files
 *   face_landmark_68_model-weights_manifest.json + shard files
 *   arcface_model-weights_manifest.json          + shard files
 *
 * Download from: https://github.com/vladmandic/face-api/tree/master/model
 */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// Lazy-import so the large bundle is only loaded when the hook is used.
type FaceApiModule = typeof import('@vladmandic/face-api');

interface UseFaceEmbeddingReturn {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  extractEmbedding: (imageElement: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement) => Promise<number[] | null>;
}

const MODELS_PATH = '/models';

let faceApiModule: FaceApiModule | null = null;
let modelsLoaded = false;

export function useFaceEmbedding(): UseFaceEmbeddingReturn {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (modelsLoaded || loadingRef.current) {
      if (modelsLoaded) setIsReady(true);
      return;
    }

    const loadModels = async () => {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Dynamic import keeps face-api out of the main bundle
        faceApiModule = await import('@vladmandic/face-api');
        const faceapi = faceApiModule;

        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_PATH),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_PATH),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_PATH),
        ]);

        modelsLoaded = true;
        setIsReady(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load face recognition models';
        setError(`Face models unavailable: ${msg}. Ensure model files are in /public/models/.`);
        console.error('[useFaceEmbedding] Model load failed:', err);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    loadModels();
  }, []);

  const extractEmbedding = useCallback(
    async (imageElement: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement): Promise<number[] | null> => {
      if (!modelsLoaded || !faceApiModule) {
        setError('Face models not loaded yet.');
        return null;
      }

      try {
        const faceapi = faceApiModule;

        const detection = await faceapi
          .detectSingleFace(imageElement as HTMLVideoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          return null; // No face detected
        }

        // faceRecognitionNet (ArcFace in @vladmandic/face-api) returns Float32Array(512)
        const descriptor = detection.descriptor;

        if (descriptor.length !== 512) {
          console.warn(`[useFaceEmbedding] Expected 512-d descriptor, got ${descriptor.length}-d. Check model.`);
        }

        return Array.from(descriptor);
      } catch (err) {
        console.error('[useFaceEmbedding] Embedding extraction failed:', err);
        return null;
      }
    },
    []
  );

  return { isReady, isLoading, error, extractEmbedding };
}
