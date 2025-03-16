import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createParagraphNode,
  BaseSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  LexicalEditor,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';

import { $createCodeNode } from '@lexical/code';

import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';

import { $isTableSelection } from '@lexical/table';
import { $getNearestBlockElementAncestorOrThrow } from '@lexical/utils';
import { $isDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import { useEffect, useState } from 'react';
import {
  CLEAR_FORMAT_COMMAND,
  FORMAT_HEADING_COMMAND,
  FORMAT_PARAGRAPH_COMMAND,
  INSERT_BLOCKQUOTE_COMMAND,
  INSERT_CODE_BLOCK_COMMAND,
} from '../utils/Commands';

import { $setBlocksType } from '@lexical/selection';

const useCommandRegistration = (editor: LexicalEditor) => {
  const [canRedo, setCanRedo] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [selection, setSelection] = useState<
    BaseSelection | RangeSelection | null
  >(null);

  useEffect(() => {
    // Register commands
    const commands = [
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          setSelection($getSelection());
          return false;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        FORMAT_PARAGRAPH_COMMAND,
        () => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createParagraphNode());
            }
          });
          return false;
        },
        COMMAND_PRIORITY_EDITOR
      ),

      editor.registerCommand(
        FORMAT_HEADING_COMMAND,
        (headingSize: HeadingTagType) => {
          editor.update(() => {
            const selection = $getSelection();
            $setBlocksType(selection, () => $createHeadingNode(headingSize));
          });
          return false;
        },
        COMMAND_PRIORITY_EDITOR
      ),

      editor.registerCommand(
        INSERT_CODE_BLOCK_COMMAND,
        () => {
          editor.update(() => {
            let selection = $getSelection();

            if (selection !== null) {
              if (selection.isCollapsed()) {
                $setBlocksType(selection, () => $createCodeNode());
              } else {
                const textContent = selection.getTextContent();
                const codeNode = $createCodeNode();
                selection.insertNodes([codeNode]);
                selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  selection.insertRawText(textContent);
                }
              }
            }
          });

          return false;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        INSERT_BLOCKQUOTE_COMMAND,
        () => {
          editor.update(() => {
            const selection = $getSelection();
            $setBlocksType(selection, () => $createQuoteNode());
          });
          return false;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        CLEAR_FORMAT_COMMAND,
        () => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) || $isTableSelection(selection)) {
              const { anchor } = selection;
              const { focus } = selection;
              const nodes = selection.getNodes();
              const extractedNodes = selection.extract();

              if (anchor.key === focus.key && anchor.offset === focus.offset) {
                return;
              }

              nodes.forEach((node, idx) => {
                if ($isTextNode(node)) {
                  let textNode = node;
                  if (idx === 0 && anchor.offset !== 0) {
                    textNode = textNode.splitText(anchor.offset)[1] || textNode;
                  }
                  if (idx === nodes.length - 1) {
                    textNode = textNode.splitText(focus.offset)[0] || textNode;
                  }
                  const extractedTextNode = extractedNodes[0];
                  if (nodes.length === 1 && $isTextNode(extractedTextNode)) {
                    textNode = extractedTextNode;
                  }

                  if (textNode.__style !== '') {
                    textNode.setStyle('');
                  }
                  if (textNode.__format !== 0) {
                    textNode.setFormat(0);
                    $getNearestBlockElementAncestorOrThrow(textNode).setFormat(
                      ''
                    );
                  }
                  node = textNode;
                } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
                  node.replace($createParagraphNode(), true);
                } else if ($isDecoratorBlockNode(node)) {
                  node.setFormat('');
                }
              });
            }
          });

          return false;
        },
        COMMAND_PRIORITY_EDITOR
      ),
    ];

    return () => {
      commands.forEach((unregister) => unregister());
    };
  }, [editor]);

  return { canRedo, canUndo, selection };
};

export default useCommandRegistration;
