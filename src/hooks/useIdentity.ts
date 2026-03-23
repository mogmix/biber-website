import { useState } from 'react'

export function useIdentity() {
  const [browserId] = useState<string>(() => {
    let id = localStorage.getItem('biber_browser_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('biber_browser_id', id)
    }
    return id
  })

  const [nickname, setNicknameState] = useState<string>(() => {
    return localStorage.getItem('biber_nickname') ?? ''
  })

  function setNickname(name: string) {
    localStorage.setItem('biber_nickname', name)
    setNicknameState(name)
  }

  return { browserId, nickname, setNickname }
}
