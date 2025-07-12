import React, { useRef, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: number;
  autoResize?: boolean;
}

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  readOnly = false,
  height = 400,
  autoResize = true,
}) => {
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (autoResize && quillRef.current) {
      const editor = quillRef.current.getEditor();
      
      const resizeEditor = () => {
        // Use editor's container directly instead of getEditingArea()
        const editorElement = editor.container.querySelector('.ql-editor') as HTMLElement;
          if (editorElement) {
            // Reset height to auto to calculate natural height
            editorElement.style.height = 'auto';
            const scrollHeight = editorElement.scrollHeight;
            // Set minimum height and auto-grow
            const minHeight = 150;
            const newHeight = Math.max(minHeight, scrollHeight + 10);
            editorElement.style.height = `${newHeight}px`;
        }
      };

      // Resize on content change
      editor.on('text-change', resizeEditor);
      
      // Initial resize
      const timeoutId = setTimeout(resizeEditor, 100);

      // Cleanup
      return () => {
        editor.off('text-change', resizeEditor);
        clearTimeout(timeoutId);
      };
    }
  }, [autoResize, value]);

  // Memoize modules and formats to prevent unnecessary re-renders
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }], // Thêm căn lề
      ['blockquote', 'code-block'], // Thêm blockquote, code
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'video'], // Thêm video
      ['clean'],
      ['undo', 'redo'] // Nếu có cài đặt module undo/redo
    ],
    clipboard: {
      matchVisual: false
    }
  }), []);

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ], []);

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        theme="snow"
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        bounds=".quill-editor-wrapper"
        preserveWhitespace={true}
        style={{ 
          height: autoResize ? 'auto' : height,
          background: readOnly ? '#f9fafb' : '#fff',
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .quill-editor-wrapper .ql-editor {
            ${autoResize ? 
              'min-height: 150px !important; height: auto !important; overflow-y: auto !important;' : 
              `min-height: ${height - 42}px !important;`
            }
            font-size: 16px;
            line-height: 1.6;
            padding: 16px;
            box-sizing: border-box;
          }
          .quill-editor-wrapper .ql-container {
            font-size: 16px;
            border: none !important;
            ${autoResize ? 'height: auto !important;' : ''}
          }
          .quill-editor-wrapper .ql-toolbar {
            border: 2px solid #d1d5db !important;
            border-bottom: 2px solid #d1d5db !important;
            border-radius: 6px 6px 0 0 !important;
            background: #f9fafb;
          }
          .quill-editor-wrapper .ql-snow {
            border: 2px solid #d1d5db !important;
            border-top: none !important;
            border-radius: 0 0 6px 6px !important;
            ${autoResize ? 'height: auto !important;' : ''}
          }
          ${autoResize ? `
          .quill-editor-wrapper .ql-snow .ql-container {
            height: auto !important;
          }
          .quill-editor-wrapper .ql-editor {
            resize: none !important;
          }
          ` : ''}
        `
      }} />
    </div>
  );
};

export default QuillEditor;