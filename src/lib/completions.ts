import { syntaxTree } from '@codemirror/language';
import { type Completion, type CompletionContext, type CompletionResult, completeFromList } from '@codemirror/autocomplete';

const reactSnippets: Completion[] = [
  { label: 'rfc', type: 'snippet', info: 'React functional component', apply: `export default function Component() {\n  return (\n    <div>\n      \n    </div>\n  );\n}` },
  { label: 'rfce', type: 'snippet', info: 'React functional component with export', apply: `import React from 'react';\n\nexport default function Component() {\n  return (\n    <div>\n      \n    </div>\n  );\n}` },
  { label: 'useState', type: 'snippet', info: 'React useState hook', apply: 'const [state, setState] = useState(initialState);' },
  { label: 'useEffect', type: 'snippet', info: 'React useEffect hook', apply: 'useEffect(() => {\n  \n  return () => {\n    \n  };\n}, []);' },
  { label: 'useCallback', type: 'snippet', info: 'React useCallback hook', apply: 'const callback = useCallback(() => {\n  \n}, [deps]);' },
  { label: 'useMemo', type: 'snippet', info: 'React useMemo hook', apply: 'const memoized = useMemo(() => {\n  \n}, [deps]);' },
  { label: 'useRef', type: 'snippet', info: 'React useRef hook', apply: 'const ref = useRef(initialValue);' },
  { label: 'useContext', type: 'snippet', info: 'React useContext hook', apply: 'const context = useContext(Context);' },
  { label: 'useReducer', type: 'snippet', info: 'React useReducer hook', apply: 'const [state, dispatch] = useReducer(reducer, initialState);' },
  { label: 'clsx', type: 'function', info: 'Conditional className helper', apply: 'clsx(\"\")' },
];

const tailwindClasses: Completion[] = [
  { label: 'flex', type: 'class', info: 'display: flex' },
  { label: 'flex-col', type: 'class', info: 'flex-direction: column' },
  { label: 'items-center', type: 'class', info: 'align-items: center' },
  { label: 'justify-center', type: 'class', info: 'justify-content: center' },
  { label: 'justify-between', type: 'class', info: 'justify-content: space-between' },
  { label: 'gap-1', type: 'class', info: 'gap: 0.25rem' },
  { label: 'gap-2', type: 'class', info: 'gap: 0.5rem' },
  { label: 'gap-4', type: 'class', info: 'gap: 1rem' },
  { label: 'p-1', type: 'class', info: 'padding: 0.25rem' },
  { label: 'p-2', type: 'class', info: 'padding: 0.5rem' },
  { label: 'p-4', type: 'class', info: 'padding: 1rem' },
  { label: 'px-4', type: 'class', info: 'padding-left/right: 1rem' },
  { label: 'py-2', type: 'class', info: 'padding-top/bottom: 0.5rem' },
  { label: 'm-1', type: 'class', info: 'margin: 0.25rem' },
  { label: 'm-2', type: 'class', info: 'margin: 0.5rem' },
  { label: 'm-4', type: 'class', info: 'margin: 1rem' },
  { label: 'text-sm', type: 'class', info: 'font-size: 0.875rem' },
  { label: 'text-lg', type: 'class', info: 'font-size: 1.125rem' },
  { label: 'text-xl', type: 'class', info: 'font-size: 1.25rem' },
  { label: 'font-bold', type: 'class', info: 'font-weight: 700' },
  { label: 'font-medium', type: 'class', info: 'font-weight: 500' },
  { label: 'bg-white', type: 'class', info: 'background-color: white' },
  { label: 'bg-black', type: 'class', info: 'background-color: black' },
  { label: 'bg-primary', type: 'class', info: 'primary color background' },
  { label: 'text-white', type: 'class', info: 'color: white' },
  { label: 'text-black', type: 'class', info: 'color: black' },
  { label: 'text-primary', type: 'class', info: 'primary color text' },
  { label: 'rounded', type: 'class', info: 'border-radius: 0.25rem' },
  { label: 'rounded-lg', type: 'class', info: 'border-radius: 0.5rem' },
  { label: 'rounded-xl', type: 'class', info: 'border-radius: 0.75rem' },
  { label: 'rounded-2xl', type: 'class', info: 'border-radius: 1rem' },
  { label: 'border', type: 'class', info: 'border-width: 1px' },
  { label: 'border-2', type: 'class', info: 'border-width: 2px' },
  { label: 'w-full', type: 'class', info: 'width: 100%' },
  { label: 'h-full', type: 'class', info: 'height: 100%' },
  { label: 'min-h-screen', type: 'class', info: 'min-height: 100vh' },
  { label: 'overflow-hidden', type: 'class', info: 'overflow: hidden' },
  { label: 'overflow-auto', type: 'class', info: 'overflow: auto' },
  { label: 'cursor-pointer', type: 'class', info: 'cursor: pointer' },
  { label: 'transition-all', type: 'class', info: 'transition: all' },
  { label: 'hover:bg-white/10', type: 'class', info: 'hover background' },
  { label: 'glass-panel', type: 'class', info: 'Glassmorphism panel' },
  { label: 'glass-button', type: 'class', info: 'Glassmorphism button' },
];

