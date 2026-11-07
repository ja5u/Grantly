import type { Profile } from './domain';

export async function readIncomeCertificate(file: File, password: string, progress: (percent: number) => void) {
  if (!/\.pdf$/i.test(file.name) || file.size > 12 * 1024 * 1024) {
    throw new Error('Choose a PDF smaller than 12 MB.');
  }
  const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ data: await file.arrayBuffer(), password, isEvalSupported: false });
  let ocr: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | undefined;
  try {
    const pdf = await task.promise;
    const total = Math.min(pdf.numPages, 4);
    for (let index = 1; index <= total; index++) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      let extracted = content.items.map(item => 'str' in item ? item.str : '').join(' ');
      if (extracted.trim().length < 25) {
        const viewport = page.getViewport({ scale: 1.65 });
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
            logger: message => {
              if (message.status === 'recognizing text') progress(Math.round((index - 1 + message.progress) * 100 / total));
            },
          });
        }
        extracted = (await ocr.recognize(canvas)).data.text;
        canvas.width = 0;
        canvas.height = 0;
      }
      const result = extractIncome(extracted);
      progress(Math.round(index * 100 / total));
      if (result.income !== undefined) return result;
    }
    throw new Error('We could not find an annual income on the first four pages. You can fill it in manually.');
  } finally {
    await Promise.allSettled([task.destroy(), ocr?.terminate()]);
  }
}

export function extractIncome(text: string): Partial<Profile> {
  const found = /(?:annual\s+(?:family\s+)?income|family\s+annual\s+income)\s*(?:is|of|:|=)?\s*(?:INR|Rs\.?|₹)?\s*([\d,]+)(?:\.\d+)?/i.exec(text);
  if (!found) return {};
  const income = Number(found[1].replaceAll(',', ''));
  return Number.isSafeInteger(income) ? { income, documents: ['Income certificate'] } : {};
}
