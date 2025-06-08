import React from 'react';
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
}) => (
  <ReactQuill
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    theme="snow"
    placeholder={placeholder}
    style={{ minHeight: 200, background: readOnly ? '#f9fafb' : '#fff' }}
  />
);

export default QuillEditor; 