const jsKeywords: Completion[] = [
  { label: 'const', type: 'keyword' },
  { label: 'let', type: 'keyword' },
  { label: 'var', type: 'keyword' },
  { label: 'function', type: 'keyword' },
  { label: 'async', type: 'keyword' },
  { label: 'await', type: 'keyword' },
  { label: 'return', type: 'keyword' },
  { label: 'if', type: 'keyword' },
  { label: 'else', type: 'keyword' },
  { label: 'for', type: 'keyword' },
  { label: 'while', type: 'keyword' },
  { label: 'switch', type: 'keyword' },
  { label: 'case', type: 'keyword' },
  { label: 'break', type: 'keyword' },
  { label: 'continue', type: 'keyword' },
  { label: 'try', type: 'keyword' },
  { label: 'catch', type: 'keyword' },
  { label: 'finally', type: 'keyword' },
  { label: 'throw', type: 'keyword' },
  { label: 'new', type: 'keyword' },
  { label: 'class', type: 'keyword' },
  { label: 'extends', type: 'keyword' },
  { label: 'import', type: 'keyword' },
  { label: 'export', type: 'keyword' },
  { label: 'default', type: 'keyword' },
  { label: 'from', type: 'keyword' },
  { label: 'typeof', type: 'keyword' },
  { label: 'instanceof', type: 'keyword' },
  { label: 'console.log', type: 'function', apply: 'console.log(${})' },
  { label: 'console.error', type: 'function', apply: 'console.error(${})' },
  { label: 'setTimeout', type: 'function', apply: 'setTimeout(() => {\n  \n}, delay)' },
  { label: 'setInterval', type: 'function', apply: 'setInterval(() => {\n  \n}, delay)' },
  { label: 'fetch', type: 'function', apply: 'fetch(url).then(res => res.json()).then(data => {\n  \n})' },
  { label: 'Promise', type: 'class', apply: 'new Promise((resolve, reject) => {\n  \n})' },
  { label: 'async/await', type: 'snippet', apply: 'async function name() {\n  try {\n    const result = await promise;\n  } catch (error) {\n    \n  }\n}' },
];

const tsTypes: Completion[] = [
  { label: 'interface', type: 'keyword', apply: 'interface Name {\n  \n}' },
  { label: 'type', type: 'keyword', apply: 'type Name = ' },
  { label: 'enum', type: 'keyword', apply: 'enum Name {\n  \n}' },
  { label: 'string', type: 'type' },
  { label: 'number', type: 'type' },
  { label: 'boolean', type: 'type' },
  { label: 'void', type: 'type' },
  { label: 'null', type: 'type' },
  { label: 'undefined', type: 'type' },
  { label: 'any', type: 'type' },
  { label: 'unknown', type: 'type' },
  { label: 'never', type: 'type' },
  { label: 'Record', type: 'type', apply: 'Record<string, unknown>' },
  { label: 'Partial', type: 'type', apply: 'Partial<Type>' },
  { label: 'Required', type: 'type', apply: 'Required<Type>' },
  { label: 'Pick', type: 'type', apply: 'Pick<Type, Keys>' },
  { label: 'Omit', type: 'type', apply: 'Omit<Type, Keys>' },
];

const reactComponents: Completion[] = [
  { label: 'div', type: 'component', apply: '<div>\n  \n</div>' },
  { label: 'span', type: 'component', apply: '<span></span>' },
  { label: 'p', type: 'component', apply: '<p></p>' },
  { label: 'h1', type: 'component', apply: '<h1></h1>' },
  { label: 'h2', type: 'component', apply: '<h2></h2>' },
  { label: 'button', type: 'component', apply: '<button onClick={() => {}}>\n  \n</button>' },
  { label: 'input', type: 'component', apply: '<input type="text" value={value} onChange={(e) => setValue(e.target.value)} />' },
  { label: 'form', type: 'component', apply: '<form onSubmit={(e) => {\n  e.preventDefault();\n}}>\n  \n</form>' },
  { label: 'img', type: 'component', apply: '<img src="" alt="" />' },
  { label: 'a', type: 'component', apply: '<a href="">\n  \n</a>' },
  { label: 'ul', type: 'component', apply: '<ul>\n  {items.map(item => (\n    <li key={item.id}></li>\n  ))}\n</ul>' },
  { label: 'li', type: 'component', apply: '<li></li>' },
];

export function createCompletionSource(fileLanguage: string) {
  const completions: Completion[] = [
    ...jsKeywords,
    ...reactSnippets,
    ...reactComponents,
  ];

  if (fileLanguage === 'typescript') {
    completions.push(...tsTypes);
  }

  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[\w$]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);
    
    if (nodeBefore.name === 'JSXAttributeValue' || nodeBefore.name === 'AttributeValue') {
      const text = context.state.sliceDoc(context.pos - 50, context.pos);
      if (text.includes('className=')) {
        const classNameMatch = context.matchBefore(/[\w-]+/);
        if (classNameMatch) {
          return {
            from: classNameMatch.from,
            options: tailwindClasses,
            validFor: /^[\w-]*$/,
          };
        }
      }
    }

    return {
      from: word.from,
      options: completions,
      validFor: /^[\w$]*$/,
    };
  };
}

export { reactSnippets, tailwindClasses, jsKeywords, tsTypes, reactComponents };