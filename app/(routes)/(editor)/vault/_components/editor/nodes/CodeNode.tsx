import { CodeNode } from '@lexical/code';
import { $getRoot, $applyNodeReplacement } from 'lexical';
import type {
  NodeKey,
  Spread,
  SerializedElementNode,
  LexicalNode,
  LexicalUpdateJSON,
} from 'lexical';

export type SerializedExtendedCodeNode = Spread<
  {
    language: string | null | undefined;
  },
  SerializedElementNode
>;

export class ExtendedCodeNode extends CodeNode {
  constructor(language?: string | null | undefined, key?: NodeKey) {
    super(language, key);
  }

  static getType(): string {
    return 'extended-code';
  }

  static clone(node: CodeNode): CodeNode {
    return new ExtendedCodeNode(node.__language, node.__key);
  }

  // do not remove node if it is the first child of root
  remove(preserveEmptyParent?: boolean | undefined): void {
    if ($getRoot().getFirstChild()?.getKey() !== this.getKey()) {
      super.remove(preserveEmptyParent);
    }
  }

  // do not replace node if it is the first child of root
  replace<N extends LexicalNode>(
    replaceWith: N,
    includeChildren?: boolean | undefined
  ): N {
    if ($getRoot().getFirstChild()?.getKey() !== this.getKey()) {
      return super.replace(replaceWith, includeChildren);
    }
    return this as unknown as N;
  }

  exportJSON(): SerializedExtendedCodeNode {
    return {
      ...super.exportJSON(),
      language: this.getLanguage(),
    };
  }

  updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedExtendedCodeNode>
  ): this {
    return super
      .updateFromJSON(serializedNode)
      .setLanguage(serializedNode.language);
  }

  static importJSON(
    serializedNode: SerializedExtendedCodeNode
  ): ExtendedCodeNode {
    // eslint-disable-next-line no-use-before-define
    return $createExtendedCodeNode().updateFromJSON(serializedNode);
  }
}

export function $createExtendedCodeNode(
  language?: string | null | undefined
): CodeNode {
  return $applyNodeReplacement(new ExtendedCodeNode(language));
}

/**
 * Checks if a node is a ExtendedCodeNode.
 * @param node - Node to check.
 * @returns True if the node is a ExtendedCodeNode.
 */
export function $isExtendedCodeNode(
  node: LexicalNode | null | undefined
): node is ExtendedCodeNode {
  return node instanceof ExtendedCodeNode;
}
