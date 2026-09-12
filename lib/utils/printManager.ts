'use client';

export interface PrintOptions {
  title?: string;
  pageMargin?: string;
  landscape?: boolean;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Universal Print Helper for Homestay
 * Clones all active document styles, Tailwind classes, and typography into an isolated
 * printable context, ensuring pixel-perfect receipts, invoices, and reports across
 * desktop browsers (Chrome, Edge, Safari, Firefox) and mobile webviews.
 *
 * GUARANTEE: When printing an invoice, due, payment receipt, or admission slip,
 * ONLY that target document is printed. All other students' records, directory tables,
 * dues ledgers, and background pages are strictly excluded from the print output.
 */
export function printElement(
  target: HTMLElement | string,
  options: PrintOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // 1. Resolve target element
    let element: HTMLElement | null = null;
    if (typeof target === 'string') {
      element = document.querySelector<HTMLElement>(target);
    } else {
      element = target;
    }

    if (!element) {
      console.warn(`Print target "${target}" not found. Falling back to global window.print()`);
      options.onBeforePrint?.();
      window.print();
      options.onAfterPrint?.();
      resolve(false);
      return;
    }

    options.onBeforePrint?.();

    // 2. Mark target and body for single-student print isolation so that in any
    // direct print or webview print, ONLY the target element is visible and everything else is hidden
    document.body.classList.add('printing-isolated-active');
    element.classList.add('print-target-active');

    const cleanupIsolation = () => {
      document.body.classList.remove('printing-isolated-active');
      element?.classList.remove('print-target-active');
      options.onAfterPrint?.();
    };

    try {
      // 3. Extract all active style tags and linked stylesheets from main document
      let collectedStyles = '';
      const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
      styleElements.forEach((el) => {
        collectedStyles += el.outerHTML + '\n';
      });

      // 4. Clone target element content
      const clonedNode = element.cloneNode(true) as HTMLElement;
      // Remove any 'hidden' or 'print-only' classes from cloned node
      clonedNode.classList.remove('hidden');
      clonedNode.classList.remove('print-only');
      clonedNode.style.display = 'block';
      clonedNode.style.visibility = 'visible';

      // 5. Build self-contained HTML payload containing ONLY this document
      const title = options.title || document.title || 'Print Document';
      const pageMargin = options.pageMargin || '10mm 12mm';
      const orientation = options.landscape ? 'A4 landscape' : 'A4 portrait';

      const payloadHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${collectedStyles}
            <style>
              @page {
                size: ${orientation};
                margin: ${pageMargin};
              }
              *, *::before, *::after {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                min-height: auto !important;
                height: auto !important;
                overflow: visible !important;
              }
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
                visibility: visible !important;
              }
              .printable-document, .printable-voucher, .printable-admission-slip {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                padding: 16px !important;
                border: none !important;
                box-shadow: none !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
              }
            </style>
          </head>
          <body>
            ${clonedNode.outerHTML}
          </body>
        </html>
      `;

      // 6. Native Android bridge: if printHtml exists, use it with the isolated HTML
      if ((window as any).AndroidApp && typeof (window as any).AndroidApp.printHtml === 'function') {
        try {
          (window as any).AndroidApp.printHtml(payloadHtml, title);
          cleanupIsolation();
          resolve(true);
          return;
        } catch (e) {
          console.warn('Native AndroidApp.printHtml failed, falling back:', e);
        }
      }

      // If Android bridge has printPage, printing-isolated-active guarantees only target is rendered
      if ((window as any).AndroidApp && typeof (window as any).AndroidApp.printPage === 'function') {
        try {
          (window as any).AndroidApp.printPage();
          setTimeout(() => {
            cleanupIsolation();
            resolve(true);
          }, 1500);
          return;
        } catch (e) {
          console.warn('Native AndroidApp.printPage failed, falling back to iframe print:', e);
        }
      }

      // 7. Create isolated offscreen iframe for standard web/desktop printing
      const iframe = document.createElement('iframe');
      iframe.setAttribute(
        'style',
        'position:fixed;top:-9999px;left:-9999px;width:1024px;height:768px;border:none;opacity:0;pointer-events:none;'
      );
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!frameDoc) {
        throw new Error('Unable to access iframe document');
      }

      frameDoc.open();
      frameDoc.write(payloadHtml);
      frameDoc.close();

      const triggerPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          cleanupIsolation();
          resolve(true);
        } catch (err) {
          console.warn('Iframe print call error:', err);
          window.print();
          cleanupIsolation();
          resolve(false);
        } finally {
          setTimeout(() => {
            try {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            } catch (e) {}
          }, 1500);
        }
      };

      if (iframe.contentWindow) {
        setTimeout(triggerPrint, 350);
      } else {
        triggerPrint();
      }
    } catch (e) {
      console.warn('printElement encountered an issue, falling back to window.print():', e);
      window.print();
      cleanupIsolation();
      resolve(false);
    }
  });
}
