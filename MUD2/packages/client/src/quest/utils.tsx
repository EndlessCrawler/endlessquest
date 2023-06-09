import { Entity } from "@latticexyz/recs"

export const agentToCoord = (storeCache: { tables: { Agent: { get: (arg0: { key: Entity }) => any } } } , agentEntity: Entity) => {
  const agent = storeCache.tables.Agent.get({ key: agentEntity })
  return agent ? BigInt(agent.coord) : null
}
