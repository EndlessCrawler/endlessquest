import { useEffect, useMemo, useState } from 'react'
import { ChatCompletionRequestMessageRoleEnum } from 'openai'
import { ChatRequest } from './ChatRequest'
import { useHyperspaceContext } from '../hyperspace/hooks/HyperspaceContext'
import { ChatHistory } from 'questagent'
import { useDocument } from 'hyperbox-sdk'

export const ChatDialog = ({
  // @ts-ignore
  store,
  realmCoord = 1n,    // real coord, always 1n until we implement multiple Realms
  chamberSlug = '',   // chamber coord
  playerName = 'Player',
  isChatting = false,
  onStopChatting = () => {},
}) => {
  const [history, setHistory] = useState<ChatHistory>([])
  const [prompt, setPrompt] = useState('')
  const [isRequesting, setIsRequesting] = useState(false)
  const [isHalted, setIsHalted] = useState(false)
  const [timestamp, setTimestamp] = useState(0)
  const { QuestMessages } = useHyperspaceContext()

  useEffect(() => {
    if (isChatting) {
      setHistory([])
      setIsRequesting(true)
      setIsHalted(false)
      setTimestamp(Date.now())
    }
  }, [isChatting])

  const metadata = useDocument('questAgent', chamberSlug, store)
  // console.log(`------ GOT METADATA`, chamberSlug, metadata)

  const agentName = useMemo(() => (metadata?.name ?? '[no agent metadata]'), [metadata])
  const agentMetadata = useMemo(() => (metadata?.metadata ?? null), [metadata])

  const _makeTopic = (key: string, role: ChatCompletionRequestMessageRoleEnum, content: string) => {
    const isAgent = (role == ChatCompletionRequestMessageRoleEnum.Assistant)
    const className = isAgent ? 'AgentTopic' : 'UserTopic'
    return (
      <div key={key} className={className}>
        <div className='Importanter'>{isAgent ? agentName : playerName}</div>
        <div>{content}</div>
      </div>
    )
  }

  const topics = useMemo(() => {
    let result = []
    for (let i = isHalted ? 0 : 4; i < history.length; ++i) {
      const h = history[i]
      // const isAgent = (h.role == ChatCompletionRequestMessageRoleEnum.Assistant)
      // const className = isAgent ? 'AgentTopic' : 'UserTopic'
      result.push(_makeTopic(`t_${i}`, h.role, h.content))
    }
    return result
  }, [history])

  const _submit = () => {
    setIsRequesting(true)
  }

  const _onDone = (newHistory: ChatHistory, error: string | null) => {
    setIsRequesting(false)
    setPrompt('')
    if (error) {
      setHistory([
        { role: ChatCompletionRequestMessageRoleEnum.Assistant, content: error },
      ])
      setIsHalted(true)
    } else {
      setHistory(newHistory)
      QuestMessages.updateMessages(timestamp, realmCoord, chamberSlug, playerName, newHistory)
    }
  }

  const waitingToSubmit = (!isRequesting && !isHalted)
  const canSubmit = (waitingToSubmit && prompt.length > 0)

  if (!isChatting) {
    return <></>
  }

  return (
    <>
      <div className='FadedCover' onClick={() => onStopChatting()} />

      <div className='FillScreen CenteredContainer'>
        <div className='ChatDialog'>

          <div className='ChatContent'>
            {topics.length > 0 &&
              <p className='Smaller'>chat id: {timestamp}</p>
            }
            {topics}
            {isRequesting &&
              <div>
                {history.length > 0 && _makeTopic('prompt', ChatCompletionRequestMessageRoleEnum.User, prompt)}
                <ChatRequest prompt={prompt} previousHistory={history} onDone={_onDone} agentMetadata={agentMetadata} />
              </div>
            }
            {waitingToSubmit &&
              <div className='Infos'>{agentName} is waiting for your answer...</div>
            }
          </div>

          <div className='ChatInputRow'>
            <input disabled={isRequesting} className='ChatInput' value={prompt} onChange={(e) => setPrompt(e.target.value)}></input>
            <button disabled={!canSubmit} className='ChatSubmit' onClick={() => _submit()}>Answer</button>
          </div>

        </div>
      </div>

    </>
  )
}
