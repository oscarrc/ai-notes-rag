import ChatAnswer from './_components/ChatAnswer';
import ChatInput from './_components/ChatInput';
import ChatQuestion from './_components/ChatQuestion';

const ChatTab = () => {
  return (
    <section className='flex flex-1 flex-col justify-end p-8'>
      <div className='flex flex-col items-center gap-8'>
        {/* <h2 className="text-center text-4xl font-bold px-4">Ask any question about your notes</h2> */}
        <ChatQuestion text='This is a test' />
        <ChatAnswer text='This is a test' />
        <ChatInput />
      </div>
    </section>
  );
};

export default ChatTab;
