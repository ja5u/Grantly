import { extractIncome } from './income';

export async function readIncomeCertificate(
  file: File,
  password: string,
  progress: (percent: number) => void,
  signal?: AbortSignal,
) {
  if (!/\.pdf$/i.test(file.name) || file.size > 12 * 1024 * 1024) {
    throw new Error('Choose a PDF smaller than 12 MB.');
  }
  const bytes = await file.arrayBuffer();
  if (!new TextDecoder().decode(bytes.slice(0, 5)).startsWith('%PDF-'))
    throw new Error('This file is not a readable PDF.');
  signal?.throwIfAborted();
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  signal?.throwIfAborted();
  const task = pdfjs.getDocument({
    data: bytes,
    password,
    isEvalSupported: false,
    stopAtErrors: true,
  });
  let ocr: Awaited<ReturnType<(typeof import('tesseract.js'))['createWorker']>> | undefined;
  const cancel = () => {
    void task.destroy().catch(() => {});
    void ocr?.terminate().catch(() => {});
  };
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    const pdf = await task.promise;
    const total = Math.min(pdf.numPages, 4);
    for (let index = 1; index <= total; index++) {
      signal?.throwIfAborted();
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      let extracted = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      if (extracted.trim().length < 25) {
        const original = page.getViewport({ scale: 1 });
        const scale = Math.min(
          1.65,
          Math.sqrt(4000000 / (original.width * original.height)),
          4096 / Math.max(original.width, original.height),
        );
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const canvasContext = canvas.getContext('2d');
        if (!canvasContext) throw new Error('This browser cannot process scanned pages.');
        await page.render({ canvasContext, viewport }).promise;
        if (!ocr) {
          const { createWorker } = await import('tesseract.js');
          ocr = await createWorker('eng', 1, {
            cacheMethod: 'none',
            logger: (message) => {
              if (message.status === 'recognizing text')
                progress(Math.round(((index - 1 + message.progress) * 100) / total));
            },
          });
        }
        signal?.throwIfAborted();
        extracted = (await ocr.recognize(canvas)).data.text;
        canvas.width = 0;
        canvas.height = 0;
      }
      const result = extractIncome(extracted);
      progress(Math.round((index * 100) / total));
      if (result.income !== undefined) return result;
    }
    throw new Error(
      'We could not find an annual income on the first four pages. You can fill it in manually.',
    );
  } finally {
    signal?.removeEventListener('abort', cancel);
    await Promise.allSettled([task.destroy(), ocr?.terminate()]);
  }
}
