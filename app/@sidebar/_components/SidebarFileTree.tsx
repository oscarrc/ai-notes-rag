'use client';

import { VscFile, VscFolder, VscFolderOpened } from 'react-icons/vsc';

import { sortFileNodes } from '@/app/_utils/files';
import useNavigationStore from '@/app/_store/navigationStore';
import { useState } from 'react';

interface SidebarFileTreeProps {
  files: FileNode[];
  onMoveFile: ({
    file,
    targetPath,
  }: {
    file: FileNode;
    targetPath: string;
  }) => void;
}

const SidebarFileTree = ({ files, onMoveFile }: SidebarFileTreeProps) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const { addTab, setTab, selectedNode, selectNode } = useNavigationStore();
  const [draggedNode, setDraggedNode] = useState<FileNode | null>(null);

  const isActive = (node: FileNode) => {
    return selectedNode?.path === node.path;
  };

  const handleClick = (e: React.MouseEvent, node: FileNode) => {
    const hasModifier = e.ctrlKey || e.metaKey;

    selectNode(node);

    if (node?.children) {
      setOpenFolders((prev) => ({
        ...prev,
        [node.path]: !prev[node.path],
      }));
    } else {
      hasModifier
        ? addTab({ name: node.name, path: node.path })
        : setTab({ name: node.name, path: node.path });
    }
  };

  const handleDragStart = (e: React.DragEvent, node: FileNode) => {
    setDraggedNode(node);
    e.dataTransfer.setData('text/plain', node.path); // Store the path of the dragged node
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetNode: FileNode | null) => {
    e.preventDefault();

    if (!draggedNode) return;

    const vaultPath = process.env.NEXT_PUBLIC_VAULT_PATH || '/vault';
    const sourcePath = draggedNode.path;
    const targetPath = targetNode?.children
      ? targetNode?.path || vaultPath
      : vaultPath;

    if (sourcePath === targetPath) return;

    onMoveFile({ file: draggedNode, targetPath });
    setDraggedNode(null);
  };

  const renderTree = (nodes: FileNode[]) => {
    const sortedNodes = sortFileNodes(nodes || []);

    return sortedNodes.map((node, index) => {
      if (node?.children) {
        const isOpen = openFolders[node.path];
        return (
          <li
            key={index}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, node)}
          >
            <button
              draggable
              onDragStart={(e) => handleDragStart(e, node)}
              onClick={(e) => handleClick(e, node)}
              className={`flex w-full items-center ${
                isActive(node) ? 'bg-base-200' : ''
              }`}
            >
              {isOpen ? (
                <VscFolderOpened className='h-4 w-4' />
              ) : (
                <VscFolder className='h-4 w-4' />
              )}
              {node.name}
            </button>
            {isOpen && <ul>{renderTree(node?.children)}</ul>}
          </li>
        );
      } else {
        return (
          <li
            key={index}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, node)}
          >
            <button
              draggable
              onDragStart={(e) => handleDragStart(e, node)}
              onClick={(e) => handleClick(e, node)}
              className={`flex w-full items-center ${
                isActive(node) ? 'bg-base-200' : ''
              }`}
            >
              <VscFile className='h-4 w-4' />
              {node.name}
            </button>
          </li>
        );
      }
    });
  };

  return (
    <ul
      className='menu menu-xs'
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, null)} // Handle drop to root
    >
      {renderTree(files)}
    </ul>
  );
};

export default SidebarFileTree;
