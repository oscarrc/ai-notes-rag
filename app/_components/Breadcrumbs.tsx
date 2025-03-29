'use client';

import { VscArchive, VscEdit } from 'react-icons/vsc';

import { useFilesQuery } from '../_hooks/useFilesQuery';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const crumbs = decodeURI(pathname).split('/').filter(Boolean);
  const { renameFile } = useFilesQuery();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const startEditing = () => {
    // Only edit if we're in a file view (has extension)
    if (crumbs.length > 0 && pathname.includes('.')) {
      const lastCrumb = crumbs[crumbs.length - 1];
      const fileName = lastCrumb.substring(0, lastCrumb.lastIndexOf('.'));
      setEditName(fileName);
      setIsEditing(true);
    }
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing || editName.trim() === '') {
      setIsEditing(false);
      return;
    }

    // Get the file path from the URL
    const path = `/${crumbs.join('/')}`;
    
    // Call the rename API with the path and new name
    renameFile({
      path,
      newName: editName.trim()
    });
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  return (
    <div className='flex w-full justify-center rounded bg-base-200'>
      <div className='breadcrumbs text-sm'>
        <ul>
          {crumbs.map((crumb, index) => (
            <li
              className={` ${index < crumbs.length - 1 ? 'text-base-content/50' : ''} ${index == 0 ? 'uppercase' : ''} `}
              key={crumb}
            >
              {index === 0 ? (
                <VscArchive className='h-4 w-4' />
              ) : index === crumbs.length - 1 && crumb.includes('.') ? (
                isEditing ? (
                  <form onSubmit={handleRename} className='flex items-center'>
                    <input
                      type='text'
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      onBlur={cancelEditing}
                      onKeyDown={(e) => e.key === 'Escape' && cancelEditing()}
                      className='rounded bg-base-300 p-1 text-xs focus:outline-none'
                    />
                  </form>
                ) : (
                  <div className='flex items-center'>
                    {crumb.substring(0, crumb.lastIndexOf('.'))}
                    <button
                      onClick={startEditing}
                      className='ml-2 opacity-50 transition-opacity hover:opacity-100'
                    >
                      <VscEdit className='h-3 w-3' />
                    </button>
                  </div>
                )
              ) : (
                crumb
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Breadcrumbs;
