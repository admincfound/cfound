import ReactDOMServer from 'react-dom/server'

export async function onRenderHtml(pageContext: any) {
  const { Page } = pageContext

  const html = ReactDOMServer.renderToString(
    <Page {...pageContext} />
  )

  return {
    documentHtml: `<!DOCTYPE html>
<html>
<head>
<meta charSet="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
<div id="root">${html}</div>
</body>
</html>`
  }
}