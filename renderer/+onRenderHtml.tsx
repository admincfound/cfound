import React from 'react'
import ReactDOM from 'react-dom/client'

export async function onRenderClient(pageContext: any) {
  const { Page } = pageContext

  ReactDOM.hydrateRoot(
    document.getElementById('root')!,
    <Page {...pageContext} />
  )
}