/**
 * exportUtils.js
 * Comprehensive client-side document export utilities for Manticao Public Market RMS.
 * Supports exporting official forms, contracts, permits, statements, and reports to:
 * 1. Microsoft Word (.doc) with native Office HTML/XML styling & table formatting
 * 2. PDF Document (Vector print / jsPDF download)
 * 3. High-fidelity browser printing
 */

import { jsPDF } from 'jspdf'

/**
 * Clean and prepare HTML content for Microsoft Word export.
 * Strips script tags, action buttons, toolbars, and inputs, converting checkboxes and inputs to readable text.
 */
function prepareHtmlForWord(element) {
  // Clone the element so we don't mutate the live DOM
  const clone = element.cloneNode(true)

  // Remove non-printable elements
  const removeSelectors = [
    '.no-print',
    '.toolbar-actions',
    '.modal-control-bar',
    '.btn-close-modal',
    '.close-btn',
    '.modal-actions button',
    'button',
    '.hazard-callout-actions',
    '.form-modal-toolbar',
    '.loi-toolbar',
    '.dossier-toolbar'
  ]
  removeSelectors.forEach(sel => {
    clone.querySelectorAll(sel).forEach(el => el.remove())
  })

  // Replace input elements with their values
  clone.querySelectorAll('input, textarea, select').forEach(input => {
    const parent = input.parentNode
    if (input.type === 'checkbox') {
      const span = document.createElement('span')
      span.textContent = input.checked ? '[X] ' : '[ ] '
      span.style.fontFamily = 'monospace'
      span.style.fontWeight = 'bold'
      parent.replaceChild(span, input)
    } else if (input.type === 'radio') {
      const span = document.createElement('span')
      span.textContent = input.checked ? '(O) ' : '( ) '
      parent.replaceChild(span, input)
    } else {
      const span = document.createElement('span')
      span.textContent = input.value || input.placeholder || '____________________'
      span.style.borderBottom = '1px solid #000'
      span.style.padding = '0 4px'
      parent.replaceChild(span, input)
    }
  })

  // Ensure SVGs or images retain baseline size
  clone.querySelectorAll('svg').forEach(svg => {
    svg.setAttribute('width', svg.getAttribute('width') || '60')
    svg.setAttribute('height', svg.getAttribute('height') || '60')
  })

  return clone.innerHTML
}

/**
 * Export any DOM element or container to Microsoft Word (.doc)
 * @param {HTMLElement|string} elementOrId - The DOM element or ID to export
 * @param {string} filename - Base filename without extension
 * @param {Object} options - Custom options (title, orientation, etc.)
 */
export function exportToWord(elementOrId, filename = 'Manticao_LGU_Document', options = {}) {
  let element = null
  if (typeof elementOrId === 'string') {
    element = document.getElementById(elementOrId) || document.querySelector(elementOrId)
  } else {
    element = elementOrId
  }

  if (!element) {
    console.error('[exportToWord] Target element not found:', elementOrId)
    return false
  }

  const title = options.title || filename.replace(/_/g, ' ')
  const isLandscape = options.orientation === 'landscape'
  const bodyContent = prepareHtmlForWord(element)

  const wordDocumentHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: ${isLandscape ? '11in 8.5in' : '8.5in 11in'};
      margin: 0.5in;
      mso-header-margin: 0.3in;
      mso-footer-margin: 0.3in;
    }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 10pt;
      line-height: 1.3;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4 {
      margin: 4pt 0;
      font-family: 'Calibri', 'Arial', sans-serif;
      color: #0f172a;
      text-transform: uppercase;
    }
    h1 { font-size: 14pt; font-weight: bold; text-align: center; }
    h2 { font-size: 12pt; font-weight: bold; }
    h3 { font-size: 11pt; font-weight: bold; }
    p { margin: 4pt 0; font-size: 10pt; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 8pt 0;
      font-size: 9.5pt;
    }
    th, td {
      border: 1pt solid #334155;
      padding: 4pt 6pt;
      vertical-align: top;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: left;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-mono { font-family: 'Courier New', monospace; }
    .sig-line {
      border-bottom: 1pt solid #000;
      width: 200pt;
      margin: 30pt auto 4pt auto;
    }
    .sig-block {
      text-align: center;
      margin-top: 20pt;
    }
    .status-badge, .tag {
      font-weight: bold;
      border: 1pt solid #64748b;
      padding: 2pt 4pt;
      display: inline-block;
    }
    .page-break-after {
      page-break-after: always;
      mso-break-type: section-break;
    }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>
`

  const blob = new Blob(['\ufeff', wordDocumentHtml], {
    type: 'application/msword;charset=utf-8'
  })

  const cleanFilename = `${filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}.doc`
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = cleanFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
  return true
}

/**
 * Export any DOM element to PDF using jsPDF and browser print fallback
 * @param {HTMLElement|string} elementOrId - The DOM element or ID
 * @param {string} filename - Base filename
 * @param {Object} options - Custom options (title, orientation)
 */
export function exportToPdf(elementOrId, filename = 'Manticao_LGU_Document', options = {}) {
  let element = null
  if (typeof elementOrId === 'string') {
    element = document.getElementById(elementOrId) || document.querySelector(elementOrId)
  } else {
    element = elementOrId
  }

  if (!element) {
    console.warn('[exportToPdf] Target element not found, falling back to window.print()')
    window.print()
    return false
  }

  // Use jsPDF html method
  try {
    const isLandscape = options.orientation === 'landscape'
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: 'letter'
    })

    const title = options.title || filename.replace(/_/g, ' ')

    // In browsers, triggering window.print() provides 100% vector accuracy for official multi-page LGU forms
    // We also provide direct PDF download via jsPDF
    doc.html(element, {
      callback: function (pdf) {
        pdf.save(`${filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}.pdf`)
      },
      x: 20,
      y: 20,
      width: isLandscape ? 750 : 570,
      windowWidth: 1000,
      autoPaging: 'text'
    })
    return true
  } catch (err) {
    console.warn('[exportToPdf] Falling back to standard print-to-PDF dialog:', err)
    window.print()
    return true
  }
}

/**
 * Print a specific element or document
 */
export function printElement(elementOrId) {
  window.print()
}

export default {
  exportToWord,
  exportToPdf,
  printElement
}
