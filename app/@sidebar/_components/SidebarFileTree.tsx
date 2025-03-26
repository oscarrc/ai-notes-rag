'use client';

import useNavigationStore from '@/app/_store/navigationStore';
import { sortFileNodes } from '@/app/_utils/files';
import { useState } from 'react';
import { VscFolder, VscFolderOpened, VscFile } from 'react-icons/vsc';

interface SidebarFileTreeProps {
  files: FileNode[];
}

const SidebarFileTree = ({ files }: SidebarFileTreeProps) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const { addTab, setTab, selectedNode, selectNode } = useNavigationStore();

  const isActive = (node: FileNode) => {
    return selectedNode?.path === node.path;
  };

  const handleClick = (e: React.MouseEvent, node: FileNode) => {
    const hasModifier = e.ctrlKey || e.metaKey;

    selectNode(node); // Ensure folders are marked as selected

    if (node?.children) {
      // If it's a folder, toggle its open state instead of treating it like a file
      setOpenFolders((prev) => ({
        ...prev,
        [node.path]: !prev[node.path],
      }));
    } else {
      // If it's a file, open it in a tab
      hasModifier
        ? addTab({ name: node.name, path: node.path })
        : setTab({ name: node.name, path: node.path });
    }
  };

  const renderTree = (nodes: FileNode[]) => {
    // Sort nodes so folders come first, then files, both in alphabetical order
    const sortedNodes = sortFileNodes(nodes || []);
    
    return sortedNodes.map((node, index) => {
      if (node?.children) {
        const isOpen = openFolders[node.path];
        return (
          <li key={index}>
            <button
              onClick={(e) => handleClick(e, node)}
              className={`flex w-full items-center ${isActive(node) ? 'bg-base-200' : ''}`}
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
          <li key={index}>
            <button
              onClick={(e) => handleClick(e, node)}
              className={`flex w-full items-center ${isActive(node) ? 'bg-base-200' : ''}`}
            >
              <VscFile className='h-4 w-4' />
              {node.name}
            </button>
          </li>
        );
      }
    });
  };

  return <ul className='menu menu-xs'>{renderTree(files)}</ul>;
};

export default SidebarFileTree;
