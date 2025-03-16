'use client';

import { useRouter } from 'next/navigation';
import { VscFile } from 'react-icons/vsc';
import useNavigationStore from '@/app/_store/navigationStore';

interface ChatSourceProps {
  source: FileNode;
}

const ChatSource = ({ source }: ChatSourceProps) => {
  const { addTab } = useNavigationStore();
  const router = useRouter();

  // Format the source name to be more readable
  const displayName = source.name.length > 20 
    ? `${source.name.substring(0, 17)}...` 
    : source.name;

  const handleSourceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Add a new tab with this source
    addTab({ name: source.name, path: source.path });
    
    // Navigate to the vault view for this file
    router.push(`/vault/${source.path}`);
  };

  return (
    <button
      onClick={handleSourceClick}
      className="badge badge-neutral badge-outline badge-md gap-1 hover:bg-neutral-content hover:text-neutral"
      title={source.path}
    >
      <VscFile className="h-3 w-3" />
      {displayName}
    </button>
  );
};

export default ChatSource;