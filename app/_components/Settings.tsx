'use client'

import { RefObject } from "react";
import { VscClose } from 'react-icons/vsc';

interface SettingsProps {
    ref: RefObject<HTMLDialogElement | null>;
}
  
const Settings = ({ ref }: SettingsProps) => {
    return (
        <dialog id="my_modal_2" className="modal" ref={ref}>
            <div className="modal-box">                
                <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={() => ref?.current?.close()}>
                    <VscClose className="h-4 w-4" />
                </button>
                
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold">Settings</h3>
                <div className="flex flex-1 flex-col gap-8">
                        <label className="form-control w-full max-w-lg">
                            <div className="label">
                                <span className="label-text">Select inference model</span>
                            </div>
                            <select className="select select-sm select-bordered">
                                <option disabled selected>Pick one</option>
                                <option>Star Wars</option>
                                <option>Harry Potter</option>
                                <option>Lord of the Rings</option>
                                <option>Planet of the Apes</option>
                                <option>Star Trek</option>
                            </select>
                        </label>
                        <label className="form-control w-full max-w-lg">
                            <div className="label">
                                <span className="label-text">Select embeddings model</span>
                            </div>
                            <select className="select select-sm select-bordered">
                                <option disabled selected>Pick one</option>
                                <option>Star Wars</option>
                                <option>Harry Potter</option>
                                <option>Lord of the Rings</option>
                                <option>Planet of the Apes</option>
                                <option>Star Trek</option>
                            </select>
                        </label>
                        <div className="flex justify-between w-full max-w-lg">
                            Reindex notes (May take a while) <button className="btn btn-xs btn-outline btn-primary">Reindex</button>
                        </div>
                </div>
                </div>
                <div className='modal-actions flex gap-2 justify-end mt-8'>                    
                    <button className="btn btn-sm">Cancel</button>
                    <button className="btn btn-sm btn-primary">Save</button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button>close</button>
            </form>
        </dialog>
    )
}

export default Settings;