'use client';

import {
  BsArrow90DegLeft,
  BsArrow90DegRight,
  BsParagraph,
  BsTypeH1,
  BsTypeH2,
  BsTypeH3,
  BsTypeH4,
  BsTypeH5,
  BsTypeH6,
  BsPencil,
  BsCardImage,
  BsLink45Deg,
  BsSuperscript,
  BsSubscript,
  BsTypeBold,
  BsTypeItalic,
  BsTypeUnderline,
  BsTypeStrikethrough,
  BsHighlighter,
  BsListUl,
  BsListOl,
  BsListCheck,
  BsCodeSlash,
  BsQuote,
  BsTable,
  BsBook,
  BsMarkdown,
  BsEraser,
} from 'react-icons/bs';
import { $createCodeNode, $isCodeNode } from '@lexical/code';

import {
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  TextFormatType,
  UNDO_COMMAND,
} from 'lexical';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';

import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from '@lexical/markdown';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createTextNode, $getRoot } from 'lexical';
import { useCallback, useState } from 'react';

import { CUSTOM_TRANSFORMERS } from '../utils/MarkdownTransformers';
import {
  CLEAR_FORMAT_COMMAND,
  FORMAT_PARAGRAPH_COMMAND,
  INSERT_BLOCKQUOTE_COMMAND,
  INSERT_CODE_BLOCK_COMMAND,
} from '../utils/Commands';
import useCommandRegistration from '../hooks/useCommandRegistration';

const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [isRaw, setIsRaw] = useState(false);
  const { canRedo, canUndo, selection } = useCommandRegistration(editor);

  const toggleEditable = () => {
    editor.setEditable(!isEditable);
    setIsEditable((e) => !e);
  };

  const handleMarkdownToggle = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const firstChild = root.getFirstChild();
      if ($isCodeNode(firstChild) && firstChild.getLanguage() === 'markdown') {
        setIsRaw(false);
        $convertFromMarkdownString(
          firstChild.getTextContent(),
          CUSTOM_TRANSFORMERS,
          undefined,
          true
        );
      } else {
        setIsRaw(true);
        const markdown = $convertToMarkdownString(
          CUSTOM_TRANSFORMERS,
          undefined,
          true
        );
        const codeNode = $createCodeNode('markdown');
        codeNode.append($createTextNode(markdown));
        root.clear().append(codeNode);
        if (markdown.length === 0) {
          codeNode.select();
        }
      }
    });
  }, [editor]);

  const selectionFormat = useCallback(
    (format: TextFormatType) => {
      return $isRangeSelection(selection) && selection?.hasFormat(format);
    },
    [selection]
  );

  return (
    <nav className='sticky rounded bottom-0 flex w-full flex-row p-4'>
      <div className='flex flex-1 items-center justify-start gap-2 bg-base-200 px-4 py-2'>
        <button
          className='btn btn-square btn-ghost btn-xs'
          disabled={!canUndo}
          onClick={() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
        >
          <BsArrow90DegLeft className='h-4 w-4' />
        </button>
        <button
          className='btn btn-square btn-ghost btn-xs'
          disabled={!canRedo}
          onClick={() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
          }}
        >
          <BsArrow90DegRight className='h-4 w-4' />
        </button>
        <span className='divider divider-horizontal m-0' />
        <button
          className={`btn btn-square btn-xs ${selectionFormat('bold') ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() =>
            editor.dispatchCommand(FORMAT_PARAGRAPH_COMMAND, undefined)
          }
        >
          <BsParagraph className='h-4 w-4' />
        </button>
        <span className='divider divider-horizontal m-0' />
        <button
          className={`btn btn-square btn-xs ${selectionFormat('bold') ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        >
          <BsTypeBold className='h-4 w-4' />
        </button>
        <button
          className={`btn btn-square btn-xs ${selectionFormat('italic') ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        >
          <BsTypeItalic className='h-4 w-4' />
        </button>
        <button
          className={`btn btn-square btn-xs ${selectionFormat('underline') ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')
          }
        >
          <BsTypeUnderline className='h-4 w-4' />
        </button>
        <button
          className={`btn btn-square btn-xs ${selectionFormat('strikethrough') ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
          }
        >
          <BsTypeStrikethrough className='h-4 w-4' />
        </button>
        <button
          className={`btn btn-square btn-xs ${selectionFormat('subscript') ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')
          }
        >
          <BsSubscript className='h-4 w-4' />
        </button>
        <button
          className={`btn btn-square btn-xs ${selectionFormat('superscript') ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')
          }
        >
          <BsSuperscript className='h-4 w-4' />
        </button>
        <button
          className={`btn btn-square btn-xs ${selectionFormat('highlight') ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')
          }
        >
          <BsHighlighter className='h-4 w-4' />
        </button>
        <span className='divider divider-horizontal m-0' />
        <button
          className='btn btn-square btn-ghost btn-xs'
          onClick={() =>
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
          }
        >
          <BsListUl className='h-4 w-4' />
        </button>
        <button
          className='btn btn-square btn-ghost btn-xs'
          onClick={() =>
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
          }
        >
          <BsListOl className='h-4 w-4' />
        </button>
        <button
          className='btn btn-square btn-ghost btn-xs'
          onClick={() =>
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
          }
        >
          <BsListCheck className='h-4 w-4' />
        </button>
        <span className='divider divider-horizontal m-0' />
        <button className='btn btn-square btn-ghost btn-xs'>
          <BsLink45Deg className='h-4 w-4' /> {/* TODO INSERT LINK */}
        </button>
        <button
          className='btn btn-square btn-ghost btn-xs'
          onClick={() =>
            editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined)
          }
        >
          <BsCodeSlash className='h-4 w-4' />
        </button>
        <button
          className='btn btn-square btn-ghost btn-xs'
          onClick={() =>
            editor.dispatchCommand(INSERT_BLOCKQUOTE_COMMAND, undefined)
          }
        >
          <BsQuote className='h-4 w-4' />
        </button>
        <button className='btn btn-square btn-ghost btn-xs'>
          <BsTable className='h-4 w-4' /> {/* TODO INSERT TABLE */}
        </button>
        <button className='btn btn-square btn-ghost btn-xs'>
          <BsCardImage className='h-4 w-4' /> {/* TODO INSERT IMAGE */}
        </button>
        <span className='divider divider-horizontal m-0' />
        <button
          className='btn btn-square btn-ghost btn-xs'
          onClick={() =>
            editor.dispatchCommand(CLEAR_FORMAT_COMMAND, undefined)
          }
        >
          <BsEraser className='h-4 w-4' /> {/* TODO INSERT IMAGE */}
        </button>
      </div>
      <div className='flex items-center justify-start gap-2 bg-base-200 px-4 py-2'>
        <button
          className={`btn btn-square btn-ghost swap btn-xs ${isEditable ? 'swap-active' : ''}`}
          onClick={toggleEditable}
          disabled={isRaw}
        >
          <BsBook className='swap-on h-4 w-4' />
          <BsPencil className='swap-off h-4 w-4' />
        </button>
        <button
          className={`btn btn-square btn-ghost btn-xs ${isRaw ? 'btn-active' : ''}`}
          onClick={handleMarkdownToggle}
          disabled={!isEditable}
        >
          <BsMarkdown className='h-4 w-4' />
        </button>
      </div>
    </nav>
  );
};
export default ToolbarPlugin;
