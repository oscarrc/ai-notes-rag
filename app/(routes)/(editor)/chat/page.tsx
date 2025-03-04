'use client';

import ChatAnswer from './_components/ChatAnswer';
import ChatInput from './_components/ChatInput';
import ChatQuestion from './_components/ChatQuestion';
import { Status } from '@/app/_providers/InferenceProvider';
import { useEmbeddings } from '@/app/_hooks/useEmbeddings';
import { useInference } from '@/app/_hooks/useInference';

const ChatTab = () => {
  const { history, sendMessage, status, setStatus } = useInference();
  const { getQuery, calculateEmbeddings } = useEmbeddings();

  const hasHistory = history.length > 1;

  const handleSubmit = async (text: string) => {
    setStatus(Status.LOADING);
    const embeddings = await calculateEmbeddings(text);
    const context = await getQuery(embeddings);
    sendMessage(text, context);
  };

  return (
    <section className='flex flex-1 flex-col justify-end p-8'>
      <div
        className={`flex flex-1 flex-col items-center gap-8 ${status === Status.LOADING || hasHistory ? 'justify-end' : 'justify-center'}`}
      >
        {status === Status.LOADING || hasHistory ? (
          history.map((h: HistoryMessage, i: number) => {
            if (h.role === 'user')
              return <ChatQuestion key={i} text={h.content} />;
            else if (h.role === 'assistant')
              return (
                <ChatAnswer
                  key={i}
                  text={h.content}
                  isGenerating={status === Status.GENERATING}
                />
              );
            else return null;
          })
        ) : (
          <h2 className='px-4 text-center text-4xl font-bold'>
            Ask any question about your notes
          </h2>
        )}
        {status === Status.LOADING && (
          <div className='flex w-full max-w-2xl items-center justify-start'>
            <span className='mx-2 block h-2 w-2 animate-ping rounded-full bg-base-300 align-middle' />
          </div>
        )}
        <ChatInput
          onSubmit={handleSubmit}
          onStop={console.log}
          isGenerating={status === Status.GENERATING}
          className={hasHistory ? 'sticky bottom-8' : ''}
        />
      </div>
    </section>
  );
};

export default ChatTab;
