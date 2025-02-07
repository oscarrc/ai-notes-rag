'use client';

import useNavigationStore from '@/app/_store/navigationStore';
import { useState } from 'react';
import { VscFolder, VscFolderOpened, VscFile } from 'react-icons/vsc';

interface SidebarFileTreeProps {
  files: FileNode[];
}

const SidebarFileTree = ({ files }: SidebarFileTreeProps) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const { addTab, setTab, selectedNode, selectNode } = useNavigationStore();

  const isActive = (node: FileNode) => selectedNode?.path === node.path;

  const toggleFolder = (node: FileNode) => {
    selectNode(node);
    setOpenFolders((prev) => ({
      ...prev,
      [node.path]: !prev[node.path], // Toggle the open state for the folder
    }));
  };

  const handleClick = (e: React.MouseEvent, node: FileNode) => {
    const hasModifier = e.ctrlKey || e.metaKey;

    selectNode(node);
    hasModifier
      ? addTab({ name: node.name, path: `${node.path}` })
      : setTab({ name: node.name, path: `${node.path}` });
  };

  const renderTree = (nodes: FileNode[]) => {
    return nodes?.map((node, index) => {
      if (node.children) {
        const isOpen = openFolders[node.path];
        return (
          <li key={index}>
            <details open={isOpen} onToggle={() => toggleFolder(node)}>
              <summary className={`${isActive(node) ? 'bg-base-200' : ''}`}>
                {isOpen ? (
                  <VscFolderOpened className='h-4 w-4' />
                ) : (
                  <VscFolder className='h-4 w-4' />
                )}
                {node.name}
              </summary>
              <ul>{renderTree(node.children)}</ul>
            </details>
          </li>
        );
      } else {
        return (
          <li key={index} className={`${isActive(node) ? 'bg-base-200' : ''}`}>
            <button onClick={(e) => handleClick(e, node)}>
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
