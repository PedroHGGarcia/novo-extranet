export interface TextLine {
  text: string
  size: number
  bold: boolean
  indent: number
  gapAfter: number
}

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN_X = 50
const MARGIN_Y = 50
const LINE_HEIGHT = 14

function escapePdfText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r/g, '')
}

export function wrapText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text]
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current)
      if (word.length > maxChars) {
        let remaining = word
        while (remaining.length > maxChars) {
          lines.push(remaining.substring(0, maxChars))
          remaining = remaining.substring(maxChars)
        }
        current = remaining
      } else {
        current = word
      }
    } else {
      current = current ? current + ' ' + word : word
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

export function getMaxChars(size: number, indent: number): number {
  return Math.floor((PAGE_WIDTH - 2 * MARGIN_X - indent) / (0.6 * size))
}

export function paginateLines(lines: TextLine[]): TextLine[][] {
  const availHeight = PAGE_HEIGHT - 2 * MARGIN_Y
  const pages: TextLine[][] = []
  let current: TextLine[] = []
  let height = availHeight
  for (const line of lines) {
    const lh = LINE_HEIGHT + line.gapAfter
    if (height < lh && current.length > 0) {
      pages.push(current)
      current = []
      height = availHeight
    }
    current.push(line)
    height -= lh
  }
  if (current.length > 0) pages.push(current)
  return pages.length > 0 ? pages : [[]]
}

export function buildPdf(pages: TextLine[][]): Blob {
  let nextNum = 1
  const catalogNum = nextNum++
  const pagesObjNum = nextNum++
  const f1Num = nextNum++
  const f2Num = nextNum++
  const pageObjNums: number[] = []
  const contentObjNums: number[] = []
  for (let i = 0; i < pages.length; i++) {
    pageObjNums.push(nextNum++)
    contentObjNums.push(nextNum++)
  }
  const totalObjs = nextNum - 1

  const contentStreams = pages.map((pageLines) => {
    let y = PAGE_HEIGHT - MARGIN_Y
    let stream = 'BT\n'
    for (const line of pageLines) {
      const font = line.bold ? '/F2' : '/F1'
      stream += `${font} ${line.size} Tf\n`
      stream += `1 0 0 1 ${MARGIN_X + line.indent} ${y} Tm\n`
      stream += `(${escapePdfText(line.text)}) Tj\n`
      y -= LINE_HEIGHT + line.gapAfter
    }
    stream += 'ET'
    return stream
  })

  const objContents = new Map<number, string>()
  objContents.set(catalogNum, `<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>`)
  const kids = pageObjNums.map((n) => `${n} 0 R`).join(' ')
  objContents.set(pagesObjNum, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`)
  objContents.set(f1Num, `<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>`)
  objContents.set(f2Num, `<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>`)
  for (let i = 0; i < pages.length; i++) {
    objContents.set(
      pageObjNums[i],
      `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${f1Num} 0 R /F2 ${f2Num} 0 R >> >> /Contents ${contentObjNums[i]} 0 R >>`,
    )
    objContents.set(
      contentObjNums[i],
      `<< /Length ${contentStreams[i].length} >>\nstream\n${contentStreams[i]}\nendstream`,
    )
  }

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = new Array(totalObjs + 1).fill(0)
  for (let num = 1; num <= totalObjs; num++) {
    offsets[num] = pdf.length
    pdf += `${num} 0 obj\n${objContents.get(num)}\nendobj\n`
  }
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`
  for (let num = 1; num <= totalObjs; num++) {
    pdf += `${String(offsets[num]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${totalObjs + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}
