import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: number;
}

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  readOnly = false,
  height = 400,
}) => {
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    // Cleanup function to remove any event listeners
    return () => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        editor.off('text-change', () => {});
      }
    };
  }, []);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ];

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
        style={{ 
          height: height,
          background: readOnly ? '#f9fafb' : '#fff',
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .quill-editor-wrapper .ql-editor {
            min-height: ${height - 42}px !important;
            font-size: 16px;
            line-height: 1.6;
            padding: 16px;
          }
          .quill-editor-wrapper .ql-container {
            font-size: 16px;
            border: none !important;
          }
          .quill-editor-wrapper .ql-toolbar {
            border: none !important;
            border-bottom: 1px solid #e5e7eb !important;
            background: #f9fafb;
          }
          .quill-editor-wrapper .ql-snow {
            border: none !important;
          }
        `
      }} />
    </div>
  );
};

export default QuillEditor; 