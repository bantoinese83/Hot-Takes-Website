import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  content: string;
  className?: string;
};

export function IntelMarkdown({ content, className = '' }: Props) {
  if (!content.trim()) return null;

  return (
    <div className={`intel-markdown ${className}`.trim()}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h3 className="intel-md-h1">{children}</h3>,
          h2: ({ children }) => <h4 className="intel-md-h2">{children}</h4>,
          h3: ({ children }) => <h5 className="intel-md-h3">{children}</h5>,
          h4: ({ children }) => <h6 className="intel-md-h4">{children}</h6>,
          p: ({ children }) => <p className="intel-md-p">{children}</p>,
          ul: ({ children }) => <ul className="intel-md-ul">{children}</ul>,
          ol: ({ children }) => <ol className="intel-md-ol">{children}</ol>,
          li: ({ children }) => <li className="intel-md-li">{children}</li>,
          strong: ({ children }) => <strong className="intel-md-strong">{children}</strong>,
          em: ({ children }) => <em className="intel-md-em">{children}</em>,
          code: ({ className: codeClass, children }) =>
            codeClass ? (
              <code className={`intel-md-code-block ${codeClass}`}>{children}</code>
            ) : (
              <code className="intel-md-code">{children}</code>
            ),
          pre: ({ children }) => <pre className="intel-md-pre">{children}</pre>,
          hr: () => <hr className="intel-md-hr" />,
          a: ({ href, children }) => (
            <a href={href} className="intel-md-link" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          blockquote: ({ children }) => <blockquote className="intel-md-quote">{children}</blockquote>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
