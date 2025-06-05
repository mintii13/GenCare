import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { FORMAT_TEXT_COMMAND, UNDO_COMMAND, REDO_COMMAND } from 'lexical';

const ToolbarPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  const format = (type: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  };

  return (
    <div className="flex gap-2 mb-2 border-b pb-2">
      <button type="button" onClick={() => format('bold')} className="px-2 py-1 font-bold border rounded">B</button>
      <button type="button" onClick={() => format('italic')} className="px-2 py-1 italic border rounded">I</button>
      <button type="button" onClick={() => format('underline')} className="px-2 py-1 underline border rounded">U</button>
      <button type="button" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} className="px-2 py-1 border rounded">↺</button>
      <button type="button" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} className="px-2 py-1 border rounded">↻</button>
      {/* Heading, List có thể thêm sau nếu cần plugin nâng cao */}
    </div>
  );
};

export default ToolbarPlugin; 