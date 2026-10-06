import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../shared/test/renderWithProviders'
import { DeviceConfigContainer } from './DeviceConfigContainer'

const useDevicesMock = vi.hoisted(() => vi.fn())
const useUpdateDeviceMock = vi.hoisted(() => vi.fn())
const useUpdateSensorMock = vi.hoisted(() => vi.fn())

vi.mock('../application/useDevices', () => ({ useDevices: useDevicesMock }))
vi.mock('../application/useUpdateDevice', () => ({
  useUpdateDevice: useUpdateDeviceMock,
}))
vi.mock('../application/useUpdateSensor', () => ({
  useUpdateSensor: useUpdateSensorMock,
}))

describe('DeviceConfigContainer', () => {
  it('shows no device form while devices are being fetched', () => {
    useDevicesMock.mockReturnValue({ data: undefined, isLoading: true })
    useUpdateDeviceMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('renders the matching device once loaded', () => {
    useDevicesMock.mockReturnValue({
      data: [
        {
          id: 'device-1',
          macAddress: 'AABBCCDDEEFF',
          name: 'Kitchen node',
          locationRef: null,
          transport: 'wifi-mqtt',
          provisioned: true,
          sensors: [],
        },
      ],
      isLoading: false,
    })
    useUpdateDeviceMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    expect(screen.getByDisplayValue('Kitchen node')).toBeInTheDocument()
  })

  it('renders nothing for a deviceId not present in the fetched devices', () => {
    useDevicesMock.mockReturnValue({ data: [], isLoading: false })
    useUpdateDeviceMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })
    useUpdateSensorMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    })

    const { container } = renderWithProviders(
      <DeviceConfigContainer deviceId="device-unknown" />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('shows an error on the device form when its update fails', async () => {
    mockDeviceWithSensor()
    useUpdateDeviceMock.mockReturnValue(
      idleMutation(vi.fn().mockRejectedValue(new Error('boom'))),
    )
    useUpdateSensorMock.mockReturnValue(idleMutation())

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    const nameInput = screen.getByLabelText(/name/i)
    fireEvent.change(nameInput, { target: { value: 'Renamed node' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    const alert = await screen.findByRole('alert')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(alert).toHaveTextContent('Could not save changes. Try again.')
    expect(
      nameInput.compareDocumentPosition(alert) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      screen.getByLabelText(/label/i).compareDocumentPosition(alert) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy()
  })

  it('shows an error on the sensor form when its update fails', async () => {
    mockDeviceWithSensor()
    useUpdateDeviceMock.mockReturnValue(idleMutation())
    useUpdateSensorMock.mockReturnValue(
      idleMutation(vi.fn().mockRejectedValue(new Error('boom'))),
    )

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    const labelInput = screen.getByLabelText(/label/i)
    fireEvent.change(labelInput, { target: { value: 'Freezer temp' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    const alert = await screen.findByRole('alert')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(alert).toHaveTextContent('Could not save changes. Try again.')
    expect(
      labelInput.compareDocumentPosition(alert) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('dismisses the error and resets both mutations when Dismiss is clicked (REQ-CFG-4)', async () => {
    const deviceMutation = idleMutation(
      vi.fn().mockRejectedValue(new Error('boom')),
    )
    const sensorMutation = idleMutation()
    mockDeviceWithSensor()
    useUpdateDeviceMock.mockReturnValue(deviceMutation)
    useUpdateSensorMock.mockReturnValue(sensorMutation)

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Renamed node' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))

    expect(screen.queryByRole('alert')).toBeNull()
    expect(deviceMutation.reset).toHaveBeenCalledOnce()
    expect(sensorMutation.reset).toHaveBeenCalledOnce()
  })

  it('saves the edited device and the edited sensor with one footer Save, each with its own payload', () => {
    const mutateDevice = vi.fn().mockResolvedValue(undefined)
    const mutateSensor = vi.fn().mockResolvedValue(undefined)
    mockDeviceWithSensor()
    useUpdateDeviceMock.mockReturnValue(idleMutation(mutateDevice))
    useUpdateSensorMock.mockReturnValue(idleMutation(mutateSensor))

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Renamed node' },
    })
    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: 'Freezer temp' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(mutateDevice).toHaveBeenCalledOnce()
    expect(mutateDevice).toHaveBeenCalledWith({
      deviceId: 'device-1',
      update: {
        name: 'Renamed node',
        location_ref: null,
        transport: 'wifi-mqtt',
        provisioned: true,
      },
    })
    expect(mutateSensor).toHaveBeenCalledOnce()
    expect(mutateSensor).toHaveBeenCalledWith({
      sensorId: 'sensor-1',
      update: { label: 'Freezer temp', pin_connection: 'GPIO4' },
    })
  })

  it('sends nothing while the required device name is empty', () => {
    const mutateDevice = vi.fn().mockResolvedValue(undefined)
    const mutateSensor = vi.fn().mockResolvedValue(undefined)
    mockDeviceWithSensor()
    useUpdateDeviceMock.mockReturnValue(idleMutation(mutateDevice))
    useUpdateSensorMock.mockReturnValue(idleMutation(mutateSensor))

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(mutateDevice).not.toHaveBeenCalled()
    expect(mutateSensor).not.toHaveBeenCalled()
  })

  it('does not call a mutation for a form left untouched', () => {
    const mutateDevice = vi.fn().mockResolvedValue(undefined)
    const mutateSensor = vi.fn().mockResolvedValue(undefined)
    mockDeviceWithSensor()
    useUpdateDeviceMock.mockReturnValue(idleMutation(mutateDevice))
    useUpdateSensorMock.mockReturnValue(idleMutation(mutateSensor))

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Renamed node' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(mutateDevice).toHaveBeenCalledOnce()
    expect(mutateSensor).not.toHaveBeenCalled()
  })

  it('keeps the footer Save disabled while any update is still pending', () => {
    mockDeviceWithTwoSensors()
    useUpdateDeviceMock.mockReturnValue(idleMutation())
    useUpdateSensorMock.mockReturnValue(
      idleMutation(
        vi.fn((variables: { sensorId: string }) =>
          variables.sensorId === 'sensor-1'
            ? new Promise<void>(() => {})
            : Promise.resolve(),
        ),
      ),
    )

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    const [firstLabel, secondLabel] = getSensorLabelInputs()
    fireEvent.change(firstLabel, { target: { value: 'Freezer temp' } })
    fireEvent.change(secondLabel, { target: { value: 'Pantry temp' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('shows the failure of the first edited sensor even when the last sensor succeeds', async () => {
    mockDeviceWithTwoSensors()
    useUpdateDeviceMock.mockReturnValue(idleMutation())
    const mutateAsyncSensor = vi.fn((variables: { sensorId: string }) =>
      variables.sensorId === 'sensor-1'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve(),
    )
    useUpdateSensorMock.mockReturnValue(idleMutation(mutateAsyncSensor))

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    const [firstLabel, secondLabel] = getSensorLabelInputs()
    fireEvent.change(firstLabel, { target: { value: 'Freezer temp' } })
    fireEvent.change(secondLabel, { target: { value: 'Pantry temp' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    const alert = await screen.findByRole('alert')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(alert).toHaveTextContent('Could not save changes. Try again.')
    expect(mutateAsyncSensor).toHaveBeenCalledTimes(2)
    // The alert sits between the first sensor's field and the second one's.
    expect(
      firstLabel.compareDocumentPosition(alert) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      secondLabel.compareDocumentPosition(alert) &
        Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy()
  })

  it('re-enables Save once every in-flight update has resolved', async () => {
    const device = deferred()
    const sensor = deferred()
    mockDeviceWithSensor()
    useUpdateDeviceMock.mockReturnValue(
      idleMutation(vi.fn().mockReturnValue(device.promise)),
    )
    useUpdateSensorMock.mockReturnValue(
      idleMutation(vi.fn().mockReturnValue(sensor.promise)),
    )

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Renamed node' },
    })
    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: 'Freezer temp' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()

    device.resolve()
    await Promise.resolve()
    sensor.resolve()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save/i })).toBeEnabled(),
    )
  })

  it('re-enables Save once all updates settle when one rejects and another resolves', async () => {
    const device = deferred()
    const sensor = deferred()
    mockDeviceWithSensor()
    useUpdateDeviceMock.mockReturnValue(
      idleMutation(vi.fn().mockReturnValue(device.promise)),
    )
    useUpdateSensorMock.mockReturnValue(
      idleMutation(vi.fn().mockReturnValue(sensor.promise)),
    )

    renderWithProviders(<DeviceConfigContainer deviceId="device-1" />)

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Renamed node' },
    })
    fireEvent.change(screen.getByLabelText(/label/i), {
      target: { value: 'Freezer temp' },
    })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()

    device.reject(new Error('boom'))
    sensor.resolve()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save/i })).toBeEnabled(),
    )
  })

  it('closes through onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    mockDeviceWithSensor()
    useUpdateDeviceMock.mockReturnValue(idleMutation())
    useUpdateSensorMock.mockReturnValue(idleMutation())

    renderWithProviders(
      <DeviceConfigContainer deviceId="device-1" onCancel={onCancel} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalledOnce()
  })
})

function deferred() {
  let resolve!: () => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function getSensorLabelInputs(): [HTMLElement, HTMLElement] {
  const [first, second] = screen.getAllByLabelText(/label/i)
  if (!first || !second) {
    throw new Error('Expected two sensor label inputs')
  }
  return [first, second]
}

function idleMutation(
  mutateAsync: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue(undefined),
) {
  return { mutateAsync, isPending: false, isError: false, reset: vi.fn() }
}

function mockDeviceWithTwoSensors() {
  useDevicesMock.mockReturnValue({
    data: [
      {
        id: 'device-1',
        macAddress: 'AABBCCDDEEFF',
        name: 'Kitchen node',
        locationRef: null,
        transport: 'wifi-mqtt',
        provisioned: true,
        sensors: [
          {
            id: 'sensor-1',
            label: 'Fridge temp',
            pinConnection: 'GPIO4',
            source: 'DHT22',
            tag: '',
          },
          {
            id: 'sensor-2',
            label: 'Oven temp',
            pinConnection: 'GPIO5',
            source: 'DHT22',
            tag: '',
          },
        ],
      },
    ],
    isLoading: false,
  })
}

function mockDeviceWithSensor() {
  useDevicesMock.mockReturnValue({
    data: [
      {
        id: 'device-1',
        macAddress: 'AABBCCDDEEFF',
        name: 'Kitchen node',
        locationRef: null,
        transport: 'wifi-mqtt',
        provisioned: true,
        sensors: [
          {
            id: 'sensor-1',
            label: 'Fridge temp',
            pinConnection: 'GPIO4',
            source: 'DHT22',
            tag: '',
          },
        ],
      },
    ],
    isLoading: false,
  })
}
