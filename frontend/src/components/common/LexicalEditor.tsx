import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const theme = {};

const LexicalEditor: React.FC<LexicalEditorProps> = ({ value, onChange, placeholder }) => {
  const initialConfig = {
    namespace: 'BlogEditor',
    theme,
    onError: (error: Error) => { throw error; },
    editorState: value,
  };

  return (  
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="min-h-[200px] p-3 border rounded" />}
        placeholder={<div className="text-gray-400">{placeholder || 'Nhập nội dung...'}</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin
        onChange={editorState => {
          // Lưu state dạng JSON string
          onChange(JSON.stringify(editorState));
        }}
      />
    </LexicalComposer>
  );
};

export default LexicalEditor; 