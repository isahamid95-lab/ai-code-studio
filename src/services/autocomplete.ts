interface AutocompleteRequest {
  code: string
  cursorPosition: number
  filename: string
  language: string
}

interface AutocompleteResponse {
  suggestions: Array<{
    text: string
    displayText: string
    type: 'function' | 'variable' | 'property' | 'keyword' | 'snippet'
    documentation?: string
  }>
}

const AI_BASE_URL = import.meta.env.VITE_ALIBABA_BASE_URL || 'https://coding-intl.dashscope.aliyuncs.com/v1'
const AI_API_KEY = import.meta.env.VITE_ALIBABA_API_KEY

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export async function getAutocompleteSuggestions(
  request: AutocompleteRequest
): Promise<AutocompleteResponse> {
  // Debounce - minimum 300ms between requests
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  return new Promise((resolve) => {
    debounceTimer = setTimeout(async () => {
      try {
        const { code, cursorPosition, filename, language } = request

        // Get context around cursor
        const lines = code.split('\n')
        let currentLine = 0
        let currentCol = 0
        let position = 0

        for (let i = 0; i < lines.length; i++) {
          if (position + lines[i].length >= cursorPosition) {
            currentLine = i
            currentCol = cursorPosition - position
            break
          }
          position += lines[i].length + 1
        }

        const contextBefore = lines.slice(Math.max(0, currentLine - 5), currentLine).join('\n')
        const contextAfter = lines.slice(currentLine + 1, currentLine + 5).join('\n')
        const currentLineText = lines[currentLine] || ''

        // Extract the prefix being typed
        const prefix = currentLineText.slice(0, currentCol).match(/[\w.]+$/)?.[0] || ''

        // Check for simple completions first (keywords, built-ins)
        const simpleSuggestions = getSimpleCompletions(prefix, language)
        if (simpleSuggestions.length > 0) {
          resolve({ suggestions: simpleSuggestions })
          return
        }

        // For more complex suggestions, use AI
        if (prefix.length >= 2) {
          const aiSuggestions = await getAICompletions({
            prefix,
            contextBefore,
            contextAfter,
            currentLine: currentLineText,
            filename,
            language
          })
          resolve({ suggestions: aiSuggestions })
          return
        }

        resolve({ suggestions: [] })
      } catch (error) {
        console.error('Autocomplete error:', error)
        resolve({ suggestions: [] })
      }
    }, 150)
  })
}

function getSimpleCompletions(
  prefix: string,
  language: string
): AutocompleteResponse['suggestions'] {
  const suggestions: AutocompleteResponse['suggestions'] = []

  const keywords = {
    javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await', 'try', 'catch', 'finally'],
    typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await', 'try', 'catch', 'finally', 'interface', 'type', 'enum', 'implements', 'extends', 'public', 'private', 'protected'],
    css: ['display', 'flex', 'grid', 'position', 'width', 'height', 'margin', 'padding', 'background', 'color', 'font-size', 'border', 'border-radius', 'box-shadow', 'transform', 'transition'],
    html: ['div', 'span', 'p', 'a', 'button', 'input', 'form', 'img', 'ul', 'li', 'h1', 'h2', 'h3', 'header', 'footer', 'section', 'article', 'nav']
  }

  const langKeywords = keywords[language as keyof typeof keywords] || keywords.javascript

  for (const keyword of langKeywords) {
    if (keyword.toLowerCase().startsWith(prefix.toLowerCase())) {
      suggestions.push({
        text: keyword,
        displayText: keyword,
        type: 'keyword'
      })
    }
  }

  return suggestions.slice(0, 8)
}

async function getAICompletions(params: {
  prefix: string
  contextBefore: string
  contextAfter: string
  currentLine: string
  filename: string
  language: string
}): Promise<AutocompleteResponse['suggestions']> {
  const { prefix, contextBefore, contextAfter, currentLine, filename, language } = params

  const prompt = `Complete the code at the cursor position. Return ONLY the completion text, nothing else.

File: ${filename}
Language: ${language}

Context before:
\`\`\`${language}
${contextBefore}
\`\`\`

Current line: ${currentLine}
Cursor is after: "${prefix}"

Context after:
\`\`\`${language}
${contextAfter}
\`\`\`

What should come after "${prefix}"? Return 3-5 likely completions as JSON array: ["completion1", "completion2", ...]`

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen3-coder-plus',
        messages: [
          { role: 'system', content: 'You are a code completion AI. Return only JSON arrays of completion strings.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '[]'

    // Parse JSON array from response
    const match = content.match(/\[[\s\S]*\]/)
    if (!match) return []

    const completions = JSON.parse(match[0])

    return completions.slice(0, 5).map((completion: string) => ({
      text: completion,
      displayText: completion,
      type: 'snippet' as const
    }))
  } catch (error) {
    console.error('AI completion error:', error)
    return []
  }
}

export async function getCodeContext(filename: string): Promise<string> {
  try {
    const response = await fetch('/api/files')
    if (!response.ok) {
      return ''
    }

    const data = await response.json()
    const file = data.files?.find((entry: { id: string; content: string }) => entry.id === filename)
    return file?.content ?? ''
  } catch {
    return ''
  }
}
