#!/usr/bin/env node
// Throwaway mosquitto broker for the REQ-RC-8 end-to-end test (closing
// sequence, obs #382/#383). Runs on the same container network
// `supabase start` creates, so the Edge Function's MQTT_WS_URL
// (ws://mosquitto:9001) resolves it by container name -- the spike
// (obs #383) proved a host-bound broker is unreachable from the edge
// runtime container here, so the broker has to live on that network
// instead. Docker is tried first (GitHub Actions runners), then Podman
// (this machine): whichever engine started Supabase's containers is the one
// that can join their network.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const BACKEND_DIR = join(REPO_ROOT, '.supabase-backend')
const MOSQUITTO_CONF = join(__dirname, 'mosquitto-test.conf')
const CONTAINER_NAME = 'mosquitto'
const BROKER_WS_PORT = 9001

export function readProjectId(backendRoot) {
  const configPath = join(backendRoot, 'supabase', 'config.toml')
  const content = readFileSync(configPath, 'utf8')
  const match = content.match(/^project_id\s*=\s*"([^"]+)"/m)
  if (!match) {
    throw new Error(`project_id not found in ${configPath}`)
  }
  return match[1]
}

export function networkNameForProject(projectId) {
  return `supabase_network_${projectId}`
}

function resolveContainerEngine() {
  for (const engine of ['docker', 'podman']) {
    try {
      execFileSync(engine, ['--version'], { stdio: 'ignore' })
      return engine
    } catch {
      // try the next engine
    }
  }
  throw new Error('Neither docker nor podman is available on PATH')
}

function removeIfExists(engine) {
  try {
    execFileSync(engine, ['rm', '-f', CONTAINER_NAME], { stdio: 'ignore' })
  } catch {
    // nothing to remove
  }
}

// The config is written inside the container via a quoted heredoc (no
// variable expansion) instead of a bind mount, so this works identically
// whether the host path is a Windows path (Podman Machine) or a Linux path
// (Docker in CI) -- no path-translation to get wrong either way.
function startCommand() {
  const config = readFileSync(MOSQUITTO_CONF, 'utf8')
  return [
    `cat <<'MOSQUITTO_CONF' > /mosquitto/config/mosquitto.conf`,
    config,
    'MOSQUITTO_CONF',
    'exec mosquitto -c /mosquitto/config/mosquitto.conf',
  ].join('\n')
}

function startBroker() {
  const engine = resolveContainerEngine()
  const network = networkNameForProject(readProjectId(BACKEND_DIR))
  removeIfExists(engine)
  execFileSync(
    engine,
    [
      'run',
      '-d',
      '--name',
      CONTAINER_NAME,
      '--network',
      network,
      '-p',
      `${BROKER_WS_PORT}:${BROKER_WS_PORT}`,
      'eclipse-mosquitto:2',
      'sh',
      '-c',
      startCommand(),
    ],
    { stdio: 'inherit' },
  )
  console.log(`test-broker: mosquitto started on network ${network}`)
}

function stopBroker() {
  const engine = resolveContainerEngine()
  removeIfExists(engine)
  console.log('test-broker: mosquitto stopped')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const command = process.argv[2]
  try {
    if (command === 'start') startBroker()
    else if (command === 'stop') stopBroker()
    else {
      console.error('Usage: node scripts/test-broker.mjs <start|stop>')
      process.exit(1)
    }
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
