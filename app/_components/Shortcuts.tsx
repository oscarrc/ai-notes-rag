'use client';

import { useEffect } from "react";
import useNavigationStore from "../_store/navigationStore";
import { useFilesQuery } from "../_hooks/useFilesQuery";
import { chatTab } from "../_utils/tabs";
import { getFilePath } from "../_utils/files";
import { showModal } from "../_utils/modals";
import { isShortcut } from "../_utils/shortcuts";

const Shortcuts = () => {
  const { addTab, selectedNode } = useNavigationStore();
  const { createFile } = useFilesQuery();
  
  const handleShortcut = async (e: KeyboardEvent) => {
    const code = e.code;

    if(!isShortcut(e)) return;

    switch(code){
      case 'KeyA':
        e.preventDefault();
        addTab(chatTab);
        break;      
      case 'KeyK':
        e.preventDefault();
        showModal('search');
        break;
      case 'KeyF':
        e.preventDefault();
        await createFile({ name: "New File", path: getFilePath(selectedNode), extension: ".md" });
        break;
      default:
        break;
    } 
  }

  useEffect(() => {
    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut)
  })

  return null;
}

export default Shortcuts;
