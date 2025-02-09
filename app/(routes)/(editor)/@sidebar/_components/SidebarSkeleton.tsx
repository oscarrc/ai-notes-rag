const SidebarSkeleton = () => {
    const items = Array(4).fill(1);

  return (
    <ul className='menu menu-xs'>
        {
            items.map((_, i) => (
                <li className='py-1' key={i}>
                    <span className='skeleton flex w-full items-center h-4' />
                </li>
            ))
        }
    </ul>
  );
};

export default SidebarSkeleton;
