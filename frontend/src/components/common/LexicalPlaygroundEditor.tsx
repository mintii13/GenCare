import React from 'react';
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {
  $isTextNode,
  isHTMLElement,
  Klass,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  TextNode,
} from 'lexical';
import ToolbarPlugin from './ToolbarPlugin';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
// Bạn cần tự tạo ExampleTheme, ToolbarPlugin, TreeViewPlugin, styleConfig nếu muốn đầy đủ như playground
// Hoặc có thể bỏ qua các plugin này nếu chỉ muốn demo cơ bản

const placeholder = 'Nhập nội dung blog...';

const removeStylesExportDOM = (
  editor: LexicalEditor,
  target: LexicalNode,
) => {
  const output = target.exportDOM(editor);
  if (output && isHTMLElement(output.element)) {
    for (const el of [
      output.element,
      ...output.element.querySelectorAll('[style],[class],[dir="ltr"]'),
    ]) {
      el.removeAttribute('class');
      el.removeAttribute('style');
      if (el.getAttribute('dir') === 'ltr') {
        el.removeAttribute('dir');
      }
    }
  }
  return output;
};

const editorConfig = {
  namespace: 'React.js Demo',
  nodes: [ParagraphNode, TextNode, HeadingNode, ListNode, ListItemNode],
  onError(error: Error) {
    throw error;
  },
  // theme: ExampleTheme, // Có thể bỏ nếu không cần custom theme
};

export default function LexicalPlaygroundEditor() {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input min-h-[200px] p-3 border rounded"
                aria-placeholder={placeholder}
                placeholder={<div className="editor-placeholder">{placeholder}</div>}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          {/* <TreeViewPlugin /> */}
        </div>
      </div>
    </LexicalComposer>
  );
} 