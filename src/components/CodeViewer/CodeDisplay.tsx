import { useMemo, useEffect, useRef } from 'react';
import { useAppSelector } from '../../store/hooks';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import yaml from 'highlight.js/lib/languages/yaml';
import ini from 'highlight.js/lib/languages/ini'; // For TOML
import markdown from 'highlight.js/lib/languages/markdown';
import 'highlight.js/styles/atom-one-dark.css';
import 'highlight.js/styles/atom-one-light.css';
import { generateFileTree, findFileByPath, getFileLanguage } from '../../utils/fileTreeGenerator';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import './CodeDisplay.scss';

// Register languages
hljs.registerLanguage('python', python);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('toml', ini);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('markdown', markdown);

export const CodeDisplay: React.FC = () => {
  const state = useAppSelector((rootState) => rootState);
  const theme = useAppSelector((rootState) => rootState.theme.theme);
  const selectedFilePath = useAppSelector((rootState) => rootState.ui.selectedCodeFile);
  const codeRef = useRef<HTMLElement>(null);

  const fileTree = useMemo(() => {
    try {
      return generateFileTree(state);
    } catch (error) {
      console.error('Failed to generate file tree:', error);
      return null;
    }
  }, [state.project.current, state.nodes.allIds, state.datasets.allIds, state.connections.allIds]);

  const selectedFile = useMemo(() => {
    if (!selectedFilePath || !fileTree) return null;
    return findFileByPath(fileTree, selectedFilePath);
  }, [fileTree, selectedFilePath]);

  // Apply syntax highlighting when content or theme changes
  useEffect(() => {
    if (codeRef.current && selectedFile?.content) {
      // Remove previous highlighting attribute to allow re-highlighting
      delete codeRef.current.dataset.highlighted;
      hljs.highlightElement(codeRef.current);
    }
  }, [selectedFile?.content, theme]);

  const handleCopy = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      toast.success('Copied to clipboard!');
    }
  };

  if (!fileTree) {
    return (
      <div className="code-display code-display--empty">
        <p>Failed to load file content</p>
      </div>
    );
  }

  if (!selectedFile) {
    return (
      <div className="code-display code-display--empty">
        <p>Select a file to view its contents</p>
      </div>
    );
  }

  if (selectedFile.type === 'folder') {
    return (
      <div className="code-display code-display--empty">
        <p>This is a folder. Select a file to view its contents.</p>
      </div>
    );
  }

  const language = getFileLanguage(selectedFile.name);

  return (
    <div className="code-display" data-theme={theme}>
      <div className="code-display__header">
        <h3 className="code-display__filename">
          {selectedFile.path}
        </h3>
        <button
          className="code-display__copy"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          <Copy size={16} />
          Copy
        </button>
      </div>
      <div className="code-display__content">
        <pre>
          <code ref={codeRef} className={`language-${language}`}>
            {selectedFile.content || '// Empty file'}
          </code>
        </pre>
      </div>
    </div>
  );
};
