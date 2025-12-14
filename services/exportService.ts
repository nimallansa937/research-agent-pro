// Export Service - PDF and DOC generation
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, Packer } from 'docx';
import { saveAs } from 'file-saver';

// Convert markdown to plain sections for export
interface ParsedSection {
    type: 'heading' | 'paragraph' | 'list' | 'table' | 'code';
    level?: number;
    content: string;
    items?: string[];
    rows?: string[][];
}

const parseMarkdown = (markdown: string): ParsedSection[] => {
    const sections: ParsedSection[] = [];
    const lines = markdown.split('\n');
    let currentList: string[] = [];
    let currentTable: string[][] = [];
    let inTable = false;
    let inCodeBlock = false;
    let codeContent = '';

    for (const line of lines) {
        // Handle code blocks
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                sections.push({ type: 'code', content: codeContent.trim() });
                codeContent = '';
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeContent += line + '\n';
            continue;
        }

        // Handle headers
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
            // Flush any pending list
            if (currentList.length > 0) {
                sections.push({ type: 'list', content: '', items: [...currentList] });
                currentList = [];
            }
            // Flush any pending table
            if (inTable && currentTable.length > 0) {
                sections.push({ type: 'table', content: '', rows: [...currentTable] });
                currentTable = [];
                inTable = false;
            }
            sections.push({
                type: 'heading',
                level: headingMatch[1].length,
                content: headingMatch[2],
            });
            continue;
        }

        // Handle table rows
        if (line.startsWith('|') && line.endsWith('|')) {
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            // Skip separator row
            if (!cells.every(c => c.match(/^[-:]+$/))) {
                currentTable.push(cells);
                inTable = true;
            }
            continue;
        } else if (inTable) {
            sections.push({ type: 'table', content: '', rows: [...currentTable] });
            currentTable = [];
            inTable = false;
        }

        // Handle list items
        const listMatch = line.match(/^[\s]*[-*•]\s+(.+)/);
        if (listMatch) {
            currentList.push(listMatch[1]);
            continue;
        } else if (currentList.length > 0) {
            sections.push({ type: 'list', content: '', items: [...currentList] });
            currentList = [];
        }

        // Handle paragraphs
        if (line.trim()) {
            sections.push({ type: 'paragraph', content: line.trim() });
        }
    }

    // Flush remaining
    if (currentList.length > 0) {
        sections.push({ type: 'list', content: '', items: currentList });
    }
    if (currentTable.length > 0) {
        sections.push({ type: 'table', content: '', rows: currentTable });
    }

    return sections;
};

// Clean markdown formatting for plain text
const cleanMarkdown = (text: string): string => {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold
        .replace(/\*(.+?)\*/g, '$1')      // Italic
        .replace(/`(.+?)`/g, '$1')        // Inline code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // Links
        .trim();
};

