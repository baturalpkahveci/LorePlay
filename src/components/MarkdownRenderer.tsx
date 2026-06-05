import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const isLikelyImageUrl = (url: string) => {
  const cleanUrl = url.toLowerCase().replace(/[.,;:!?]+$/, '');
  const hasImageExtension = /\.(?:avif|jpeg|jpg|gif|png|webp|svg)(?:[?#].*)?$/.test(cleanUrl);
  const looksLikeImageHost = /(steamuserimages|steamstatic|akamaihd|cdn\.akamai|screenshots?|images?|media)/i.test(cleanUrl);

  return hasImageExtension || looksLikeImageHost;
};

const normalizeImageUrl = (url: string) => url.replace(/[.,;:!?]+$/, '');

const preprocessUrlToImage = (text: string) => {
  const urlPattern = /https?:\/\/[^\s<>)]+/gi;

  return text.replace(urlPattern, (match, offset, fullText) => {
    const previous = fullText.slice(Math.max(0, offset - 3), offset);

    if (previous.includes('](') || previous.includes('![') || !isLikelyImageUrl(match)) {
      return match;
    }

    const url = normalizeImageUrl(match);
    const trailing = match.slice(url.length);

    return `![](${url})${trailing}`;
  });
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const processedContent = preprocessUrlToImage(content);

  return (
    <div className="prose prose-invert max-w-none prose-img:rounded-lg prose-img:border prose-img:border-[var(--border-color)] prose-img:shadow-lg prose-img:shadow-black/20">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ ...props }) => {
            const href = props.href || '';
            if (isLikelyImageUrl(href)) {
              return <img src={href} alt={props.children?.toString() || 'Image link'} loading="lazy" style={{ maxWidth: '100%', height: 'auto' }} />;
            }

            return <a {...props} className="text-[var(--color-brand)] hover:underline" target="_blank" rel="noopener noreferrer">{props.children}</a>;
          },
          img: ({ ...props }) => {
            const altParts = props.alt?.split('|').map((part) => part.trim());
            let width: string | undefined;
            let height: string | undefined;

            if (altParts && altParts.length > 1) {
              const dims = altParts[1].split('x').map((part) => part.trim()).filter(Boolean);
              width = dims[0];
              height = dims[1];
              props.alt = altParts[0];
            }

            return (
              <img
                {...props}
                width={width}
                height={height}
                loading="lazy"
                style={{
                  maxWidth: '100%',
                  height: height ? undefined : 'auto',
                  objectFit: width || height ? 'cover' : undefined
                }}
              />
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
