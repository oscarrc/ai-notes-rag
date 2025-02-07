'use client';

import { usePathname } from 'next/navigation';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const crumbs = decodeURI(pathname).split('/').filter(Boolean);

  return (
    <div className='flex w-full justify-center rounded bg-base-200'>
      <div className='breadcrumbs text-sm'>
        <ul>
          {crumbs.map((crumb, index) => (
            <li
              className={`
                ${index < crumbs.length - 1 ? 'text-base-content/50' : ''}
                ${index == 0 ? 'uppercase' : ''}
              `}
              key={crumb}
            >
              {crumb}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Breadcrumbs;
