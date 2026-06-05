import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Pre-process content to find raw image URLs (not inside markdown syntax) and turn them into images.
  const preprocessUrlToImage = (text: string) => {
    // Handles:
    // - plain "https://.../img.jpg" on its own line OR inside text
    // - optional query strings
    // - common trailing punctuation (.,;:) and closing parens
    //
    // If you paste an image URL alone, it should reliably render as an image.
    const regex = /https?:\/\/[^\s<]+?\.(?:jpeg|jpg|gif|png|webp|svg)(?:\?[^\s<]*)?/gi;

    return text.replace(regex, (match: string) => {
      // Strip common trailing punctuation from the matched part when present in the lookahead.
      const trimmed = match.replace(/[.,;:!?]+$/, '');
      const url = trimmed.length !== match.length ? trimmed : match;

      return url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|svg)(\?|$)/i)
        ? `![](${url})`
        : match;
    });
  };

  const processedContent = preprocessUrlToImage(content);

  return (
    <div className="prose prose-invert max-w-none prose-img:rounded-xl prose-img:shadow-md">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({node, ...props}) => {
            const href = props.href || '';
            if (href.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i)) {
              return <img src={href} alt={props.children?.toString() || 'Image link'} style={{ maxWidth: '100%', height: 'auto' }} />;
            }
            return <a {...props} className="text-[var(--color-brand)] hover:underline" target="_blank" rel="noopener noreferrer">{props.children}</a>;
          },
          img: ({node, ...props}) => {
            const altParts = props.alt?.split('|');
            let width = undefined;
            let height = undefined;
            
            if (altParts && altParts.length > 1) {
              const dims = altParts[1].split('x');
              if (dims.length === 2) {
                width = dims[0];
                height = dims[1];
              } else if (dims.length === 1) {
                width = dims[0];
              }
              props.alt = altParts[0];
            }
            
            return <img {...props} width={width} height={height} style={{ maxWidth: '100%', height: 'auto', ...((width || height) ? { objectFit: 'cover' } : {}) }} />;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
