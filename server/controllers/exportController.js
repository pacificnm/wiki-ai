import { Document as DocxDocument, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { markdownToTxt } from 'markdown-to-txt';
import puppeteer from 'puppeteer';
import { logger } from '../middleware/logger.js';
import Document from '../models/Document.js';

/**
 * Generate PDF from document content
 */
export const exportToPDF = async (req, res) => {
  let browser = null;

  try {
    const { id } = req.params;

    // Get document data
    const document = await Document.findById(id)
      .populate('userId', 'displayName email')
      .populate('categoryIds', 'name description color')
      .populate('currentVersionId', 'markdown');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions - users can only export their own documents or published documents
    if (req.user.role !== 'admin' &&
      document.userId._id.toString() !== req.user.dbUser._id.toString() &&
      !document.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    logger.info('Generating PDF export', {
      documentId: id,
      title: document.title
    });

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Create HTML content with proper styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${document.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
          }
          h1 { 
            color: #1a1a1a; 
            border-bottom: 2px solid #e0e0e0; 
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          h2 { 
            color: #2c2c2c; 
            margin-top: 30px;
            margin-bottom: 15px;
          }
          h3 { 
            color: #4a4a4a; 
            margin-top: 25px;
            margin-bottom: 10px;
          }
          p { 
            margin-bottom: 15px; 
            text-align: justify;
          }
          .document-meta {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .document-meta h4 {
            margin: 0 0 10px 0;
            color: #333;
          }
          .categories {
            margin: 10px 0;
          }
          .category {
            display: inline-block;
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-right: 5px;
          }
          .tags {
            margin: 10px 0;
          }
          .tag {
            display: inline-block;
            background-color: #f5f5f5;
            color: #666;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-right: 5px;
            border: 1px solid #ddd;
          }
          code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
          }
          pre {
            background-color: #f8f8f8;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #e0e0e0;
          }
          blockquote {
            border-left: 4px solid #ddd;
            margin: 20px 0;
            padding: 10px 20px;
            background-color: #f9f9f9;
            font-style: italic;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          @media print {
            body { margin: 0; }
            .document-meta { 
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="document-meta">
          <h4>Document Information</h4>
          <p><strong>Title:</strong> ${document.title}</p>
          <p><strong>Author:</strong> ${document.userId?.displayName || document.userId?.email || 'Unknown'}</p>
          <p><strong>Created:</strong> ${new Date(document.createdAt).toLocaleDateString()}</p>
          <p><strong>Last Updated:</strong> ${new Date(document.updatedAt).toLocaleDateString()}</p>
          ${document.description ? `<p><strong>Description:</strong> ${document.description}</p>` : ''}
          ${document.categoryIds?.length ? `
            <div class="categories">
              <strong>Categories:</strong>
              ${document.categoryIds.map(cat => `<span class="category">${cat.name}</span>`).join('')}
            </div>
          ` : ''}
          ${document.tags?.length ? `
            <div class="tags">
              <strong>Tags:</strong>
              ${document.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        
        <h1>${document.title}</h1>
        ${convertMarkdownToHTML(document.currentVersionId?.markdown || 'No content available.')}
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });

    await browser.close();

    // Set response headers
    const filename = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    logger.info('PDF export completed', {
      documentId: id,
      filename,
      size: pdfBuffer.length
    });

    // Send as binary data
    res.end(pdfBuffer, 'binary');

  } catch (error) {
    if (browser) {
      await browser.close().catch(() => { });
    }

    logger.error('PDF export failed', {
      error: error.message,
      documentId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
  return null;
};

/**
 * Generate Word document from document content
 */
export const exportToWord = async (req, res) => {
  try {
    const { id } = req.params;

    // Get document data
    const document = await Document.findById(id)
      .populate('userId', 'displayName email')
      .populate('categoryIds', 'name description color')
      .populate('currentVersionId', 'markdown');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions - users can only export their own documents or published documents
    if (req.user.role !== 'admin' &&
      document.userId._id.toString() !== req.user.dbUser._id.toString() &&
      !document.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    logger.info('Generating Word export', {
      documentId: id,
      title: document.title
    });

    // Convert markdown to plain text and structure
    const plainText = markdownToTxt(document.currentVersionId?.markdown || 'No content available.');
    const lines = plainText.split('\n').filter(line => line.trim());

    // Create document structure
    const children = [];

    // Add document metadata
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Document Information',
            bold: true,
            size: 28
          })
        ],
        heading: HeadingLevel.HEADING_2
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Title: ', bold: true }),
          new TextRun({ text: document.title })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Author: ', bold: true }),
          new TextRun({ text: document.userId?.displayName || document.userId?.email || 'Unknown' })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Created: ', bold: true }),
          new TextRun({ text: new Date(document.createdAt).toLocaleDateString() })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Last Updated: ', bold: true }),
          new TextRun({ text: new Date(document.updatedAt).toLocaleDateString() })
        ]
      })
    );

    if (document.description) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Description: ', bold: true }),
            new TextRun({ text: document.description })
          ]
        })
      );
    }

    if (document.categoryIds?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Categories: ', bold: true }),
            new TextRun({ text: document.categoryIds.map(cat => cat.name).join(', ') })
          ]
        })
      );
    }

    if (document.tags?.length) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Tags: ', bold: true }),
            new TextRun({ text: document.tags.join(', ') })
          ]
        })
      );
    }

    // Add spacing
    children.push(new Paragraph({ text: '' }));

    // Add main title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: document.title,
            bold: true,
            size: 32
          })
        ],
        heading: HeadingLevel.HEADING_1
      })
    );

    // Process content lines
    for (const line of lines) {
      if (line.trim() === '') {
        children.push(new Paragraph({ text: '' }));
      } else if (line.startsWith('# ')) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(2),
                bold: true,
                size: 28
              })
            ],
            heading: HeadingLevel.HEADING_1
          })
        );
      } else if (line.startsWith('## ')) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(3),
                bold: true,
                size: 24
              })
            ],
            heading: HeadingLevel.HEADING_2
          })
        );
      } else if (line.startsWith('### ')) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(4),
                bold: true,
                size: 20
              })
            ],
            heading: HeadingLevel.HEADING_3
          })
        );
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line })]
          })
        );
      }
    }

    // Create the document
    const doc = new DocxDocument({
      sections: [{
        properties: {},
        children: children
      }]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Set response headers
    const filename = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info('Word export completed', {
      documentId: id,
      filename,
      size: buffer.length
    });

    res.send(buffer);

  } catch (error) {
    logger.error('Word export failed', {
      error: error.message,
      documentId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate Word document',
      error: error.message
    });
  }
  return null;
};

/**
 * Simple markdown to HTML converter for PDF generation
 */
function convertMarkdownToHTML(markdown) {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
  html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>');

  // Line breaks
  html = html.replace(/\n\n/gim, '</p><p>');
  html = html.replace(/\n/gim, '<br>');

  // Wrap in paragraphs
  html = '<p>' + html + '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/gim, '');
  html = html.replace(/<p><br><\/p>/gim, '');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

  return html;
}
