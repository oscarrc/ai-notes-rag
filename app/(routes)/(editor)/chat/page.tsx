import ButtonSquare from "@/app/_components/ButtonSquare";
import { VscSend } from "react-icons/vsc";

const ChatTab = () => {
  return (
    <section className="flex flex-col flex-1 justify-center">
      <div className="flex flex-col items-center gap-8">
        <h2 className="text-center text-4xl font-bold px-4">Ask any question about your notes</h2>
        <label className="flex input input-lg w-full max-w-2xl bg-base-200 items-center pr-2">
          <input
            type="text"
            placeholder="Send a message"
            className="flex-1" />
          <ButtonSquare className="btn btn-circle btn-md btn-neutral">
            <VscSend className="h-6 w-6" />
          </ButtonSquare>
        </label>
      </div>
    </section>
  );
};

export default ChatTab;
