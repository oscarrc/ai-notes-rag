import ButtonSquare from "@/app/_components/ButtonSquare";
import { VscSend } from "react-icons/vsc";

const ChatTab = () => {
  return (
    <section className="flex flex-col flex-1 justify-center p-8">
      <div className="flex flex-col items-center gap-8">
        <h2 className="text-center text-4xl font-bold px-4">Ask any question about your notes</h2>
        <label className="flex textarea w-full max-w-2xl bg-base-200 items-center pr-2 gap-4">
          <textarea
            placeholder="Send a message"
            className="flex-1 bg-transparent  focus-visible:outline-none h-24" />
          <ButtonSquare size="md" className="btn-neutral self-end">
            <VscSend className="h-6 w-6" />
          </ButtonSquare>
        </label>
      </div>
    </section>
  );
};

export default ChatTab;
