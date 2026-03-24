import { useState } from 'react'

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private browsing or storage quota exceeded — silently ignore
  }
}

export function useIdentity() {
  const [browserId] = useState<string>(() => {
    let id = lsGet('biber_browser_id')
    if (!id) {
      id = crypto.randomUUID()
      lsSet('biber_browser_id', id)
    }
    return id
  })

  const [nickname, setNicknameState] = useState<string>(() => {
    return lsGet('biber_nickname') ?? ''
  })

  function setNickname(name: string) {
    lsSet('biber_nickname', name)
    setNicknameState(name)
  }

  return { browserId, nickname, setNickname }
}
