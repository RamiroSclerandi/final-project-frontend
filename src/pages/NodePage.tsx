import { useParams } from 'react-router-dom'

import { NodeContainer } from '../features/node'

/**
 * Node detail route (`/nodes/:id`, ui-redesign PR-6), replacing the
 * coming-soon placeholder. Mounted as a child of the app shell -- its own
 * landmark is the shell's `<main>`, not this page's.
 */
export function NodePage() {
  // Always present: the route is only matched as /nodes/:id.
  const { id } = useParams<{ id: string }>() as { id: string }

  return <NodeContainer deviceId={id} />
}
