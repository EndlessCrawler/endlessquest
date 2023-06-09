import { typeDefs } from './crdt-type.js'

// @ts-ignore
export const getParentPathIndex = (typeDef, crdt, pathIndex) => {
  const currentIndices = typeDef.parentIndices[pathIndex]
  for (let i = 0; i < currentIndices.length; i++) {
    const parentPathIndex = currentIndices[i]
    const version = crdt[currentIndices[i]]
    if (version !== undefined) {
      return parentPathIndex
    }
  }

  return -1
}

// @ts-ignore
export const getIndicesBetween = (typeDef, parentPathIndex, pathIndex) => {
  const indices = []
  const currentIndices = typeDef.parentIndices[pathIndex]

  for (let i = 1; i < currentIndices.length; i++) {
    if (currentIndices[i] === parentPathIndex) {
      return indices
    }
    indices.push(i)
  }
  return indices
}

// @ts-ignore
export const shouldReplace = ([seq, agentId], [seq2, agentId2]) =>
  seq2 > seq || (seq2 === seq && agentId2 > agentId)

// @ts-ignore
export const parentVersionMatches = (crdt, parentPathIndex, parentVersion) => {
  const field = crdt[parentPathIndex]

  return (
    field !== undefined &&
    field[0] === parentVersion[0] &&
    field[1] === parentVersion[1]
  )
}

// @ts-ignore
export const deepCopy = (obj) => JSON.parse(JSON.stringify(obj))

// @ts-ignore
export const setValueAtPath = (obj, path, value) => {
  let current = obj
  for (let i = 0; i < path.length - 1; i++) {
    current = current[path[i]]
  }
  current[path[path.length - 1]] = value
}

// @ts-ignore
export const getValueAtPath = (obj, path) => {
  let current = obj
  for (let i = 0; i < path.length; i++) {
    current = current[path[i]]
  }
  return current
}

// @ts-ignore
export const removeChildVersions = (typeDef, crdt, pathIndex) => {
  const indices = typeDef.childIndices[pathIndex]
  for (let i = 0; i < typeDef.childIndices.length; i++) {
    const childIndex = indices[i]
    delete crdt[childIndex]
  }
}

// @ts-ignore
export const applyOp = (op, crdts, documents) => {
  const {
    type,
    key,
    parentVersion,
    parentPathIndex,
    version,
    pathIndex,
    value,
  } = op

  const crdt = crdts[key]

  if (!crdt) {
    if (pathIndex !== 0) {
      return false
    }

    if ((parentVersion !== undefined && parentVersion !== null) || (parentPathIndex !== undefined && parentPathIndex !== -1)) {
      return false
    }

    crdts[key] = {
      [pathIndex]: deepCopy(version),
    }

    documents[key] = deepCopy(value)

    return true
  } else {
    if (crdt[pathIndex] === undefined || shouldReplace(crdt[pathIndex], version)) {
      if (pathIndex === 0) {
        crdts[key] = {
          [pathIndex]: deepCopy(version),
        }
    
        documents[key] = deepCopy(value)

        return true
      }

      // need to check all parent indices between parentPathIndex and pathIndex
      if (!parentVersionMatches(crdt, parentPathIndex, parentVersion)) {
        return false
      }

      // @ts-ignore
      const typeDef = typeDefs[type]

      const indicesBetween = getIndicesBetween(typeDef, parentPathIndex, pathIndex)
      for (let i = 0; i < indicesBetween.length; i++) {
        const index = indicesBetween[i]
        if (crdt[index] !== undefined) {
          return false
        }
      }

      crdt[pathIndex] = deepCopy(version)
      removeChildVersions(typeDef, crdt, pathIndex)
      const document = documents[key]
      setValueAtPath(document, typeDef.paths[pathIndex], deepCopy(value))
      return true
    }

    return false
  }
}

// @ts-ignore
export const createOp = (crdts, type, key, path, version, value) => {
  // @ts-ignore
  const typeDef = typeDefs[type]
  const pathIndex = typeDef.indices[path]

  if (path === '/') {
    return {
      type,
      key,
      version,
      pathIndex,
      value,
    }
  }

  // @ts-ignore
  const parentPathIndex = getParentPathIndex(typeDefs[type], crdts[key], pathIndex)

  if (parentPathIndex === -1) {
    throw new Error('Invalid operation')
  }

  const parentVersion = crdts[key][parentPathIndex]

  return {
    type,
    key,
    parentVersion,
    parentPathIndex,
    version,
    pathIndex,
    value,
  }
}
