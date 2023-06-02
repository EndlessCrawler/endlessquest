import React, { useMemo } from 'react'
import { useMUD } from '../../store'
import { useRow } from '@latticexyz/react'
import { useRealmMetadata } from './MetadataContext'

export const useRealm = (coord: bigint) => {
  const {
    networkLayer: {
      storeCache,
    }
  } = useMUD()

  const realmRow = useRow(storeCache, { table: 'Realm', key: { coord } })
  const realm = useMemo(() => (realmRow?.value ?? null), [realmRow])
  const opener = realm?.opener ?? null
  const realmExists = opener ?? false

  const { metadata, isFetching: metadataIsFetching, isError: metadataIsError } = useRealmMetadata(coord)

  // const { url } = useChamberProfileImage(coord)
  const url = null

  return {
    realmExists,
    opener,
    metadata: metadata ?? null,
    metadataIsFetching,
    metadataIsError,
    url: url ?? null,
  }
}
