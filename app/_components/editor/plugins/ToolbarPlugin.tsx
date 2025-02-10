import { BsTypeBold, BsTypeItalic, BsTypeUnderline, BsTypeStrikethrough, BsHighlighter  } from "react-icons/bs";


const ToolbarPlugin = () => {  
  return (
    <nav className='sticky w-full bottom-0 p-4'>
      <div className='flex w-full justify-start rounded bg-base-200 px-4 py-2 items-center gap-2'>
        <button className="btn btn-square btn-outline btn-xs">
          <BsTypeBold className="h-4 w-4" />
        </button>
        <button className="btn btn-square btn-outline btn-xs">
          <BsTypeItalic className="h-4 w-4" />
        </button>
        <button className="btn btn-square btn-outline btn-xs">
          <BsTypeUnderline className="h-4 w-4" />
        </button>
        <button className="btn btn-square btn-outline btn-xs">
          <BsTypeStrikethrough className="h-4 w-4" />
        </button>
        <button className="btn btn-square btn-outline btn-xs">
          <BsHighlighter className="h-4 w-4" />
        </button>
        <span className="divider divider-horizontal m-0" />
      </div>
    </nav>
  );
};
export default ToolbarPlugin;

