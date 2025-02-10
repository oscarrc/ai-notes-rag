import { validateUrl } from '@/app/_utils/url';
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';

type LinkPluginProps = {
  hasLinkAttributes?: boolean;
};

const LinkPlugin = ({ hasLinkAttributes = false }: LinkPluginProps) => (
  <LexicalLinkPlugin
    validateUrl={validateUrl}
    attributes={
      hasLinkAttributes
        ? {
            rel: 'noopener noreferrer',
            target: '_blank',
          }
        : undefined
    }
  />
);
export default LinkPlugin;
