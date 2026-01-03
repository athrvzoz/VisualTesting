const fs = require('fs-extra');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType } = require('docx');
const { chromium } = require('playwright');

async function generateWordDoc() {
    console.log('🚀 Starting Word document generation from backend...');

    const docPath = path.join(__dirname, '../DOCUMENTATION.md');
    const outputPath = path.join(__dirname, '../Visual_Testing_Tool_Documentation.docx');
    const tempImgDir = path.join(__dirname, 'temp_images');

    if (!await fs.pathExists(docPath)) {
        console.error(`❌ DOCUMENTATION.md not found at ${docPath}!`);
        return;
    }

    await fs.ensureDir(tempImgDir);

    const content = await fs.readFile(docPath, 'utf8');
    const lines = content.split('\n');

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Helper to render mermaid
    async function renderMermaid(code, index) {
        // Simple HTML with mermaid.js to render the diagram
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
                <style>
                    body { background: white; margin: 0; padding: 20px; }
                    .mermaid { display: inline-block; }
                </style>
            </head>
            <body>
                <div class="mermaid">
                    ${code}
                </div>
                <script>
                    mermaid.initialize({ startOnLoad: true, theme: 'default' });
                </script>
            </body>
            </html>
        `;
        await page.setContent(html);
        try {
            await page.waitForSelector('.mermaid svg', { timeout: 10000 });
            const element = await page.$('.mermaid');
            const imgPath = path.join(tempImgDir, `mermaid_${index}.png`);
            await element.screenshot({ path: imgPath });
            return imgPath;
        } catch (e) {
            console.error(`Failed to render mermaid diagram ${index}:`, e.message);
            return null;
        }
    }

    const docItems = [];
    let isMermaid = false;
    let currentMermaidBlock = '';
    let mermaidCounter = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim().startsWith('```mermaid')) {
            isMermaid = true;
            currentMermaidBlock = '';
            continue;
        }

        if (isMermaid) {
            if (line.trim() === '```') {
                isMermaid = false;
                console.log(`📊 Rendering Mermaid diagram ${mermaidCounter + 1}...`);
                const imgPath = await renderMermaid(currentMermaidBlock, mermaidCounter);
                if (imgPath) {
                    docItems.push({ type: 'image', path: imgPath });
                }
                mermaidCounter++;
            } else {
                currentMermaidBlock += line + '\n';
            }
            continue;
        }

        if (line.trim().startsWith('```')) {
            let codeBlock = '';
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeBlock += lines[i] + '\n';
                i++;
            }
            docItems.push({ type: 'code', text: codeBlock });
            continue;
        }

        if (line.trim().startsWith('|')) {
            const tableRows = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                if (!lines[i].includes('---')) {
                    const cells = lines[i].split('|').filter((c, idx, arr) => idx !== 0 && idx !== arr.length - 1).map(c => c.trim());
                    if (cells.length > 0) tableRows.push(cells);
                }
                i++;
            }
            if (tableRows.length > 0) docItems.push({ type: 'table', rows: tableRows });
            i--;
            continue;
        }

        if (line.trim() === '') {
            // Add a spacer or ignore
            continue;
        }

        docItems.push({ type: 'text', text: line });
    }

    await browser.close();

    const docChildren = [];

    for (const item of docItems) {
        if (item.type === 'text') {
            if (item.text.startsWith('# ')) {
                docChildren.push(new Paragraph({ text: item.text.replace('# ', ''), heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));
            } else if (item.text.startsWith('## ')) {
                docChildren.push(new Paragraph({ text: item.text.replace('## ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } }));
            } else if (item.text.startsWith('### ')) {
                docChildren.push(new Paragraph({ text: item.text.replace('### ', ''), heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 } }));
            } else if (item.text.trim().startsWith('- ') || item.text.trim().startsWith('* ')) {
                docChildren.push(new Paragraph({ text: item.text.replace(/^[-*]\s+/, ''), bullet: { level: 0 }, spacing: { after: 120 } }));
            } else {
                docChildren.push(new Paragraph({ children: [new TextRun(item.text)], spacing: { after: 150 } }));
            }
        } else if (item.type === 'image') {
            const image = new ImageRun({
                data: await fs.readFile(item.path),
                transformation: { width: 500, height: 350 },
            });
            docChildren.push(new Paragraph({ children: [image], alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 } }));
        } else if (item.type === 'table') {
            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: item.rows.map(row => new TableRow({
                    children: row.map(cell => new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
                        shading: { fill: 'F5F5F5' },
                        margins: { top: 100, bottom: 100, left: 100, right: 100 }
                    }))
                }))
            });
            docChildren.push(table);
            docChildren.push(new Paragraph({ spacing: { after: 200 } }));
        } else if (item.type === 'code') {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: item.text, font: 'Courier New', size: 18 })],
                shading: { fill: 'F0F0F0' },
                spacing: { before: 100, after: 100 }
            }));
        }
    }

    const doc = new Document({
        sections: [{
            children: docChildren
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    await fs.writeFile(outputPath, buffer);

    await fs.remove(tempImgDir);
    console.log(`✅ Word document created at: ${outputPath}`);
}

generateWordDoc().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
