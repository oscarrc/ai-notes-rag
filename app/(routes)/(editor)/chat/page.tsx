import ChatInput from "./_components/ChatInput";

const ChatTab = () => {
  return (
    <section className="flex flex-col flex-1 justify-center p-8">
      <div className="flex flex-col items-center gap-8">
        <h2 className="text-center text-4xl font-bold px-4">Ask any question about your notes</h2>
        <ChatInput />
      </div>
    </section>
  );
};

export default ChatTab;