// Export to PDF
export const exportToPDF = async (
    content: string,
    title: string,
    generatedAt: string
): Promise<void> => {
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPosition = margin;

    // Helper to add new page if needed
    const checkPageBreak = (height: number) => {
        if (yPosition + height > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
            return true;
        }
        return false;
    };

    // Header
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text('RESEARCH REPORT', margin, 12);

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(title, contentWidth);
    pdf.text(titleLines, margin, 24);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${generatedAt}`, margin, 35);

    yPosition = 50;
    pdf.setTextColor(0, 0, 0);

    // Parse and render content
    const sections = parseMarkdown(content);

    for (const section of sections) {
        switch (section.type) {
            case 'heading':
                checkPageBreak(15);
                const sizes: Record<number, number> = { 1: 16, 2: 14, 3: 12, 4: 11, 5: 10, 6: 10 };
                const fontSize = sizes[section.level || 2] || 12;
                pdf.setFontSize(fontSize);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(79, 70, 229);
                yPosition += 6;
                const headingText = cleanMarkdown(section.content);
                pdf.text(headingText, margin, yPosition);
                yPosition += fontSize * 0.5 + 4;
                pdf.setTextColor(0, 0, 0);
                break;

            case 'paragraph':
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                const text = cleanMarkdown(section.content);
                const lines = pdf.splitTextToSize(text, contentWidth);
                for (const line of lines) {
                    checkPageBreak(6);
                    pdf.text(line, margin, yPosition);
                    yPosition += 5;
                }
                yPosition += 3;
                break;

            case 'list':
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                for (const item of section.items || []) {
                    checkPageBreak(6);
                    const itemText = `• ${cleanMarkdown(item)}`;
                    const itemLines = pdf.splitTextToSize(itemText, contentWidth - 5);
                    for (let i = 0; i < itemLines.length; i++) {
                        pdf.text(itemLines[i], margin + (i > 0 ? 3 : 0), yPosition);
                        yPosition += 5;
                    }
                }
                yPosition += 3;
                break;

            case 'table':
                if (section.rows && section.rows.length > 0) {
                    pdf.setFontSize(8);
                    const rows = section.rows;
                    const colCount = rows[0].length;
                    const colWidth = contentWidth / colCount;
                    const rowHeight = 7;

                    for (let r = 0; r < rows.length; r++) {
                        checkPageBreak(rowHeight + 2);

                        // Header row styling
                        if (r === 0) {
                            pdf.setFillColor(240, 240, 250);
                            pdf.rect(margin, yPosition - 4, contentWidth, rowHeight, 'F');
                            pdf.setFont('helvetica', 'bold');
                        } else {
                            pdf.setFont('helvetica', 'normal');
                        }

                        for (let c = 0; c < rows[r].length; c++) {
                            const cellX = margin + c * colWidth;
                            const cellText = cleanMarkdown(rows[r][c]).substring(0, 30);
                            pdf.text(cellText, cellX + 2, yPosition);
                        }
                        yPosition += rowHeight;
                    }
                    yPosition += 4;
                }
                break;

            case 'code':
                checkPageBreak(20);
                pdf.setFillColor(245, 245, 245);
                pdf.setFontSize(8);
                pdf.setFont('courier', 'normal');
                const codeLines = section.content.split('\n').slice(0, 10);
                const codeHeight = codeLines.length * 4 + 6;
                pdf.rect(margin, yPosition - 3, contentWidth, codeHeight, 'F');
                for (const codeLine of codeLines) {
                    pdf.text(codeLine.substring(0, 80), margin + 3, yPosition);
                    yPosition += 4;
                }
                yPosition += 6;
                pdf.setFont('helvetica', 'normal');
                break;
        }
    }

    // Footer on each page
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
            `Page ${i} of ${pageCount} • ResearchAgent Pro`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    // Save the PDF
    pdf.save(`${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}_report.pdf`);
};

// Export to DOCX
export const exportToDOC = async (
    content: string,
    title: string,
    generatedAt: string
): Promise<void> => {
    const sections = parseMarkdown(content);
    const docElements: (Paragraph | Table)[] = [];

    // Title
    docElements.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'RESEARCH REPORT',
                    size: 20,
                    color: '6366F1',
                    bold: true,
                }),
            ],
            spacing: { after: 100 },
        })
    );

    docElements.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: title,
                    size: 36,
                    bold: true,
                }),
            ],
            heading: HeadingLevel.TITLE,
            spacing: { after: 200 },
        })
    );

    docElements.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Generated: ${generatedAt}`,
                    size: 18,
                    color: '666666',
                }),
            ],
            spacing: { after: 400 },
        })
    );

    // Content
    for (const section of sections) {
        switch (section.type) {
            case 'heading':
                const headingLevels: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
                    1: HeadingLevel.HEADING_1,
                    2: HeadingLevel.HEADING_2,
                    3: HeadingLevel.HEADING_3,
                    4: HeadingLevel.HEADING_4,
                    5: HeadingLevel.HEADING_5,
                    6: HeadingLevel.HEADING_6,
                };
                docElements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: cleanMarkdown(section.content),
                                bold: true,
                                color: '4F46E5',
                            }),
                        ],
                        heading: headingLevels[section.level || 2] || HeadingLevel.HEADING_2,
                        spacing: { before: 240, after: 120 },
                    })
                );
                break;

            case 'paragraph':
                docElements.push(
                    new Paragraph({
                        children: [new TextRun({ text: cleanMarkdown(section.content) })],
                        spacing: { after: 120 },
                    })
                );
                break;

            case 'list':
                for (const item of section.items || []) {
                    docElements.push(
                        new Paragraph({
                            children: [new TextRun({ text: cleanMarkdown(item) })],
                            bullet: { level: 0 },
                            spacing: { after: 60 },
                        })
                    );
                }
                break;

            case 'table':
                if (section.rows && section.rows.length > 0) {
                    const tableRows = section.rows.map((row, rowIndex) =>
                        new TableRow({
                            children: row.map(
                                (cell) =>
                                    new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: cleanMarkdown(cell),
                                                        bold: rowIndex === 0,
                                                    }),
                                                ],
                                            }),
                                        ],
                                        width: { size: 100 / row.length, type: WidthType.PERCENTAGE },
                                        shading: rowIndex === 0 ? { fill: 'E0E7FF' } : undefined,
                                    })
                            ),
                        })
                    );

                    docElements.push(
                        new Table({
                            rows: tableRows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                        })
                    );
                    docElements.push(new Paragraph({ children: [], spacing: { after: 200 } }));
                }
                break;

            case 'code':
                docElements.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: section.content,
                                font: 'Courier New',
                                size: 18,
                            }),
                        ],
                        shading: { fill: 'F5F5F5' },
                        spacing: { before: 120, after: 120 },
                    })
                );
                break;
        }
    }

    // Footer
    docElements.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '---',
                    color: 'CCCCCC',
                }),
            ],
            spacing: { before: 400 },
        })
    );
    docElements.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Generated by ResearchAgent Pro',
                    size: 16,
                    color: '999999',
                    italics: true,
                }),
            ],
        })
    );

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: docElements,
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}_report.docx`);
};

// Export to BibTeX
export const exportToBibTeX = async (
    content: string,
    title: string
): Promise<void> => {
    // Extract citations using regex heuristics
    // Looking for patterns like: Author, A. (Year). Title. Source.
    const citationRegex = /([A-Z][a-z]+(?:,\s+[A-Z]\.)?(?:,\s+&?\s+[A-Z][a-z]+(?:,\s+[A-Z]\.)?)*)\s*\((\d{4})\)\.\s*(.+?)\.\s*(.+?)(?:\.|$)/g;

    let bibtex = `% Bibliography for: ${title}\n% Generated by ResearchAgent Pro\n\n`;
    let match;
    let index = 1;

    // Scan the content for citation-like strings
    while ((match = citationRegex.exec(content)) !== null) {
        const [_, author, year, articleTitle, journal] = match;
        const key = `${author.split(',')[0].toLowerCase()}${year}${index++}`;

        bibtex += `@article{${key},\n`;
        bibtex += `  author = {${author}},\n`;
        bibtex += `  year = {${year}},\n`;
        bibtex += `  title = {${articleTitle}},\n`;
        bibtex += `  journal = {${journal}}\n`;
        bibtex += `}\n\n`;
    }

    if (index === 1) {
        // Fallback: try to find lines in "References" or "Sources" sections
        const lines = content.split('\n');
        let inRefs = false;

        for (const line of lines) {
            if (line.match(/^#+\s*(References|Sources|Bibliography|Citations)/i)) {
                inRefs = true;
                continue;
            }

            if (inRefs && line.trim().match(/^[0-9\-\*\•]/)) {
                // Heuristic parsing for list items
                const cleanLine = line.replace(/^[0-9\-\*\•\.]\s*/, '').trim();
                const yearMatch = cleanLine.match(/\((\d{4})\)/);
                if (yearMatch) {
                    const year = yearMatch[1];
                    const parts = cleanLine.split('(');
                    const author = parts[0].trim();
                    const rest = cleanLine.substring(cleanLine.indexOf(')') + 1).trim();
                    const key = `${author.split(/\s+/)[0].toLowerCase()}${year}${index++}`;

                    bibtex += `@misc{${key},\n`;
                    bibtex += `  author = {${author}},\n`;
                    bibtex += `  year = {${year}},\n`;
                    bibtex += `  title = {${rest}}\n`;
                    bibtex += `}\n\n`;
                }
            }
        }
    }

    const blob = new Blob([bibtex], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}_citations.bib`);
};
