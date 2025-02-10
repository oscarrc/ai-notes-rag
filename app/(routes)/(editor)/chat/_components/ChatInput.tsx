'use client'

import ButtonSquare from "@/app/_components/ButtonSquare";
import { FormEvent } from "react";
import { VscSend } from "react-icons/vsc";

const ChatInput = () => {
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    }

    return (
        <form className="flex textarea w-full max-w-2xl bg-base-200 items-center pr-2 gap-4" onSubmit={ handleSubmit }>
          <textarea
            placeholder="Send a message"
            autoFocus
            className="flex-1 bg-transparent  focus-visible:outline-none h-24" />
          <ButtonSquare size="md" className="btn-neutral self-end">
            <VscSend className="h-6 w-6" />
          </ButtonSquare>
        </form>
    )
}

export default ChatInput;