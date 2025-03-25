'use client';

import { usePathname } from 'next/navigation';
import { VscArchive } from 'react-icons/vsc';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const crumbs = decodeURI(pathname).split('/').filter(Boolean);

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
              ) : index === crumbs.length - 1 ? (
                crumb.substring(0, crumb.lastIndexOf('.'))
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
