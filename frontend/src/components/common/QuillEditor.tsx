import React, { useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  readOnly = false,
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
    <div className="quill-editor">
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
          minHeight: 200, 
          background: readOnly ? '#f9fafb' : '#fff',
          marginBottom: 50 // Space for toolbar
        }}
      />
    </div>
  );
};

export default QuillEditor; 