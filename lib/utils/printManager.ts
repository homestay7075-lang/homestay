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

    // 1. Check for native Android WebView bridge first
    if ((window as any).AndroidApp && typeof (window as any).AndroidApp.printPage === 'function') {
      try {
        options.onBeforePrint?.();
        (window as any).AndroidApp.printPage();
        options.onAfterPrint?.();
        resolve(true);
        return;
      } catch (e) {
        console.warn('Native AndroidApp.printPage failed, falling back to iframe print:', e);
      }
    }

    // 2. Resolve target element
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

    try {
      // 3. Create isolated offscreen iframe
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

      // 4. Extract all active style tags and linked stylesheets from main document
      let collectedStyles = '';
      const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
      styleElements.forEach((el) => {
        collectedStyles += el.outerHTML + '\n';
      });

      // 5. Clone target element content
      const clonedNode = element.cloneNode(true) as HTMLElement;
      // If the node had 'hidden' or 'display: none', remove it for the print view
      clonedNode.classList.remove('hidden');
      clonedNode.style.display = 'block';
      clonedNode.style.visibility = 'visible';

      // 6. Build self-contained HTML payload
      const title = options.title || document.title || 'Print Document';
      const pageMargin = options.pageMargin || '10mm 12mm';
      const orientation = options.landscape ? 'A4 landscape' : 'A4 portrait';

      frameDoc.open();
      frameDoc.write(`
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
                margin: 0 !important;
                padding: 0 !important;
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
      `);
      frameDoc.close();

      // 7. Allow stylesheets and fonts to parse and render
      const triggerPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          options.onAfterPrint?.();
          resolve(true);
        } catch (err) {
          console.warn('Iframe print call error:', err);
          window.print();
          options.onAfterPrint?.();
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

      // Ensure styles are applied before printing
      if (iframe.contentWindow) {
        setTimeout(triggerPrint, 350);
      } else {
        triggerPrint();
      }
    } catch (e) {
      console.warn('printElement encountered an issue, falling back to window.print():', e);
      window.print();
      options.onAfterPrint?.();
      resolve(false);
    }
  });
}
