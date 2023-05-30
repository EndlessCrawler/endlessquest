import { useStore } from "../store"
import { Wrapper } from "./Wrapper"
import { LoadingScreen } from "./LoadingScreen"
import { GameUI } from "../quest/components/GameUI"
import { BridgeProvider } from '../quest/hooks/BridgeContext'
import { MetadataProvider } from '../quest/hooks/MetadataContext'

export const UIRoot = () => {
  const layers = useStore((state) => {
    return {
      networkLayer: state.networkLayer,
      phaserLayer: state.phaserLayer,
    }
  })

  if (!layers.networkLayer || !layers.phaserLayer) return <></>

  return (
    <div className='FillParent'>
      <Wrapper>
        <LoadingScreen />
      </Wrapper>
      <BridgeProvider systemCalls={layers.networkLayer.systemCalls}>
        <MetadataProvider systemCalls={layers.networkLayer.systemCalls}>
          <GameUI />
        </MetadataProvider>
      </BridgeProvider>
    </div>
  )
}
