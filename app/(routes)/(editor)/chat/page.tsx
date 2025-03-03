'use client';

import ChatAnswer from './_components/ChatAnswer';
import ChatInput from './_components/ChatInput';
import ChatQuestion from './_components/ChatQuestion';
import { useEmbeddings } from '@/app/_hooks/useEmbeddings';
import { useInference } from '@/app/_hooks/useInference';

const ChatTab = () => {
  const { history, sendMessage } = useInference();
  const { getQuery, calculateEmbeddings } = useEmbeddings();

  const hasHistory = history.length > 1;

  const handleSubmit = async (text: string) => {
    const embeddings = await calculateEmbeddings(text);
    const context = await getQuery(embeddings);
    sendMessage(text, context);
  };

  return (
    <section className='flex flex-1 flex-col justify-end p-8'>
      <div
        className={`flex flex-1 flex-col items-center gap-8 ${hasHistory ? 'justify-end' : 'justify-center'}`}
      >
        {hasHistory ? (
          history.map((h: HistoryMessage, i: number) => {
            if (h.role === 'user')
              return <ChatQuestion key={i} text={h.content} />;
            else if (h.role === 'assistant')
              return <ChatAnswer key={i} text={h.content} />;
            else return null;
          })
        ) : (
          <h2 className='px-4 text-center text-4xl font-bold'>
            Ask any question about your notes
          </h2>
        )}
        <ChatInput
          onSubmit={handleSubmit}
          className={hasHistory ? 'sticky bottom-8' : ''}
        />
      </div>
    </section>
  );
};

export default ChatTab;
