import { renderToString } from 'react-dom/server';

import createEmotionCache from './src/createEmotionCache';
import StylesContext from './src/StylesContext';
import theme from './src/theme';

import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { EntryContext } from '@remix-run/node';
import { RemixServer } from '@remix-run/react';

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  const MuiRemixServer = () => (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <RemixServer context={remixContext} url={request.url} />
      </ThemeProvider>
    </CacheProvider>
  );

  // Render the component to a string.
  const html = renderToString(
    <StylesContext.Provider value={null}>
      <MuiRemixServer />
    </StylesContext.Provider>
  );

  // Grab the CSS from emotion
  const emotionChunks = extractCriticalToChunks(html);

  // Re-render including the extracted css.
  const markup = renderToString(
    <StylesContext.Provider value={emotionChunks.styles}>
      <MuiRemixServer />
    </StylesContext.Provider>
  );

  responseHeaders.set('Content-Type', 'text/html');

  return new Response(`<!DOCTYPE html>${markup}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
