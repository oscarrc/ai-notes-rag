import ButtonSquare from "@/app/_components/ButtonSquare";
import { VscCopy, VscSave, VscRefresh  } from "react-icons/vsc";

interface ChatAnswerProps {
    text: string
}

const ChatAnswer = ({ text }: ChatAnswerProps) => {
    return (
        <div className="flex flex-col gap-4 w-full max-w-2xl">
            <div className="p-4 flex flex-col gap-4 rounded-box">
                <div className="prose">
                    { text }                
                </div>
                <div className="flex gap-2 flex-1 justify-end">
                    <div className="badge badge-md badge-neutral">Source 1</div>
                    <div className="badge badge-md badge-neutral">Source 2</div>
                    <div className="badge badge-md badge-neutral">Source 3</div>
                </div>
            </div>
            <div className="w-full flex gap-2">
                <ButtonSquare size="xs" className="opacity-75 hover:opacity-100">
                    <VscCopy className="h-4 w-4"/>
                </ButtonSquare>
                <ButtonSquare size="xs" className="opacity-75 hover:opacity-100">
                    <VscSave className="h-4 w-4"/>
                </ButtonSquare>
                <ButtonSquare size="xs" className="opacity-75 hover:opacity-100">
                    <VscRefresh className="h-4 w-4"/>
                </ButtonSquare>
            </div>
        </div>
    )
}

export default ChatAnswer;