interface ChatQuestionProps {
  text: string;
}

const ChatQuestion = ({ text }: ChatQuestionProps) => {
  return (
    <div className='chat chat-end w-full max-w-2xl'>
      <div className='chat-bubble'>{text}</div>
    </div>
  );
};

export default ChatQuestion;
