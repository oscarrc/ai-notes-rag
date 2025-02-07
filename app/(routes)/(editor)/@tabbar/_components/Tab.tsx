import Link from 'next/link';
import { VscClose } from 'react-icons/vsc';

interface TabProps {
  file: Partial<FileNode>;
  isActive: boolean;
  onClose: () => void;
}

const Tab = ({ file, isActive, onClose }: TabProps) => {
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <Link
      href={file.path || '/'}
      role='tab'
      className={`tab flex w-40 justify-between ${isActive ? 'tab-active before:-left-2' : 0}`}
    >
      <span className='max-w-28 truncate'>{file.name}</span>
      <button
        className={`btn btn-square btn-link btn-xs -mr-3 text-base-content ${isActive ? 'opacity-1' : 'opacity-0'}`}
        onClick={handleClose}
      >
        <VscClose className='h-4 w-4' />
      </button>
    </Link>
  );
};

export default Tab;
