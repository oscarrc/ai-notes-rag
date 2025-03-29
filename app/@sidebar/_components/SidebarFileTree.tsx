'use client';

import { VscEdit, VscFile, VscFolder, VscFolderOpened } from 'react-icons/vsc';

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
  onRenameFile?: ({ path, newName }: { path: string, newName: string }) => void;
}

const SidebarFileTree = ({
  files,
  onMoveFile,
  onRenameFile,
}: SidebarFileTreeProps) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const { addTab, setTab, selectedNode, selectNode } = useNavigationStore();
  const [draggedNode, setDraggedNode] = useState<FileNode | null>(null);
  const [editingNode, setEditingNode] = useState<FileNode | null>(null);
  const [editName, setEditName] = useState('');

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
    e.dataTransfer.setData('text/plain', node.path);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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

  const startRenaming = (e: React.MouseEvent, node: FileNode) => {
    e.stopPropagation();
    setEditingNode(node);
    setEditName(node.name);
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingNode || !onRenameFile || editName.trim() === '') return;

    // Call the rename API with the path and new name
    onRenameFile({
      path: editingNode.path,
      newName: editName.trim()
    });
    
    setEditingNode(null);
    setEditName('');
  };

  const cancelRenaming = () => {
    setEditingNode(null);
    setEditName('');
  };

  const renderTree = (nodes: FileNode[]) => {
    const sortedNodes = sortFileNodes(nodes || []);

    return sortedNodes.map((node, index) => {
      if (editingNode && editingNode.path === node.path) {
        return (
          <li key={index}>
            <form onSubmit={handleRename} className='flex w-full'>
              <input
                type='text'
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                onBlur={cancelRenaming}
                onKeyDown={(e) => e.key === 'Escape' && cancelRenaming()}
                className='w-full bg-base-200 p-1 text-xs focus:outline-none'
              />
            </form>
          </li>
        );
      }

      if (node?.children) {
        const isOpen = openFolders[node.path];
        return (
          <li
            key={index}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, node)}
          >
            <div
              className={`group flex w-full items-center ${isActive(node) ? 'bg-base-200' : ''}`}
            >
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, node)}
                onClick={(e) => handleClick(e, node)}
                className={`gap flex flex-grow items-center gap-2`}
              >
                {isOpen ? (
                  <VscFolderOpened className='h-4 w-4' />
                ) : (
                  <VscFolder className='h-4 w-4' />
                )}
                {node.name}
              </button>
              {onRenameFile && (
                <button
                  onClick={(e) => startRenaming(e, node)}
                  className='opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-75'
                >
                  <VscEdit className='h-3 w-3' />
                </button>
              )}
            </div>
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
            <div
              className={`group flex w-full items-center ${isActive(node) ? 'bg-base-200' : ''}`}
            >
              <button
                draggable
                onDragStart={(e) => handleDragStart(e, node)}
                onClick={(e) => handleClick(e, node)}
                className={`flex flex-grow items-center gap-2`}
              >
                <VscFile className='h-4 w-4' />
                {node.name}
                {node.extension}
              </button>
              {onRenameFile && (
                <button
                  onClick={(e) => startRenaming(e, node)}
                  className='opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-75'
                >
                  <VscEdit className='h-3 w-3' />
                </button>
              )}
            </div>
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
