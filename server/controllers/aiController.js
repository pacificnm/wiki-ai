import getOpenAI, { DEFAULT_MODEL } from '../config/openai.js';
import { logger } from '../middleware/logger.js';
import { cleanupFile, extractTextContent } from '../utils/fileProcessor.js';

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters for English text)
 */
const estimateTokens = (text) => {
  return Math.ceil(text.length / 4);
};

/**
 * Split content into chunks that fit within token limits
 */
const chunkContent = (content, maxTokens = 3000) => {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const testChunk = currentChunk + sentence + '.';

    if (estimateTokens(testChunk) > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + '.';
    } else {
      currentChunk = testChunk;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

/**
 * Generate document content using AI
 */
const generateDocument = async (req, res) => {
  try {
    const { prompt, model = DEFAULT_MODEL } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    // Get OpenAI client (this will validate the API key)
    let openai;
    try {
      openai = getOpenAI();
    } catch (configError) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI service not properly configured'
      });
    }

    // Create a detailed prompt for document generation
    const systemPrompt = `You are an expert technical writer and content creator. Generate high-quality documentation in Markdown format based on the user's instructions. 

Requirements:
1. Return a JSON object with the following structure:
   {
     "title": "Document Title",
     "content": "Markdown content here",
     "tags": ["tag1", "tag2", "tag3"]
   }
2. The title should be clear and descriptive
3. The content should be well-structured using proper Markdown formatting
4. Include relevant headings, bullet points, code blocks if applicable
5. Suggest 3-5 relevant tags
6. Make the content comprehensive and professional

User instructions: ${prompt}`;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    const generatedContent = completion.choices[0].message.content;

    // Try to parse as JSON, fallback to plain text if needed
    let result;
    try {
      result = JSON.parse(generatedContent);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      result = {
        title: 'AI Generated Document',
        content: generatedContent,
        tags: ['ai-generated', 'documentation']
      };
    }

    logger.info('Document generated successfully', {
      userId: req.user?.uid,
      model: model,
      promptLength: prompt.length,
      responseLength: generatedContent.length
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error generating document with AI', {
      userId: req.user?.uid,
      error: error.message,
      stack: error.stack
    });

    // Handle specific OpenAI errors
    let errorMessage = error.message || 'Failed to generate document';

    if (error.message && error.message.includes('429')) {
      if (error.message.includes('tokens per min')) {
        errorMessage = 'Rate limit exceeded. Please try with a shorter prompt or wait a moment before retrying.';
      } else {
        errorMessage = 'API rate limit exceeded. Please wait a moment before retrying.';
      }
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
  return null;
};

/**
 * Improve existing document content using AI
 */
const improveDocument = async (req, res) => {
  try {
    const { content, instructions, model = DEFAULT_MODEL, title } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Document content is required'
      });
    }

    if (!instructions) {
      return res.status(400).json({
        success: false,
        message: 'Improvement instructions are required'
      });
    }

    // Get OpenAI client (this will validate the API key)
    let openai;
    try {
      openai = getOpenAI();
    } catch (configError) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI service not properly configured'
      });
    }

    // Create a detailed prompt for document improvement
    const systemPrompt = `You are an expert technical writer and editor. Improve the provided document based on the user's specific instructions while maintaining the original structure and intent.

Requirements:
1. Return a JSON object with the following structure:
   {
     "title": "Improved title (if applicable)",
     "content": "Improved Markdown content",
     "tags": ["updated", "tag1", "tag2"]
   }
2. Only modify what's necessary based on the instructions
3. Maintain proper Markdown formatting
4. Preserve the document's core message and structure
5. Suggest relevant tags if improvements warrant new ones
6. Make improvements that enhance clarity, readability, and value

Current Title: ${title || 'Untitled Document'}

Current Content:
${content}

Improvement Instructions: ${instructions}`;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.5
    });

    const improvedContent = completion.choices[0].message.content;

    // Try to parse as JSON, fallback to structured response if needed
    let result;
    try {
      result = JSON.parse(improvedContent);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      result = {
        title: title || 'Improved Document',
        content: improvedContent,
        tags: ['improved', 'ai-enhanced']
      };
    }

    logger.info('Document improved successfully', {
      userId: req.user?.uid,
      model: model,
      instructionsLength: instructions.length,
      originalLength: content.length,
      improvedLength: result.content?.length || 0
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error improving document with AI', {
      userId: req.user?.uid,
      error: error.message,
      stack: error.stack
    });

    // Handle specific OpenAI errors
    let errorMessage = error.message || 'Failed to improve document';

    if (error.message && error.message.includes('429')) {
      if (error.message.includes('tokens per min')) {
        errorMessage = 'Rate limit exceeded. Please try with shorter content or instructions, or wait a moment before retrying.';
      } else {
        errorMessage = 'API rate limit exceeded. Please wait a moment before retrying.';
      }
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

/**
 * Process uploaded document and create Markdown based on user instructions
 */
const processUploadedDocument = async (req, res) => {
  let uploadedFilePath = null;

  try {
    const { instructions, model = DEFAULT_MODEL } = req.body;
    const uploadedFile = req.file;

    // Validate inputs
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    if (!instructions) {
      return res.status(400).json({
        success: false,
        message: 'Processing instructions are required'
      });
    }

    uploadedFilePath = uploadedFile.path;

    // Get OpenAI client (this will validate the API key)
    let openai;
    try {
      openai = getOpenAI();
    } catch (configError) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI service not properly configured'
      });
    }

    // Extract text content from the uploaded file
    let extractedData;
    try {
      extractedData = await extractTextContent(uploadedFilePath, uploadedFile.originalname);
    } catch (extractError) {
      return res.status(400).json({
        success: false,
        message: `Failed to process uploaded file: ${extractError.message}`
      });
    }

    // Check if content is too large and needs chunking
    const contentTokens = estimateTokens(extractedData.content);
    const maxInputTokens = 2500; // Leave room for system prompt and response

    let processedContent = '';
    let title = '';
    let tags = [];
    let summary = '';

    if (contentTokens > maxInputTokens) {
      // Content is too large, process in chunks
      const chunks = chunkContent(extractedData.content, maxInputTokens);

      logger.info('Processing large document in chunks', {
        userId: req.user?.uid,
        filename: uploadedFile.originalname,
        totalTokens: contentTokens,
        chunkCount: chunks.length
      });

      const processedChunks = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        const chunkPrompt = `You are an expert technical writer. Process this chunk (${i + 1}/${chunks.length}) of a larger document into well-formatted Markdown.

Original Document Info:
- Filename: ${extractedData.metadata.originalName}
- File Type: ${extractedData.metadata.extension}
- Chunk: ${i + 1} of ${chunks.length}

Instructions: ${instructions}

Content Chunk:
${chunk}

Return only the processed Markdown content for this chunk, without JSON structure. Focus on clarity and proper formatting.`;

        try {
          const completion = await openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: 'system',
                content: chunkPrompt
              }
            ],
            max_tokens: 1500,
            temperature: 0.6
          });

          processedChunks.push(completion.choices[0].message.content);

          // Add a small delay between chunks to respect rate limits
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (chunkError) {
          logger.error('Error processing chunk', {
            userId: req.user?.uid,
            chunkIndex: i,
            error: chunkError.message
          });

          // If a chunk fails, include a note about it
          processedChunks.push(`\n[Note: Chunk ${i + 1} could not be processed due to an error]\n`);
        }
      }

      // Combine all processed chunks
      processedContent = processedChunks.join('\n\n---\n\n');

      // Generate summary metadata for the complete document
      const summaryPrompt = `Based on this processed document content, provide a JSON response with title, tags, and summary:

{
  "title": "Descriptive title for the processed document",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "Brief summary of the document content"
}

Document filename: ${extractedData.metadata.originalName}
Instructions: ${instructions}

First 500 characters of content: ${processedContent.substring(0, 500)}...`;

      try {
        const summaryCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo', // Use faster model for metadata
          messages: [
            {
              role: 'system',
              content: summaryPrompt
            }
          ],
          max_tokens: 300,
          temperature: 0.5
        });

        const summaryResult = JSON.parse(summaryCompletion.choices[0].message.content);
        title = summaryResult.title || `Processed: ${extractedData.metadata.originalName}`;
        tags = summaryResult.tags || ['document-processing', 'ai-generated'];
        summary = summaryResult.summary || 'Large document processed and converted to Markdown format';
      } catch (summaryError) {
        // Fallback if summary generation fails
        title = `Processed: ${extractedData.metadata.originalName}`;
        tags = ['document-processing', 'ai-generated', 'large-document'];
        summary = 'Large document processed in chunks and converted to Markdown format';
      }

    } else {
      // Content is small enough to process at once
      const systemPrompt = `You are an expert technical writer and document processor. You will receive the content of an uploaded document and user instructions for how to process it into Markdown format.

Requirements:
1. Return a JSON object with the following structure:
   {
     "title": "Processed Document Title",
     "content": "Processed Markdown content",
     "tags": ["tag1", "tag2", "tag3"],
     "summary": "Brief summary of the processed content"
   }
2. The title should be descriptive and based on the content and instructions
3. The content should be well-structured Markdown with proper formatting
4. Include relevant headings, bullet points, code blocks, tables as appropriate
5. Suggest 3-5 relevant tags based on the content and processing
6. Provide a brief summary of what was processed
7. Follow the user's specific instructions for how to transform the content

Original Document Information:
- Filename: ${extractedData.metadata.originalName}
- File Type: ${extractedData.metadata.extension}
- Size: ${Math.round(extractedData.metadata.size / 1024)}KB
- Content Length: ${extractedData.metadata.contentLength} characters

Document Content:
${extractedData.content}

User Processing Instructions: ${instructions}`;

      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.6
      });

      const result = JSON.parse(completion.choices[0].message.content);
      processedContent = result.content;
      title = result.title;
      tags = result.tags || [];
      summary = result.summary || '';
    }

    // Create final result object
    const result = {
      title,
      content: processedContent,
      tags,
      summary
    };

    // Add metadata about the source document
    result.sourceDocument = {
      filename: extractedData.metadata.originalName,
      fileType: extractedData.metadata.extension,
      originalSize: extractedData.metadata.size,
      processedAt: new Date().toISOString()
    };

    logger.info('Document processed successfully', {
      userId: req.user?.uid,
      model: model,
      filename: uploadedFile.originalname,
      fileSize: uploadedFile.size,
      instructionsLength: instructions.length,
      processedContentLength: result.content?.length || 0
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error processing uploaded document with AI', {
      userId: req.user?.uid,
      filename: req.file?.originalname,
      error: error.message,
      stack: error.stack
    });

    // Handle specific OpenAI errors
    let errorMessage = error.message || 'Failed to process uploaded document';

    if (error.message && error.message.includes('429')) {
      if (error.message.includes('tokens per min')) {
        errorMessage = 'Document is too large or processing rate limit exceeded. Please try with a smaller document or wait a moment before retrying.';
      } else if (error.message.includes('Rate limit')) {
        errorMessage = 'API rate limit exceeded. Please wait a moment before retrying.';
      }
    } else if (error.message && error.message.includes('context_length_exceeded')) {
      errorMessage = 'Document is too large to process. Please try with a smaller document or break it into smaller files.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  } finally {
    // Clean up the uploaded file
    if (uploadedFilePath) {
      cleanupFile(uploadedFilePath);
    }
  }
};

export {
  generateDocument,
  improveDocument,
  processUploadedDocument
};

