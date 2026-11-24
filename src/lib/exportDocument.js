// Builds downloadable PDF, Word and CSV files from one simple description:
//   { title, subtitle, filename, sections: [{ title, note?, head: [...], rows: [[...]] }] }
// The PDF and Word libraries are loaded only when a download is requested.

const GREEN = [38, 92, 69]
const text = (value) => String(value ?? '').replace(/→/g, '->').replace(/\s+/g, ' ').trim()

function save(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportPdf(doc) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  const width = pdf.internal.pageSize.getWidth()

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.setTextColor(27, 58, 42)
  pdf.text(text(doc.title), margin, 52)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(111, 125, 114)
  if (doc.subtitle) pdf.text(text(doc.subtitle), margin, 70)

  let y = 94
  for (const section of doc.sections) {
    if (y > pdf.internal.pageSize.getHeight() - 110) { pdf.addPage(); y = 52 }
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(27, 58, 42)
    pdf.text(text(section.title), margin, y)
    if (section.note) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(111, 125, 114)
      pdf.text(text(section.note), margin, y + 13)
    }
    const body = section.rows.length ? section.rows.map((row) => row.map(text)) : [[{ content: 'No data.', colSpan: section.head.length }]]
    autoTable(pdf, {
      startY: y + (section.note ? 20 : 8),
      head: [section.head.map(text)],
      body,
      margin: { left: margin, right: margin },
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [45, 59, 51] },
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [246, 249, 242] },
    })
    y = pdf.lastAutoTable.finalY + 26
  }

  const pages = pdf.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(140, 150, 142)
    pdf.text(`AgriVista · Page ${i} of ${pages}`, width / 2, pdf.internal.pageSize.getHeight() - 22, { align: 'center' })
  }
  pdf.save(`${doc.filename}.pdf`)
}

export async function exportDocx(doc) {
  const { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } = await import('docx')
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'DDE4D9' }
  const borders = { top: border, bottom: border, left: border, right: border }

  const cell = (value, { header = false, last = false } = {}) => new TableCell({
    borders,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: header ? { type: ShadingType.CLEAR, color: 'auto', fill: '265C45' } : undefined,
    children: [new Paragraph({
      alignment: last ? AlignmentType.LEFT : AlignmentType.LEFT,
      children: [new TextRun({ text: text(value), bold: header, color: header ? 'FFFFFF' : '2D3B33', size: 19 })],
    })],
  })

  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: text(doc.title), bold: true, color: '1B3A2A' })] }),
  ]
  if (doc.subtitle) children.push(new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: text(doc.subtitle), color: '6F7D72', size: 20 })] }))

  for (const section of doc.sections) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 80 }, children: [new TextRun({ text: text(section.title), bold: true, color: '1B3A2A' })] }))
    if (section.note) children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: text(section.note), color: '6F7D72', size: 18 })] }))
    const rows = [new TableRow({ tableHeader: true, children: section.head.map((h) => cell(h, { header: true })) })]
    if (section.rows.length === 0) rows.push(new TableRow({ children: [new TableCell({ borders, columnSpan: section.head.length, children: [new Paragraph({ children: [new TextRun({ text: 'No data.', color: '6F7D72', size: 19 })] })] })] }))
    for (const row of section.rows) rows.push(new TableRow({ children: row.map((value) => cell(value)) }))
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }))
  }

  const file = new Document({
    creator: 'AgriVista',
    title: text(doc.title),
    styles: { default: { document: { run: { font: 'Calibri', size: 21 } } } },
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } }, children }],
  })
  save(await Packer.toBlob(file), `${doc.filename}.docx`)
}

export function exportCsv(doc) {
  const cell = (value) => {
    const textValue = String(value ?? '')
    return /[",\n]/.test(textValue) ? `"${textValue.replace(/"/g, '""')}"` : textValue
  }
  const lines = [cell(doc.title)]
  if (doc.subtitle) lines.push(cell(doc.subtitle))
  lines.push('')
  for (const section of doc.sections) {
    lines.push(cell(section.title), section.head.map(cell).join(','))
    for (const row of section.rows) lines.push(row.map(cell).join(','))
    lines.push('')
  }
  save(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `${doc.filename}.csv`)
}

export const EXPORTERS = { pdf: exportPdf, docx: exportDocx, csv: async (doc) => exportCsv(doc) }
